// app/(user)/[username]/financas/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@context/userContext';
import { useParams } from 'next/navigation';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    // updateDoc, // Commented out since it's unused
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
    ChartOptions,
    ChartData
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// Types
interface Friend {
    uid: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
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

interface ExpenseMember {
    uid: string;
    name: string;
    splitType: 'equal' | 'percentage' | 'fixed';
    splitValue: number;
    photoURL?: string;
}

interface Expense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    paidBy: string;
    category: string;
    date: Timestamp;
    members: ExpenseMember[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface Balance {
    uid: string;
    name: string;
    photoURL?: string;
    balance: number;
}

// Constants
const EXPENSE_CATEGORIES = [
    'Alimentação',
    'Moradia',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Vestuário',
    'Serviços',
    'Outros'
];

export default function FinancasPage() {
    const { userData, loading } = useUser();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username } = useParams();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [costGroups, setCostGroups] = useState<CostGroup[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);
    
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
    
    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [newExpenseDescription, setNewExpenseDescription] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');
    const [newExpensePaidBy, setNewExpensePaidBy] = useState('');
    const [newExpenseCategory, setNewExpenseCategory] = useState('');
    const [newExpenseDate, setNewExpenseDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [expenseMembers, setExpenseMembers] = useState<ExpenseMember[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
    
    const [splitMethod, setSplitMethod] = useState<'equal' | 'percentage' | 'fixed'>('equal');

    // Load friends and cost groups
    useEffect(() => {
        if (userData) {
            loadFriends();
            loadCostGroups();
        }
    }, [userData]);

    // Load expenses when a group is selected
    useEffect(() => {
        if (selectedGroup) {
            loadExpenses(selectedGroup);
        }
    }, [selectedGroup]);
    
    const loadFriends = async () => {
        if (!userData) return;
        
        try {
            const friendsQuery = query(
                collection(db, 'friendships'),
                where('users', 'array-contains', userData.uid),
                where('status', '==', 'accepted')
            );
            
            const snapshot = await getDocs(friendsQuery);
            const friendshipsData = snapshot.docs.map(doc => doc.data());
            
            const friendsPromises = friendshipsData.map(async (friendship) => {
                const friendId = friendship.users.find((id: string) => id !== userData.uid);
                const userDoc = await getDocs(
                    query(collection(db, 'users'), where('uid', '==', friendId))
                );
                
                if (!userDoc.empty) {
                    const friendData = userDoc.docs[0].data();
                    return {
                        uid: friendData.uid,
                        firstName: friendData.firstName,
                        lastName: friendData.lastName,
                        username: friendData.username,
                        email: friendData.email,
                        photoURL: friendData.photoURL
                    };
                }
                return null;
            });
            
            const friendsList = (await Promise.all(friendsPromises)).filter(Boolean) as Friend[];
            setFriends(friendsList);
        } catch (error) {
            console.error('Error loading friends:', error);
            toast.error('Erro ao carregar amigos');
        }
    };
    
    const loadCostGroups = async () => {
        if (!userData) return;
        setIsLoadingGroups(true);
        
        try {
            const groupsQuery = query(
                collection(db, 'cost_groups'),
                where('members', 'array-contains', userData.uid)
            );
            
            const snapshot = await getDocs(groupsQuery);
            const groupsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CostGroup[];
            
            setCostGroups(groupsData);
        } catch (error) {
            console.error('Error loading cost groups:', error);
            toast.error('Erro ao carregar grupos');
        } finally {
            setIsLoadingGroups(false);
        }
    };
    
    const loadExpenses = async (groupId: string) => {
        if (!userData) return;
        setIsLoadingExpenses(true);
        
        try {
            const expensesQuery = query(
                collection(db, 'expenses'),
                where('groupId', '==', groupId)
            );
            
            const snapshot = await getDocs(expensesQuery);
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            
            setExpenses(expensesData);
            calculateBalances(expensesData);
        } catch (error) {
            console.error('Error loading expenses:', error);
            toast.error('Erro ao carregar despesas');
        } finally {
            setIsLoadingExpenses(false);
        }
    };
    
    const calculateBalances = (expensesData: Expense[]) => {
        if (!userData || !selectedGroup) return;
        
        const group = costGroups.find(g => g.id === selectedGroup);
        if (!group) return;
        
        // Initialize balances for all members
        const balanceMap: Record<string, { name: string; photoURL?: string; balance: number }> = {};
        
        // Add current user
        balanceMap[userData.uid] = {
            name: `${userData.firstName} ${userData.lastName}`,
            photoURL: userData.photoURL,
            balance: 0
        };
        
        // Add friends who are in the group
        friends.forEach(friend => {
            if (group.members.includes(friend.uid)) {
                balanceMap[friend.uid] = {
                    name: `${friend.firstName} ${friend.lastName}`,
                    photoURL: friend.photoURL,
                    balance: 0
                };
            }
        });
        
        // Calculate expenses
        expensesData.forEach(expense => {
            // Person who paid gets credit
            if (balanceMap[expense.paidBy]) {
                balanceMap[expense.paidBy].balance += expense.amount;
            }
            
            // Each person owes their share
            expense.members.forEach(member => {
                if (balanceMap[member.uid]) {
                    let amountOwed = 0;
                    
                    if (member.splitType === 'equal') {
                        amountOwed = expense.amount / expense.members.length;
                    } else if (member.splitType === 'percentage') {
                        amountOwed = (expense.amount * member.splitValue) / 100;
                    } else if (member.splitType === 'fixed') {
                        amountOwed = member.splitValue;
                    }
                    
                    balanceMap[member.uid].balance -= amountOwed;
                }
            });
        });
        
        // Convert to array
        const balancesArray = Object.keys(balanceMap).map(uid => ({
            uid,
            name: balanceMap[uid].name,
            photoURL: balanceMap[uid].photoURL,
            balance: parseFloat(balanceMap[uid].balance.toFixed(2))
        }));
        
        setBalances(balancesArray);
    };
    
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
            const _groupRef = await addDoc(collection(db, 'cost_groups'), {
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
    
    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!userData || !selectedGroup) {
            toast.error('Selecione um grupo primeiro');
            return;
        }
        
        if (!newExpenseDescription.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }
        
        if (!newExpenseAmount || parseFloat(newExpenseAmount) <= 0) {
            toast.error('Valor deve ser maior que zero');
            return;
        }
        
        if (!newExpensePaidBy) {
            toast.error('Selecione quem pagou');
            return;
        }
        
        if (!newExpenseCategory) {
            toast.error('Selecione uma categoria');
            return;
        }
        
        // Validate split values
        if (splitMethod === 'percentage') {
            const totalPercentage = expenseMembers.reduce((sum, member) => sum + member.splitValue, 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                toast.error('O total das porcentagens deve ser 100%');
                return;
            }
        } else if (splitMethod === 'fixed') {
            const totalFixed = expenseMembers.reduce((sum, member) => sum + member.splitValue, 0);
            const totalAmount = parseFloat(newExpenseAmount);
            if (Math.abs(totalFixed - totalAmount) > 0.01) {
                toast.error(`O total dos valores fixos deve ser igual ao valor total (${totalAmount})`);
                return;
            }
        }
        
        try {
            const amount = parseFloat(newExpenseAmount);
            const now = Timestamp.now();
            const expenseDate = new Date(newExpenseDate);
            
            await addDoc(collection(db, 'expenses'), {
                groupId: selectedGroup,
                description: newExpenseDescription,
                amount,
                paidBy: newExpensePaidBy,
                category: newExpenseCategory,
                date: Timestamp.fromDate(expenseDate),
                members: expenseMembers,
                createdAt: now,
                updatedAt: now
            });
            
            toast.success('Despesa criada com sucesso!');
            
            // Reset form
            setNewExpenseDescription('');
            setNewExpenseAmount('');
            setNewExpenseCategory('');
            setNewExpenseDate(new Date().toISOString().split('T')[0]);
            setIsAddingExpense(false);
            
            // Reload expenses
            loadExpenses(selectedGroup);
        } catch (error) {
            console.error('Error creating expense:', error);
            toast.error('Erro ao criar despesa');
        }
    };
    
    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
        
        try {
            // Find the expense to check permissions
            const expense = expenses.find(e => e.id === expenseId);
            
            if (!expense) {
                toast.error('Despesa não encontrada');
                return;
            }
            
            if (!userData) {
                toast.error('Usuário não autenticado');
                return;
            }

            // Check if current user paid for the expense or is the group creator
            const group = costGroups.find(g => g.id === expense.groupId);
            const isGroupCreator = group && group.createdBy === userData.uid;
            const isPayer = expense.paidBy === userData.uid;
            
            if (!isGroupCreator && !isPayer) {
                toast.error('Você só pode excluir despesas que você pagou ou se for o criador do grupo');
                return;
            }
            
            await deleteDoc(doc(db, 'expenses', expenseId));
            toast.success('Despesa excluída com sucesso!');
            
            // Reload expenses
            if (selectedGroup) {
                loadExpenses(selectedGroup);
            }
        } catch (error) {
            console.error('Error deleting expense:', error);
            toast.error('Erro ao excluir despesa. Verifique se você tem permissão para esta ação.');
        }
    };
    
    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Tem certeza que deseja excluir este grupo? Todas as despesas serão perdidas.')) return;
        
        try {
            // Check if the current user is the creator of the group
            const group = costGroups.find(g => g.id === groupId);
            
            if (!group) {
                toast.error('Grupo não encontrado');
                return;
            }
            
            // Check if the current user is the creator of the group
            if (!userData || group.createdBy !== userData.uid) {
                toast.error('Você não tem permissão para excluir este grupo. Apenas o criador pode excluí-lo.');
                return;
            }
            
            // Delete the group
            await deleteDoc(doc(db, 'cost_groups', groupId));
            
            // Get all expenses in this group
            const expensesQuery = query(
                collection(db, 'expenses'),
                where('groupId', '==', groupId)
            );
            
            const snapshot = await getDocs(expensesQuery);
            
            // Delete each expense one by one to avoid permission issues
            for (const docSnap of snapshot.docs) {
                try {
                    await deleteDoc(docSnap.ref);
                } catch (err) {
                    console.error(`Could not delete expense ${docSnap.id}:`, err);
                    // Continue with other deletions even if one fails
                }
            }
            
            toast.success('Grupo excluído com sucesso!');
            
            // Reset selected group if it was deleted
            if (selectedGroup === groupId) {
                setSelectedGroup(null);
                setExpenses([]);
                setBalances([]);
            }
            
            // Reload groups
            loadCostGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Erro ao excluir grupo. Verifique se você tem permissão para esta ação.');
        }
    };
    
    // When adding a new expense, initialize members list
    useEffect(() => {
        if (isAddingExpense && selectedGroup) {
            resetSplitPercentages();
        }
    }, [isAddingExpense, selectedGroup, splitMethod]);
    
    // When adding an expense, set the logged user as the one who paid
    useEffect(() => {
        if (isAddingExpense && userData) {
            setNewExpensePaidBy(userData.uid);
        }
    }, [isAddingExpense, userData]);
    
    const resetSplitPercentages = () => {
        if (!selectedGroup) return;
        
        const group = costGroups.find(g => g.id === selectedGroup);
        if (!group) return;
        
        // Get all members of the group
        const members: ExpenseMember[] = [];
        
        // Add current user
        if (userData && group.members.includes(userData.uid)) {
            members.push({
                uid: userData.uid,
                name: `${userData.firstName} ${userData.lastName}`,
                splitType: splitMethod,
                splitValue: splitMethod === 'equal' ? 0 : splitMethod === 'percentage' ? 0 : 0
            });
        }
        
        // Add friends who are in the group
        friends.forEach(friend => {
            if (group.members.includes(friend.uid)) {
                members.push({
                    uid: friend.uid,
                    name: `${friend.firstName} ${friend.lastName}`,
                    photoURL: friend.photoURL,
                    splitType: splitMethod,
                    splitValue: splitMethod === 'equal' ? 0 : splitMethod === 'percentage' ? 0 : 0
                });
            }
        });
        
        // Calculate default split values
        if (splitMethod === 'equal') {
            // All equal - the actual calculation happens at payment time
            members.forEach(member => {
                member.splitValue = 0; // Will be calculated on display
            });
        } else if (splitMethod === 'percentage') {
            // Default to equal percentages
            const equalPercentage = 100 / members.length;
            members.forEach(member => {
                member.splitValue = parseFloat(equalPercentage.toFixed(2));
            });
            
            // Adjust last member to ensure 100%
            const totalPercentage = members.reduce((sum, member) => sum + member.splitValue, 0);
            if (members.length > 0) {
                members[members.length - 1].splitValue += (100 - totalPercentage);
            }
        } else if (splitMethod === 'fixed') {
            // Default to equal fixed amounts
            const amount = parseFloat(newExpenseAmount || '0');
            const equalAmount = amount / members.length;
            members.forEach(member => {
                member.splitValue = parseFloat(equalAmount.toFixed(2));
            });
            
            // Adjust last member to ensure total equals amount
            const totalFixed = members.reduce((sum, member) => sum + member.splitValue, 0);
            if (members.length > 0 && amount > 0) {
                members[members.length - 1].splitValue += (amount - totalFixed);
            }
        }
        
        setExpenseMembers(members);
    };
    
    const updateMemberSplit = (uid: string, value: number) => {
        setExpenseMembers(prev => 
            prev.map(member => 
                member.uid === uid 
                    ? { ...member, splitValue: value }
                    : member
            )
        );
    };
    
    // Filter expenses by date period
    const filteredExpenses = expenses.filter(expense => {
        if (selectedPeriod === 'all') return true;
        
        const expenseDate = expense.date.toDate();
        const now = new Date();
        
        if (selectedPeriod === '7d') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return expenseDate >= sevenDaysAgo;
        } else if (selectedPeriod === '30d') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return expenseDate >= thirtyDaysAgo;
        } else if (selectedPeriod === '90d') {
            const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            return expenseDate >= ninetyDaysAgo;
        }
        
        return true;
    });
    
    // Prepare chart data - expenses by category
    const categoryExpenses = EXPENSE_CATEGORIES.map(category => {
        const total = filteredExpenses
            .filter(expense => expense.category === category)
            .reduce((sum, expense) => sum + expense.amount, 0);
        return { category, total };
    }).filter(item => item.total > 0);
    
    const chartData: ChartData<'pie'> = {
        labels: categoryExpenses.map(item => item.category),
        datasets: [
            {
                data: categoryExpenses.map(item => item.total),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                    '#FF9F40', '#22CFCF', '#FF6B6B', '#7C7CFF'
                ]
            }
        ]
    };
    
    const chartOptions: ChartOptions<'pie'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };
    
    // Prepare chart data - expenses by date
    const dateExpenses: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
        const date = expense.date.toDate().toISOString().slice(0, 10);
        dateExpenses[date] = (dateExpenses[date] || 0) + expense.amount;
    });
    
    const sortedDates = Object.keys(dateExpenses).sort();
    
    const barChartData: ChartData<'bar'> = {
        labels: sortedDates.map(date => {
            const [_year, month, day] = date.split('-');
            return `${day}/${month}`;
        }),
        datasets: [
            {
                label: 'Despesas por Dia',
                data: sortedDates.map(date => dateExpenses[date]),
                backgroundColor: '#4BC0C0'
            }
        ]
    };
    
    const barChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top'
            },
            title: {
                display: true,
                text: 'Despesas por Dia'
            }
        }
    };
    
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <UserProfileBar pathname="Finanças" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }
    
    if (!userData) {
        return (
            <div className="flex flex-col min-h-screen">
                <UserProfileBar pathname="Finanças" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-error">
                        Você precisa estar logado para acessar esta página
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen pb-20 md:pb-0">
            <UserProfileBar pathname="Finanças" />
            
            <div className="flex-1 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Left Column - Groups */}
                    <div className="md:col-span-1">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <div className="flex justify-between items-center">
                                    <h2 className="card-title">Grupos de Despesas</h2>
                                    <button 
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setIsAddingGroup(!isAddingGroup)}
                                    >
                                        {isAddingGroup ? 'Cancelar' : 'Novo Grupo'}
                                    </button>
                                </div>
                                
                                {isAddingGroup && (
                                    <form onSubmit={handleCreateGroup} className="mt-4 space-y-3">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Nome do Grupo</span>
                                            </label>
                                            <input 
                                                type="text" 
                                                className="input input-bordered w-full" 
                                                value={newGroupName}
                                                onChange={e => setNewGroupName(e.target.value)}
                                                placeholder="Ex: Apartamento, Viagem, etc."
                                                required
                                            />
                                        </div>
                                        
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Descrição (opcional)</span>
                                            </label>
                                            <textarea 
                                                className="textarea textarea-bordered w-full" 
                                                value={newGroupDescription}
                                                onChange={e => setNewGroupDescription(e.target.value)}
                                                placeholder="Descreva o propósito deste grupo"
                                            />
                                        </div>
                                        
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Membros</span>
                                            </label>
                                            <select 
                                                className="select select-bordered w-full" 
                                                value=""
                                                onChange={e => {
                                                    if (e.target.value && !newGroupMembers.includes(e.target.value)) {
                                                        setNewGroupMembers([...newGroupMembers, e.target.value]);
                                                    }
                                                }}
                                            >
                                                <option value="">Selecione um amigo</option>
                                                {friends.map(friend => (
                                                    <option key={friend.uid} value={friend.uid}>
                                                        {`${friend.firstName} ${friend.lastName}`}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            <div className="mt-2 space-y-1">
                                                {newGroupMembers.map(memberId => {
                                                    const friend = friends.find(f => f.uid === memberId);
                                                    return friend ? (
                                                        <div key={memberId} className="flex justify-between items-center p-2 bg-base-200 rounded-lg">
                                                            <span>{`${friend.firstName} ${friend.lastName}`}</span>
                                                            <button 
                                                                type="button"
                                                                className="btn btn-ghost btn-xs"
                                                                onClick={() => setNewGroupMembers(
                                                                    newGroupMembers.filter(id => id !== memberId)
                                                                )}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                        
                                        <div className="form-control mt-4">
                                            <button type="submit" className="btn btn-primary">Criar Grupo</button>
                                        </div>
                                    </form>
                                )}
                                
                                {isLoadingGroups ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-2">
                                        {costGroups.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                Você ainda não tem grupos de despesas
                                            </div>
                                        ) : (
                                            costGroups.map(group => (
                                                <div 
                                                    key={group.id}
                                                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                                        selectedGroup === group.id ? 'bg-primary text-primary-content' : 'bg-base-200 hover:bg-base-300'
                                                    }`}
                                                    onClick={() => setSelectedGroup(group.id)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="font-semibold">{group.name}</h3>
                                                        <button 
                                                            className="btn btn-ghost btn-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteGroup(group.id);
                                                            }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                    {group.description && (
                                                        <p className="text-sm mt-1">{group.description}</p>
                                                    )}
                                                    <div className="text-xs mt-2">
                                                        {group.members.length} membros
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Right Column - Expenses */}
                    <div className="md:col-span-2">
                        {selectedGroup ? (
                            <div className="space-y-4">
                                <div className="card bg-base-100 shadow-xl">
                                    <div className="card-body">
                                        <div className="flex justify-between items-center">
                                            <h2 className="card-title">
                                                Despesas
                                            </h2>
                                            <div className="flex space-x-2">
                                                <select 
                                                    className="select select-bordered select-sm"
                                                    value={selectedPeriod}
                                                    onChange={e => setSelectedPeriod(e.target.value as any)}
                                                >
                                                    <option value="7d">Últimos 7 dias</option>
                                                    <option value="30d">Últimos 30 dias</option>
                                                    <option value="90d">Últimos 90 dias</option>
                                                    <option value="all">Todos</option>
                                                </select>
                                                <button 
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => setIsAddingExpense(!isAddingExpense)}
                                                >
                                                    {isAddingExpense ? 'Cancelar' : 'Nova Despesa'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {isAddingExpense && (
                                            <form onSubmit={handleCreateExpense} className="mt-4 space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Descrição</span>
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            className="input input-bordered w-full" 
                                                            value={newExpenseDescription}
                                                            onChange={e => setNewExpenseDescription(e.target.value)}
                                                            placeholder="Ex: Supermercado, Aluguel, etc."
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Valor (R$)</span>
                                                        </label>
                                                        <input 
                                                            type="number" 
                                                            step="0.01"
                                                            min="0.01"
                                                            className="input input-bordered w-full" 
                                                            value={newExpenseAmount}
                                                            onChange={e => {
                                                                setNewExpenseAmount(e.target.value);
                                                                if (splitMethod === 'fixed') {
                                                                    resetSplitPercentages();
                                                                }
                                                            }}
                                                            placeholder="0.00"
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Pago por</span>
                                                        </label>
                                                        <select 
                                                            className="select select-bordered w-full" 
                                                            value={newExpensePaidBy}
                                                            onChange={e => setNewExpensePaidBy(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Selecione</option>
                                                            <option value={userData.uid}>
                                                                Você ({userData.firstName})
                                                            </option>
                                                            {friends.map(friend => {
                                                                const group = costGroups.find(g => g.id === selectedGroup);
                                                                if (group && group.members.includes(friend.uid)) {
                                                                    return (
                                                                        <option key={friend.uid} value={friend.uid}>
                                                                            {`${friend.firstName} ${friend.lastName}`}
                                                                        </option>
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Categoria</span>
                                                        </label>
                                                        <select 
                                                            className="select select-bordered w-full" 
                                                            value={newExpenseCategory}
                                                            onChange={e => setNewExpenseCategory(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Selecione</option>
                                                            {EXPENSE_CATEGORIES.map(category => (
                                                                <option key={category} value={category}>
                                                                    {category}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Data</span>
                                                        </label>
                                                        <input 
                                                            type="date" 
                                                            className="input input-bordered w-full" 
                                                            value={newExpenseDate}
                                                            onChange={e => setNewExpenseDate(e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Método de Divisão</span>
                                                        </label>
                                                        <select 
                                                            className="select select-bordered w-full" 
                                                            value={splitMethod}
                                                            onChange={e => {
                                                                setSplitMethod(e.target.value as any);
                                                            }}
                                                        >
                                                            <option value="equal">Igual para todos</option>
                                                            <option value="percentage">Porcentagens</option>
                                                            <option value="fixed">Valores Fixos</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                
                                                <div className="divider">Divisão de Despesas</div>
                                                
                                                <div className="space-y-2">
                                                    {expenseMembers.map(member => (
                                                        <div key={member.uid} className="flex items-center space-x-2 p-2 bg-base-200 rounded-lg">
                                                            <div className="flex-1">
                                                                {member.uid === userData.uid ? 'Você' : member.name}
                                                            </div>
                                                            
                                                            {splitMethod === 'equal' ? (
                                                                <div className="badge badge-primary">
                                                                    {(100 / expenseMembers.length).toFixed(0)}%
                                                                </div>
                                                            ) : splitMethod === 'percentage' ? (
                                                                <div className="flex items-center space-x-2">
                                                                    <input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        max="100"
                                                                        className="input input-bordered input-sm w-20"
                                                                        value={member.splitValue}
                                                                        onChange={e => updateMemberSplit(
                                                                            member.uid, 
                                                                            parseFloat(e.target.value) || 0
                                                                        )}
                                                                    />
                                                                    <span>%</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center space-x-2">
                                                                    <span>R$</span>
                                                                    <input 
                                                                        type="number"
                                                                        step="0.01"
                                                                        min="0"
                                                                        className="input input-bordered input-sm w-20"
                                                                        value={member.splitValue}
                                                                        onChange={e => updateMemberSplit(
                                                                            member.uid, 
                                                                            parseFloat(e.target.value) || 0
                                                                        )}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                
                                                <div className="form-control mt-4">
                                                    <button type="submit" className="btn btn-primary">Adicionar Despesa</button>
                                                </div>
                                            </form>
                                        )}
                                        
                                        {isLoadingExpenses ? (
                                            <div className="flex justify-center py-4">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                {filteredExpenses.length === 0 ? (
                                                    <div className="text-center py-4 text-gray-500">
                                                        Nenhuma despesa registrada no período selecionado
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="table table-zebra w-full">
                                                            <thead>
                                                                <tr>
                                                                    <th>Data</th>
                                                                    <th>Descrição</th>
                                                                    <th>Categoria</th>
                                                                    <th>Pago por</th>
                                                                    <th>Valor</th>
                                                                    <th></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {filteredExpenses.sort((a, b) => 
                                                                    b.date.toDate().getTime() - a.date.toDate().getTime()
                                                                ).map(expense => (
                                                                    <tr key={expense.id}>
                                                                        <td>{expense.date.toDate().toLocaleDateString()}</td>
                                                                        <td>{expense.description}</td>
                                                                        <td>{expense.category}</td>
                                                                        <td>
                                                                            {expense.paidBy === userData.uid 
                                                                                ? 'Você' 
                                                                                : friends.find(f => f.uid === expense.paidBy)?.firstName || 'Desconhecido'}
                                                                        </td>
                                                                        <td>R$ {expense.amount.toFixed(2)}</td>
                                                                        <td>
                                                                            <button 
                                                                                className="btn btn-ghost btn-xs"
                                                                                onClick={() => handleDeleteExpense(expense.id)}
                                                                            >
                                                                                🗑️
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="card bg-base-100 shadow-xl">
                                    <div className="card-body">
                                        <h2 className="card-title">Análise de Despesas</h2>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            {filteredExpenses.length === 0 ? (
                                                <div className="col-span-2 text-center py-4 text-gray-500">
                                                    Sem dados suficientes para análise
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="h-64">
                                                        <h3 className="text-center">Despesas por Categoria</h3>
                                                        <Pie data={chartData} options={chartOptions} />
                                                    </div>
                                                    
                                                    <div className="h-64">
                                                        <h3 className="text-center">Despesas por Dia</h3>
                                                        <Bar data={barChartData} options={barChartOptions} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card bg-base-100 shadow-xl">
                                    <div className="card-body">
                                        <h2 className="card-title">Saldos</h2>
                                        
                                        {balances.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500">
                                                Sem dados para cálculo de saldo
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto mt-4">
                                                <table className="table w-full">
                                                    <thead>
                                                        <tr>
                                                            <th>Pessoa</th>
                                                            <th>Saldo</th>
                                                            <th>Situação</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {balances.map(balance => (
                                                            <tr key={balance.uid}>
                                                                <td>{balance.uid === userData.uid ? 'Você' : balance.name}</td>
                                                                <td 
                                                                    className={
                                                                        balance.balance > 0 
                                                                            ? 'text-success' 
                                                                            : balance.balance < 0 
                                                                            ? 'text-error' 
                                                                            : ''
                                                                    }
                                                                >
                                                                    R$ {balance.balance.toFixed(2)}
                                                                </td>
                                                                <td>
                                                                    {balance.balance > 0 ? (
                                                                        <span className="badge badge-success">A receber</span>
                                                                    ) : balance.balance < 0 ? (
                                                                        <span className="badge badge-error">A pagar</span>
                                                                    ) : (
                                                                        <span className="badge">Neutro</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card bg-base-100 shadow-xl h-full">
                                <div className="card-body flex flex-col items-center justify-center">
                                    <h2 className="card-title text-center">Selecione um grupo para ver as despesas</h2>
                                    <p className="text-center text-gray-500 mt-2">
                                        {costGroups.length === 0 
                                            ? 'Comece criando um grupo de despesas' 
                                            : 'Ou crie um novo grupo para começar a registrar despesas'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}