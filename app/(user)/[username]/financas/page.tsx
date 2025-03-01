'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@context/userContext';
import { useParams } from 'next/navigation';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    where,
    query,
    Timestamp
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import toast from 'react-hot-toast';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

// Types
interface Friend {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    photoURL?: string;
}

interface CostGroup {
    id: string;
    name: string;
    description: string;
    createdBy: string;
    members: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface Expense {
    id: string;
    groupId: string;
    name: string;
    description?: string;
    amount: number;
    paidBy: string;
    date: Timestamp;
    category: string;
    split: {
        [userId: string]: number; // Percentage of the expense
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface Balance {
    userId: string;
    name: string;
    amount: number;
}

// Categories
const expenseCategories = [
    'Alimentação',
    'Moradia',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Viagem',
    'Compras',
    'Presente',
    'Serviços',
    'Outros'
];

export default function FinancasPage() {
    const { userData, loading } = useUser();
    const { username } = useParams();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [costGroups, setCostGroups] = useState<CostGroup[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);

    // Form states
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

    // New expense form
    const [newExpenseName, setNewExpenseName] = useState('');
    const [newExpenseDescription, setNewExpenseDescription] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0);
    const [newExpensePaidBy, setNewExpensePaidBy] = useState('');
    const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [newExpenseCategory, setNewExpenseCategory] = useState(expenseCategories[0]);
    const [newExpenseSplits, setNewExpenseSplits] = useState<{ [key: string]: number }>({});

    // Load data
    useEffect(() => {
        if (userData) {
            loadFriends();
            loadCostGroups();
        }
    }, [userData]);

    useEffect(() => {
        if (selectedGroup) {
            loadExpenses(selectedGroup);
        }
    }, [selectedGroup]);

    // Load user's friends
    const loadFriends = async () => {
        try {
            // Query the nested friendsList collection
            if (!userData?.uid) return;
            
            const friendsRef = collection(db, 'friends', userData.uid, 'friendsList');
            const snapshot = await getDocs(friendsRef);

            const friendsData: Friend[] = [];
            snapshot.forEach((doc) => {
                const friendData = doc.data();
                friendsData.push({
                    id: doc.id,
                    username: friendData.username,
                    firstName: friendData.firstName || '',
                    lastName: friendData.lastName || '',
                    photoURL: friendData.photoURL
                });
            });
            
            setFriends(friendsData);
            console.log('Friends loaded successfully:', friendsData);
        } catch (error) {
            console.error('Error loading friends:', error);
            toast.error('Erro ao carregar amigos');
        }
    };

    // Load user's cost groups
    const loadCostGroups = async () => {
        try {
            const groupsQuery = query(
                collection(db, 'cost_groups'),
                where('members', 'array-contains', userData?.uid)
            );

            const snapshot = await getDocs(groupsQuery);
            const groups: CostGroup[] = [];

            snapshot.forEach(doc => {
                groups.push({
                    id: doc.id,
                    ...doc.data()
                } as CostGroup);
            });

            setCostGroups(groups);

            if (groups.length > 0 && !selectedGroup) {
                setSelectedGroup(groups[0].id);
            }
        } catch (error) {
            console.error('Error loading cost groups:', error);
            toast.error('Erro ao carregar grupos de despesas');
        }
    };

    // Load expenses for the selected group
    const loadExpenses = async (groupId: string) => {
        try {
            const expensesQuery = query(
                collection(db, 'expenses'),
                where('groupId', '==', groupId)
            );

            const snapshot = await getDocs(expensesQuery);
            const expenseList: Expense[] = [];

            snapshot.forEach(doc => {
                expenseList.push({
                    id: doc.id,
                    ...doc.data()
                } as Expense);
            });

            setExpenses(expenseList);
            calculateBalances(expenseList);
        } catch (error) {
            console.error('Error loading expenses:', error);
            toast.error('Erro ao carregar despesas');
        }
    };

    // Calculate balances for all group members
    const calculateBalances = (expenseList: Expense[]) => {
        if (!selectedGroup) return;

        const group = costGroups.find(g => g.id === selectedGroup);
        if (!group) return;

        const memberBalances: { [key: string]: number } = {};

        // Initialize all members with zero balance
        group.members.forEach(memberId => {
            memberBalances[memberId] = 0;
        });

        // Calculate each expense
        expenseList.forEach(expense => {
            // Add the full amount to the person who paid
            memberBalances[expense.paidBy] += expense.amount;

            // Subtract each person's share
            for (const [userId, percentage] of Object.entries(expense.split)) {
                memberBalances[userId] -= (expense.amount * percentage / 100);
            }
        });

        // Convert to balance array with names
        const balanceArray: Balance[] = [];

        for (const [userId, amount] of Object.entries(memberBalances)) {
            let name = userId;

            // Get user name
            if (userId === userData?.uid) {
                name = `${userData.firstName} ${userData.lastName} (Você)`;
            } else {
                const friend = friends.find(f => f.id === userId);
                if (friend) {
                    name = `${friend.firstName} ${friend.lastName}`;
                }
            }

            balanceArray.push({
                userId,
                name,
                amount: parseFloat(amount.toFixed(2))
            });
        }

        setBalances(balanceArray);
    };

    // Create a new cost group
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData) {
            toast.error('Você precisa estar logado');
            return;
        }

        if (!newGroupName.trim()) {
            toast.error('Nome do grupo é obrigatório');
            return;
        }

        if (newGroupMembers.length === 0) {
            toast.error('Adicione pelo menos um membro ao grupo');
            return;
        }

        try {
            // Make sure the creator is in the members list
            const members = [userData.uid, ...newGroupMembers];

            const now = Timestamp.now();
            const groupRef = await addDoc(collection(db, 'cost_groups'), {
                name: newGroupName,
                description: newGroupDescription,
                createdBy: userData.uid,
                members,
                createdAt: now,
                updatedAt: now
            });

            toast.success('Grupo criado com sucesso!');

            // Reset form
            setNewGroupName('');
            setNewGroupDescription('');
            setNewGroupMembers([]);
            setIsAddingGroup(false);

            // Reload groups
            loadCostGroups();
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('Erro ao criar grupo');
        }
    };

    // Add a new expense
    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData || !selectedGroup) {
            toast.error('Ocorreu um erro. Tente novamente.');
            return;
        }

        if (!newExpenseName.trim()) {
            toast.error('Nome da despesa é obrigatório');
            return;
        }

        if (newExpenseAmount <= 0) {
            toast.error('Valor deve ser maior que zero');
            return;
        }

        if (!newExpensePaidBy) {
            toast.error('Selecione quem pagou a despesa');
            return;
        }

        // Validate that split percentages add up to 100%
        const totalPercentage = Object.values(newExpenseSplits).reduce((total, val) => total + val, 0);
        if (Math.abs(totalPercentage - 100) > 0.01) { // Allow small floating point errors
            toast.error('As porcentagens de divisão devem somar 100%');
            return;
        }

        try {
            const expenseDate = new Date(newExpenseDate);
            const now = Timestamp.now();

            await addDoc(collection(db, 'expenses'), {
                groupId: selectedGroup,
                name: newExpenseName,
                description: newExpenseDescription,
                amount: newExpenseAmount,
                paidBy: newExpensePaidBy,
                date: Timestamp.fromDate(expenseDate),
                category: newExpenseCategory,
                split: newExpenseSplits,
                createdAt: now,
                updatedAt: now
            });

            toast.success('Despesa adicionada com sucesso!');

            // Reset form
            setNewExpenseName('');
            setNewExpenseDescription('');
            setNewExpenseAmount(0);
            setNewExpensePaidBy('');
            setNewExpenseDate(new Date().toISOString().split('T')[0]);
            setNewExpenseCategory(expenseCategories[0]);
            setNewExpenseSplits({});
            setIsAddingExpense(false);

            // Reload expenses
            loadExpenses(selectedGroup);
        } catch (error) {
            console.error('Error adding expense:', error);
            toast.error('Erro ao adicionar despesa');
        }
    };

    // Delete an expense
    const handleDeleteExpense = async (expenseId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'expenses', expenseId));
            toast.success('Despesa excluída com sucesso!');

            // Reload expenses
            if (selectedGroup) {
                loadExpenses(selectedGroup);
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Erro ao excluir despesa');
        }
    };

    // Handle member selection for new group
    const handleMemberSelection = (friendId: string) => {
        setNewGroupMembers(prev => {
            if (prev.includes(friendId)) {
                return prev.filter(id => id !== friendId);
            } else {
                return [...prev, friendId];
            }
        });
    };

    // Handle split percentage change
    const handleSplitChange = (userId: string, percentage: number) => {
        setNewExpenseSplits(prev => ({
            ...prev,
            [userId]: percentage
        }));
    };

    // Reset and initialize split percentages for the selected group
    const resetSplitPercentages = () => {
        if (!selectedGroup) return;

        const group = costGroups.find(g => g.id === selectedGroup);
        if (!group) return;

        // Split evenly by default
        const evenSplit = 100 / group.members.length;
        const splits: { [key: string]: number } = {};

        group.members.forEach(memberId => {
            splits[memberId] = evenSplit;
        });

        setNewExpenseSplits(splits);
    };

    // Initialize split percentages when adding a new expense
    useEffect(() => {
        if (isAddingExpense && selectedGroup) {
            resetSplitPercentages();
        }
    }, [isAddingExpense, selectedGroup]);

    // Initialize paidBy when adding a new expense
    useEffect(() => {
        if (isAddingExpense && userData) {
            setNewExpensePaidBy(userData.uid);
        }
    }, [isAddingExpense, userData]);

    // Get user name by ID
    const getUserName = (userId: string): string => {
        if (!userData) return '';

        if (userId === userData.uid) {
            return `${userData.firstName} ${userData.lastName} (Você)`;
        }

        const friend = friends.find(f => f.id === userId);
        if (friend) {
            return `${friend.firstName} ${friend.lastName}`;
        }

        return 'Usuário desconhecido';
    };

    // Chart data for expenses by category
    const getCategoryChartData = () => {
        const categoryTotals: { [key: string]: number } = {};

        expenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });

        return {
            labels: Object.keys(categoryTotals),
            datasets: [
                {
                    label: 'Despesas por Categoria',
                    data: Object.values(categoryTotals),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(199, 199, 199, 0.6)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    // Chart data for expenses by user
    const getUserExpenseChartData = () => {
        const selectedGroupData = costGroups.find(g => g.id === selectedGroup);
        if (!selectedGroupData) return { labels: [], datasets: [] };

        const userTotals: { [key: string]: number } = {};

        // Initialize all members with zero
        selectedGroupData.members.forEach(memberId => {
            userTotals[memberId] = 0;
        });

        expenses.forEach(expense => {
            for (const [userId, percentage] of Object.entries(expense.split)) {
                userTotals[userId] += (expense.amount * percentage / 100);
            }
        });

        return {
            labels: Object.keys(userTotals).map(getUserName),
            datasets: [
                {
                    label: 'Despesas por Pessoa',
                    data: Object.values(userTotals),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                }
            ]
        };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="text-lg">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4">
                <div className="alert alert-error">
                    <p>Você precisa estar logado para acessar esta página.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Finanças Compartilhadas</h1>

            {/* Balance Summary */}
            {selectedGroup && balances.length > 0 && (
                <div className="mb-8 bg-base-200 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-4">Resumo do Saldo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {balances.map(balance => (
                            <div
                                key={balance.userId}
                                className={`card ${balance.amount >= 0 ? 'bg-success/20' : 'bg-error/20'} p-4`}
                            >
                                <div className="card-body p-2">
                                    <h3 className="card-title text-lg">{balance.name}</h3>
                                    <p className={`text-xl font-bold ${balance.amount >= 0 ? 'text-success' : 'text-error'}`}>
                                        {balance.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                    <p className="text-sm opacity-80">
                                        {balance.amount >= 0
                                            ? 'Deve receber'
                                            : 'Deve pagar'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts */}
            {selectedGroup && expenses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="card bg-base-200 p-4">
                        <h2 className="text-xl font-semibold mb-4">Despesas por Categoria</h2>
                        <div className="h-64">
                            <Pie data={getCategoryChartData()} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>

                    <div className="card bg-base-200 p-4">
                        <h2 className="text-xl font-semibold mb-4">Despesas por Pessoa</h2>
                        <div className="h-64">
                            <Bar
                                data={getUserExpenseChartData()}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Group selection and management */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="form-control w-full md:w-1/2">
                        <div className="flex flex-row gap-2">
                            <select
                                className="select select-bordered flex-1"
                                value={selectedGroup || ''}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                disabled={costGroups.length === 0}
                            >
                                {costGroups.length === 0 ? (
                                    <option value="">Nenhum grupo disponível</option>
                                ) : (
                                    costGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name}</option>
                                    ))
                                )}
                            </select>

                            <button
                                className="btn btn-primary"
                                onClick={() => setIsAddingGroup(true)}
                            >
                                Novo Grupo
                            </button>
                        </div>
                    </div>

                    {selectedGroup && (
                        <button
                            className="btn btn-accent w-full md:w-auto"
                            onClick={() => setIsAddingExpense(true)}
                        >
                            Nova Despesa
                        </button>
                    )}
                </div>

                {/* Selected group info */}
                {selectedGroup && (
                    <div className="bg-base-200 p-4 rounded-lg mb-6">
                        {costGroups.find(g => g.id === selectedGroup)?.description && (
                            <p className="mb-2 text-sm opacity-80">
                                {costGroups.find(g => g.id === selectedGroup)?.description}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-sm font-medium mr-2">Membros:</span>
                            {costGroups.find(g => g.id === selectedGroup)?.members.map(memberId => (
                                <span key={memberId} className="badge badge-outline">
                                    {getUserName(memberId)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Expense list */}
            {selectedGroup && (
                <div className="overflow-x-auto">
                    <h2 className="text-xl font-semibold mb-4">Despesas</h2>

                    {expenses.length === 0 ? (
                        <div className="alert">
                            <p>Nenhuma despesa cadastrada. Adicione uma despesa para começar.</p>
                        </div>
                    ) : (
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Valor</th>
                                    <th className="hidden md:table-cell">Categoria</th>
                                    <th className="hidden md:table-cell">Data</th>
                                    <th>Pago por</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td className="font-medium">
                                            {expense.name}
                                            {expense.description && (
                                                <p className="text-xs text-opacity-70 mt-1">{expense.description}</p>
                                            )}
                                        </td>
                                        <td className="font-mono">
                                            {expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="hidden md:table-cell">
                                            <span className="badge">{expense.category}</span>
                                        </td>
                                        <td className="hidden md:table-cell">
                                            {expense.date.toDate().toLocaleDateString('pt-BR')}
                                        </td>
                                        <td>
                                            <span className="text-sm">{getUserName(expense.paidBy)}</span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-error btn-sm"
                                                onClick={() => handleDeleteExpense(expense.id)}
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Add Group Modal */}
            {isAddingGroup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="modal-box max-w-2xl w-full">
                        <h3 className="font-bold text-lg mb-4">Novo Grupo de Despesas</h3>

                        <form onSubmit={handleCreateGroup}>
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Nome do Grupo</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Ex: Viagem para a Praia"
                                    required
                                />
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Descrição (opcional)</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="Ex: Despesas da viagem em janeiro/2023"
                                    rows={3}
                                />
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Adicionar Membros</span>
                                </label>

                                {friends.length === 0 ? (
                                    <div className="alert">
                                        <p>Você não tem amigos para adicionar. Adicione amigos para criar um grupo.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {friends.map(friend => (
                                            <label key={friend.id} className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary mr-3"
                                                    checked={newGroupMembers.includes(friend.id)}
                                                    onChange={() => handleMemberSelection(friend.id)}
                                                />
                                                <span>
                                                    {friend.firstName} {friend.lastName}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsAddingGroup(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={friends.length === 0 || !newGroupName.trim() || newGroupMembers.length === 0}
                                >
                                    Criar Grupo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Expense Modal */}
            {isAddingExpense && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="modal-box max-w-2xl w-full">
                        <h3 className="font-bold text-lg mb-4">Nova Despesa</h3>

                        <form onSubmit={handleAddExpense}>
                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Nome da Despesa</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={newExpenseName}
                                    onChange={(e) => setNewExpenseName(e.target.value)}
                                    placeholder="Ex: Almoço no restaurante"
                                    required
                                />
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Descrição (opcional)</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    value={newExpenseDescription}
                                    onChange={(e) => setNewExpenseDescription(e.target.value)}
                                    placeholder="Ex: Almoço durante a viagem"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Valor</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered w-full"
                                        value={newExpenseAmount}
                                        onChange={(e) => setNewExpenseAmount(parseFloat(e.target.value) || 0)}
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Data</span>
                                    </label>
                                    <input
                                        type="date"
                                        className="input input-bordered w-full"
                                        value={newExpenseDate}
                                        onChange={(e) => setNewExpenseDate(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Categoria</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={newExpenseCategory}
                                        onChange={(e) => setNewExpenseCategory(e.target.value)}
                                        required
                                    >
                                        {expenseCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Pago por</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={newExpensePaidBy}
                                        onChange={(e) => setNewExpensePaidBy(e.target.value)}
                                        required
                                    >
                                        <option value={userData.uid}>
                                            {userData.firstName} {userData.lastName} (Você)
                                        </option>
                                        {friends
                                            .filter(friend =>
                                                selectedGroup &&
                                                costGroups.find(g => g.id === selectedGroup)?.members.includes(friend.id)
                                            )
                                            .map(friend => (
                                                <option key={friend.id} value={friend.id}>
                                                    {friend.firstName} {friend.lastName}
                                                </option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text">Divisão da Despesa (%)</span>
                                </label>

                                <div className="mt-2 space-y-3">
                                    {selectedGroup && costGroups.find(g => g.id === selectedGroup)?.members.map(memberId => (
                                        <div key={memberId} className="flex items-center">
                                            <span className="w-1/2">{getUserName(memberId)}</span>
                                            <input
                                                type="number"
                                                className="input input-bordered w-1/2"
                                                value={newExpenseSplits[memberId] || 0}
                                                onChange={(e) => handleSplitChange(memberId, parseFloat(e.target.value) || 0)}
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                required
                                            />
                                        </div>
                                    ))}

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="font-medium">Total:</span>
                                        <span
                                            className={`font-mono text-lg ${Math.abs(Object.values(newExpenseSplits).reduce((a, b) => a + b, 0) - 100) <= 0.01
                                                    ? 'text-success'
                                                    : 'text-error'
                                                }`}
                                        >
                                            {Object.values(newExpenseSplits).reduce((a, b) => a + b, 0).toFixed(2)}%
                                        </span>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline"
                                            onClick={resetSplitPercentages}
                                        >
                                            Dividir Igualmente
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsAddingExpense(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        !newExpenseName.trim() ||
                                        newExpenseAmount <= 0 ||
                                        !newExpensePaidBy ||
                                        Math.abs(Object.values(newExpenseSplits).reduce((a, b) => a + b, 0) - 100) > 0.01
                                    }
                                >
                                    Adicionar Despesa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}