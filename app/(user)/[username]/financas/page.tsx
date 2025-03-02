// app/(user)/[username]/financas/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@context/userContext';
import { useParams } from 'next/navigation';
import {
    collection,
    addDoc,
    getDocs,
    doc,
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
} from 'chart.js';
import toast from 'react-hot-toast';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";

// types import
import type { Friend, CostGroup, Expense, Balance, ExpenseMember, SplitMethod, PeriodFilter, FinanceUserData } from './components/types';

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

// Import components
import { CostGroupList } from './components/CostGroupList';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseAnalytics } from './components/ExpenseAnalytics';
import { BalanceTable } from './components/BalanceTable';
import { NoGroupSelected } from './components/NoGroupSelected';

export default function FinancasPage() {
    const { userData, loading } = useUser();
    
    // Debug what's happening with userData
    console.log("Finance page userData:", userData);
    
    // If we hit errors during render, let's catch them
    try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { username } = useParams();

    // State hooks
    const [friends, setFriends] = useState<Friend[]>([]);
    const [costGroups, setCostGroups] = useState<CostGroup[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);
    
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
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d');
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);
    
    const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');

    const resetSplitPercentages = useCallback(() => {
        if (!selectedGroup) return;
        
        const group = costGroups.find(g => g.id === selectedGroup);
        if (!group) return;
        
        // Get all members of the group
        const members: ExpenseMember[] = [];
        
        // Add current user
        if (userData && group.members.includes(userData.uid)) {
            const firstName = userData.firstName || '';
            const lastName = userData.lastName || '';
            members.push({
                uid: userData.uid,
                name: `${firstName} ${lastName}`.trim(),
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
    }, [selectedGroup, costGroups, userData, friends, splitMethod, newExpenseAmount]);
    
    const loadFriends = useCallback(async () => {
        if (!userData || !userData.uid) {
            console.log("Cannot load friends - no userData or uid");
            return;
        }
        
        try {
            console.log("Loading friends for uid:", userData.uid);
            // Query the nested friendsList collection
            const friendsRef = collection(db, 'friends', userData.uid, 'friendsList');
            const snapshot = await getDocs(friendsRef);
            
            const friendsList: Friend[] = [];
            snapshot.forEach((doc) => {
                const friendData = doc.data();
                friendsList.push({
                    uid: doc.id,
                    firstName: friendData.firstName || '',
                    lastName: friendData.lastName || '',
                    username: friendData.username || '',
                    email: '',
                    photoURL: friendData.photoURL
                });
            });
            
            console.log("Friends loaded:", friendsList.length);
            setFriends(friendsList);
        } catch (error) {
            console.error('Error loading friends:', error);
            toast.error('Erro ao carregar amigos');
        }
    }, [userData]);
    
    const loadCostGroups = useCallback(async () => {
        if (!userData || !userData.uid) {
            console.log("Cannot load cost groups - no userData or uid");
            return;
        }
        setIsLoadingGroups(true);
        
        try {
            console.log("Loading cost groups for uid:", userData.uid);
            const groupsQuery = query(
                collection(db, 'cost_groups'),
                where('members', 'array-contains', userData.uid)
            );
            
            const snapshot = await getDocs(groupsQuery);
            const groupsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CostGroup[];
            
            console.log("Cost groups loaded:", groupsData.length);
            setCostGroups(groupsData);
        } catch (error) {
            console.error('Error loading cost groups:', error);
            toast.error('Erro ao carregar grupos');
        } finally {
            setIsLoadingGroups(false);
        }
    }, [userData]);
    
    const calculateBalances = useCallback((expensesData: Expense[]) => {
        if (!userData || !selectedGroup) return;
        
        const group = costGroups.find(g => g.id === selectedGroup);
        if (!group) return;
        
        // Initialize balances for all members
        const balanceMap: Record<string, { name: string; photoURL?: string; balance: number }> = {};
        
        // Add current user
        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        balanceMap[userData.uid] = {
            name: `${firstName} ${lastName}`.trim(),
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
            if (expense.members && Array.isArray(expense.members)) {
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
            } else {
                // If no members are defined, split equally among all group members
                const groupMemberCount = Object.keys(balanceMap).length;
                if (groupMemberCount > 0) {
                    const equalShare = expense.amount / groupMemberCount;
                    Object.keys(balanceMap).forEach(memberId => {
                        if (memberId !== expense.paidBy) {
                            balanceMap[memberId].balance -= equalShare;
                        }
                    });
                }
            }
        });
        
        // Convert to array
        const balancesArray = Object.keys(balanceMap).map(uid => ({
            uid,
            name: balanceMap[uid].name,
            photoURL: balanceMap[uid].photoURL,
            balance: parseFloat(balanceMap[uid].balance.toFixed(2))
        }));
        
        setBalances(balancesArray);
    }, [userData, selectedGroup, costGroups, friends]);
    
    const loadExpenses = useCallback(async (groupId: string) => {
        if (!userData || !userData.uid) {
            console.log("Cannot load expenses - no userData or uid");
            return;
        }
        setIsLoadingExpenses(true);
        
        try {
            console.log("Loading expenses for group:", groupId);
            const expensesQuery = query(
                collection(db, 'expenses'),
                where('groupId', '==', groupId)
            );
            
            const snapshot = await getDocs(expensesQuery);
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];
            
            console.log("Expenses loaded:", expensesData.length);
            setExpenses(expensesData);
            calculateBalances(expensesData);
        } catch (error) {
            console.error('Error loading expenses:', error);
            toast.error('Erro ao carregar despesas');
        } finally {
            setIsLoadingExpenses(false);
        }
    }, [userData, calculateBalances]);
    
    const updateMemberSplit = useCallback((uid: string, value: number) => {
        setExpenseMembers(prev => 
            prev.map(member => 
                member.uid === uid 
                    ? { ...member, splitValue: value }
                    : member
            )
        );
    }, []);

    // Load friends and cost groups
    useEffect(() => {
        console.log("Effect for loading data triggered, userData:", !!userData);
        if (userData && userData.uid) {
            loadFriends();
            loadCostGroups();
        } else {
            console.log("Cannot load data - userData is missing or incomplete");
        }
    }, [userData, loadFriends, loadCostGroups]);

    // Load expenses when a group is selected
    useEffect(() => {
        console.log("Effect for loading expenses triggered, selectedGroup:", selectedGroup);
        if (selectedGroup) {
            loadExpenses(selectedGroup);
        }
    }, [selectedGroup, loadExpenses]);
    
    // When adding a new expense, initialize members list
    useEffect(() => {
        console.log("Effect for reset percentages triggered, isAddingExpense:", isAddingExpense, "selectedGroup:", selectedGroup);
        if (isAddingExpense && selectedGroup) {
            resetSplitPercentages();
        }
    }, [isAddingExpense, selectedGroup, splitMethod, resetSplitPercentages]);
    
    // When adding an expense, set the logged user as the one who paid
    useEffect(() => {
        console.log("Effect for setting paid by triggered, isAddingExpense:", isAddingExpense, "userData:", !!userData);
        if (isAddingExpense && userData && userData.uid) {
            setNewExpensePaidBy(userData.uid);
        }
    }, [isAddingExpense, userData]);
    
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

            console.log(_groupRef);
            
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

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <UserProfileBar pathname="Finanças" />
                <div className="flex-1 flex items-center justify-center">
                    <Spinner />
                </div>
            </div>
        );
    }
    
    if (!userData) {
        return (
            <div className="flex flex-col min-h-screen">
                <UserProfileBar pathname="Finanças" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span>Você precisa estar logado para acessar esta página</span>
                    </div>
                </div>
            </div>
        );
    }

    // Return the JSX
    const result = (
        <div className="flex flex-col min-h-screen pb-20 md:pb-0">
            <UserProfileBar pathname="Finanças" />
            
            <div className="flex-1 p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left Column - Groups */}
                    <div className={`lg:col-span-1 ${selectedGroup ? 'sm:block' : ''}`}>
                        <CostGroupList 
                            costGroups={costGroups}
                            selectedGroup={selectedGroup}
                            setSelectedGroup={setSelectedGroup}
                            handleDeleteGroup={handleDeleteGroup}
                            isLoadingGroups={isLoadingGroups}
                            isAddingGroup={isAddingGroup}
                            setIsAddingGroup={setIsAddingGroup}
                            newGroupName={newGroupName}
                            setNewGroupName={setNewGroupName}
                            newGroupDescription={newGroupDescription}
                            setNewGroupDescription={setNewGroupDescription}
                            newGroupMembers={newGroupMembers}
                            setNewGroupMembers={setNewGroupMembers}
                            friends={friends}
                            handleCreateGroup={handleCreateGroup}
                        />
                    </div>
                    
                    {/* Right Column - Expenses */}
                    <div className="lg:col-span-2">
                        {selectedGroup ? (
                            <div className="space-y-5 md:space-y-6">
                                {/* Expense Form and List */}
                                <ExpenseForm
                                    isAddingExpense={isAddingExpense}
                                    setIsAddingExpense={setIsAddingExpense}
                                    selectedPeriod={selectedPeriod}
                                    setSelectedPeriod={setSelectedPeriod}
                                    newExpenseDescription={newExpenseDescription}
                                    setNewExpenseDescription={setNewExpenseDescription}
                                    newExpenseAmount={newExpenseAmount}
                                    setNewExpenseAmount={setNewExpenseAmount}
                                    newExpensePaidBy={newExpensePaidBy}
                                    setNewExpensePaidBy={setNewExpensePaidBy}
                                    newExpenseCategory={newExpenseCategory}
                                    setNewExpenseCategory={setNewExpenseCategory}
                                    newExpenseDate={newExpenseDate}
                                    setNewExpenseDate={setNewExpenseDate}
                                    splitMethod={splitMethod}
                                    setSplitMethod={setSplitMethod}
                                    expenseMembers={expenseMembers}
                                    updateMemberSplit={updateMemberSplit}
                                    handleCreateExpense={handleCreateExpense}
                                    userData={userData}
                                    friends={friends}
                                    costGroups={costGroups}
                                    selectedGroup={selectedGroup}
                                    resetSplitPercentages={resetSplitPercentages}
                                />
                                
                                <ExpenseList
                                    isLoadingExpenses={isLoadingExpenses}
                                    filteredExpenses={filteredExpenses}
                                    handleDeleteExpense={handleDeleteExpense}
                                    userData={userData}
                                    friends={friends}
                                />
                                
                                {/* Analytics */}
                                <ExpenseAnalytics filteredExpenses={filteredExpenses} />
                                
                                {/* Balances */}
                                <BalanceTable balances={balances} userData={userData} />
                            </div>
                        ) : (
                            <NoGroupSelected costGroups={costGroups} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
    console.log("Render complete");
    return result;
    } catch (error) {
        console.error("Error rendering FinancasPage:", error);
        return (
            <div className="flex flex-col min-h-screen">
                <UserProfileBar pathname="Finanças" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span>Erro ao carregar a página: {error instanceof Error ? error.message : 'Erro desconhecido'}</span>
                    </div>
                </div>
            </div>
        );
    }
}