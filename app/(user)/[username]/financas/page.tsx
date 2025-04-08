"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/userContext";
import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    updateDoc,
    where,
    query,
    Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";

import { toast } from "@/hooks/use-toast";
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { AlertCircle } from "lucide-react";

// types import
import type {
    Friend,
    CostGroup,
    Expense,
    Balance,
    ExpenseMember,
    SplitMethod,
    PeriodFilter,
    Child,
} from "./components/types";
import { KidInfo } from "@/types/signup.types";



// Import components
import { CostGroupList } from "./components/CostGroupList";
import { ExpenseForm } from "./components/ExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { ExpenseAnalytics } from "./components/ExpenseAnalytics";
import { BalanceTable } from "./components/BalanceTable";
import { NoGroupSelected } from "./components/NoGroupSelected";
import { ExpenseModal } from "./components/ExpenseModal";

export default function FinancasPage() {
    const { userData, loading } = useUser();

    // State hooks
    const [friends, setFriends] = useState<Friend[]>([]);
    const [costGroups, setCostGroups] = useState<CostGroup[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [childrenMap, setChildrenMap] = useState<{ [id: string]: Child }>({});

    const [isAddingExpense, setIsAddingExpense] = useState(false);
    const [isEditingExpense, setIsEditingExpense] = useState(false);
    const [viewExpenseModalOpen, setViewExpenseModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    
    const [newExpenseDescription, setNewExpenseDescription] = useState("");
    const [newExpenseAmount, setNewExpenseAmount] = useState("");
    const [newExpensePaidBy, setNewExpensePaidBy] = useState("");
    const [newExpenseCategory, setNewExpenseCategory] = useState("");
    const [newExpenseDate, setNewExpenseDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);

    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [expenseMembers, setExpenseMembers] = useState<ExpenseMember[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("30d");
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDescription, setNewGroupDescription] = useState("");
    const [newGroupMembers, setNewGroupMembers] = useState<string[]>([]);

    const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");

    const resetSplitPercentages = useCallback(() => {
        if (!selectedGroup) return;

        const group = costGroups.find((g) => g.id === selectedGroup);
        if (!group) return;

        // Get all members of the group
        const members: ExpenseMember[] = [];

        // Add current user
        if (userData && group.members.includes(userData.uid)) {
            const firstName = userData.firstName || "";
            const lastName = userData.lastName || "";
            members.push({
                uid: userData.uid,
                name: `${firstName} ${lastName}`.trim(),
                splitType: splitMethod,
                splitValue:
                    splitMethod === "equal" ? 0 : splitMethod === "percentage" ? 0 : 0,
            });
        }

        // Add friends who are in the group
        friends.forEach((friend) => {
            if (group.members.includes(friend.uid)) {
                members.push({
                    uid: friend.uid,
                    name: `${friend.firstName} ${friend.lastName}`,
                    photoURL: friend.photoURL,
                    splitType: splitMethod,
                    splitValue:
                        splitMethod === "equal"
                            ? 0
                            : splitMethod === "percentage"
                                ? 0
                                : 0,
                });
            }
        });

        // Calculate default split values
        if (splitMethod === "equal") {
            // All equal - the actual calculation happens at payment time
            members.forEach((member) => {
                member.splitValue = 0; // Will be calculated on display
            });
        } else if (splitMethod === "percentage") {
            // Default to equal percentages
            const equalPercentage = 100 / members.length;
            members.forEach((member) => {
                member.splitValue = parseFloat(equalPercentage.toFixed(2));
            });

            // Adjust last member to ensure 100%
            const totalPercentage = members.reduce(
                (sum, member) => sum + member.splitValue,
                0
            );
            if (members.length > 0) {
                members[members.length - 1].splitValue += 100 - totalPercentage;
            }
        } else if (splitMethod === "fixed") {
            // Default to equal fixed amounts
            const amount = parseFloat(newExpenseAmount || "0");
            const equalAmount = amount / members.length;
            members.forEach((member) => {
                member.splitValue = parseFloat(equalAmount.toFixed(2));
            });

            // Adjust last member to ensure total equals amount
            const totalFixed = members.reduce(
                (sum, member) => sum + member.splitValue,
                0
            );
            if (members.length > 0 && amount > 0) {
                members[members.length - 1].splitValue += amount - totalFixed;
            }
        }

        setExpenseMembers(members);
    }, [
        selectedGroup,
        costGroups,
        userData,
        friends,
        splitMethod,
        newExpenseAmount,
    ]);

    const loadFriends = useCallback(async () => {
        if (!userData || !userData.uid) {
            return;
        }

        try {
            // Query the nested friendsList collection
            const friendsRef = collection(
                db,
                "friends",
                userData.uid,
                "friendsList"
            );
            const snapshot = await getDocs(friendsRef);

            const friendsList: Friend[] = [];
            snapshot.forEach((doc) => {
                const friendData = doc.data();
                friendsList.push({
                    uid: doc.id,
                    firstName: friendData.firstName || "",
                    lastName: friendData.lastName || "",
                    username: friendData.username || "",
                    email: "",
                    photoURL: friendData.photoURL,
                });
            });

            setFriends(friendsList);
        } catch (error) {
            console.error("Error loading friends:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar amigos",
                description: "Não foi possível carregar sua lista de amigos."
            });
        }
    }, [userData, toast]);

    const loadCostGroups = useCallback(async () => {
        if (!userData || !userData.uid) {
            return;
        }
        setIsLoadingGroups(true);

        try {
            const groupsQuery = query(
                collection(db, "cost_groups"),
                where("members", "array-contains", userData.uid)
            );

            const snapshot = await getDocs(groupsQuery);
            const groupsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CostGroup[];

            setCostGroups(groupsData);
        } catch (error) {
            console.error("Error loading cost groups:", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar grupos",
                description: "Não foi possível carregar seus grupos de despesas."
            });
        } finally {
            setIsLoadingGroups(false);
        }
    }, [userData, toast]);

    const calculateBalances = useCallback(
        (expensesData: Expense[]) => {
            if (!userData || !selectedGroup) return;

            const group = costGroups.find((g) => g.id === selectedGroup);
            if (!group) return;

            // Initialize balances for all members
            const balanceMap: Record<
                string,
                { name: string; photoURL?: string; balance: number }
            > = {};

            // Add current user
            const firstName = userData.firstName || "";
            const lastName = userData.lastName || "";
            balanceMap[userData.uid] = {
                name: `${firstName} ${lastName}`.trim(),
                photoURL: userData.photoURL,
                balance: 0,
            };

            // Add friends who are in the group
            friends.forEach((friend) => {
                if (group.members.includes(friend.uid)) {
                    balanceMap[friend.uid] = {
                        name: `${friend.firstName} ${friend.lastName}`,
                        photoURL: friend.photoURL,
                        balance: 0,
                    };
                }
            });

            // Calculate expenses
            expensesData.forEach((expense) => {
                // Person who paid gets credit
                if (balanceMap[expense.paidBy]) {
                    balanceMap[expense.paidBy].balance += expense.amount;
                }

                // Each person owes their share
                if (expense.members && Array.isArray(expense.members)) {
                    expense.members.forEach((member) => {
                        if (balanceMap[member.uid]) {
                            let amountOwed = 0;

                            if (member.splitType === "equal") {
                                amountOwed = expense.amount / expense.members.length;
                            } else if (member.splitType === "percentage") {
                                amountOwed = (expense.amount * member.splitValue) / 100;
                            } else if (member.splitType === "fixed") {
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
                        Object.keys(balanceMap).forEach((memberId) => {
                            if (memberId !== expense.paidBy) {
                                balanceMap[memberId].balance -= equalShare;
                            }
                        });
                    }
                }
            });

            // Convert to array
            const balancesArray = Object.keys(balanceMap).map((uid) => ({
                uid,
                name: balanceMap[uid].name,
                photoURL: balanceMap[uid].photoURL,
                balance: parseFloat(balanceMap[uid].balance.toFixed(2)),
            }));

            setBalances(balancesArray);
        },
        [userData, selectedGroup, costGroups, friends]
    );

    const loadExpenses = useCallback(
        async (groupId: string) => {
            if (!userData || !userData.uid) {
                return;
            }
            setIsLoadingExpenses(true);

            try {
                const expensesQuery = query(
                    collection(db, "expenses"),
                    where("groupId", "==", groupId)
                );

                const snapshot = await getDocs(expensesQuery);
                const expensesData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Expense[];

                setExpenses(expensesData);
                calculateBalances(expensesData);
            } catch (error) {
                console.error("Error loading expenses:", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar despesas",
                    description: "Não foi possível carregar as despesas deste grupo."
                });
            } finally {
                setIsLoadingExpenses(false);
            }
        },
        [userData, calculateBalances, toast]
    );

    const updateMemberSplit = useCallback((uid: string, value: number) => {
        setExpenseMembers((prev) =>
            prev.map((member) =>
                member.uid === uid ? { ...member, splitValue: value } : member
            )
        );
    }, []);

    // Load friends, cost groups, and children
    useEffect(() => {
        if (userData && userData.uid) {
            loadFriends();
            loadCostGroups();
            
            // Load children from the children collection API
            const loadChildren = async () => {
                try {
                    // Get authentication token
                    const idToken = await auth.currentUser?.getIdToken();
                    
                    // Fetch children from API
                    const response = await fetch(
                        `/api/profile/children?userId=${userData.uid}&currentUserId=${userData.uid}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${idToken}`,
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        }
                    );
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch children');
                    }
                    
                    const childrenData = await response.json();
                    
                    // Transform the API response to Child format
                    const formattedChildren = childrenData.map((child: any) => ({
                        id: child.id,
                        firstName: child.firstName || '',
                        lastName: child.lastName || '',
                        photoURL: child.photoURL || null,
                        birthDate: child.birthDate || ''
                    }));
                    
                    setChildren(formattedChildren);
                    
                    // Create a map of children for easier lookup
                    const map: { [id: string]: Child } = {};
                    formattedChildren.forEach(child => {
                        map[child.id] = child;
                    });
                    setChildrenMap(map);
                } catch (error) {
                    console.error('Error fetching children:', error);
                    // Set empty arrays to avoid undefined errors
                    setChildren([]);
                    setChildrenMap({});
                }
            };
            
            loadChildren();
        }
    }, [userData, loadFriends, loadCostGroups]);

    // Load expenses when a group is selected
    useEffect(() => {
        if (selectedGroup) {
            loadExpenses(selectedGroup);
        }
    }, [selectedGroup, loadExpenses]);

    // When adding a new expense, initialize members list
    useEffect(() => {
        if (isAddingExpense && selectedGroup) {
            resetSplitPercentages();
        }
    }, [isAddingExpense, selectedGroup, splitMethod, resetSplitPercentages]);

    // When adding an expense, set the logged user as the one who paid
    useEffect(() => {
        if (isAddingExpense && userData && userData.uid) {
            setNewExpensePaidBy(userData.uid);
        }
    }, [isAddingExpense, userData]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Você precisa estar logado."
            });
            return;
        }

        if (!newGroupName.trim()) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Nome do grupo é obrigatório."
            });
            return;
        }

        if (newGroupMembers.length === 0) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Adicione pelo menos um membro ao grupo."
            });
            return;
        }

        try {
            // Make sure the creator is in the members list
            const members = [userData.uid, ...newGroupMembers];

            const now = Timestamp.now();
            const groupRef = await addDoc(collection(db, "cost_groups"), {
                name: newGroupName,
                description: newGroupDescription,
                createdBy: userData.uid,
                members,
                createdAt: now,
                updatedAt: now,
            });

            toast({
                title: "Grupo criado",
                description: "Grupo criado com sucesso!"
            });

            // Reset form
            setNewGroupName("");
            setNewGroupDescription("");
            setNewGroupMembers([]);
            setIsAddingGroup(false);

            // Reload groups
            loadCostGroups();
        } catch (error) {
            console.error("Error creating group:", error);
            toast({
                variant: "destructive",
                title: "Erro ao criar grupo",
                description: "Não foi possível criar o grupo. Tente novamente."
            });
        }
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userData || !selectedGroup) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Selecione um grupo primeiro."
            });
            return;
        }

        if (!newExpenseDescription.trim()) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Descrição é obrigatória."
            });
            return;
        }

        if (!newExpenseAmount || parseFloat(newExpenseAmount) <= 0) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Valor deve ser maior que zero."
            });
            return;
        }

        if (!newExpensePaidBy) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Selecione quem pagou."
            });
            return;
        }

        if (!newExpenseCategory) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Selecione uma categoria."
            });
            return;
        }

        // Validate split values
        if (splitMethod === "percentage") {
            const totalPercentage = expenseMembers.reduce(
                (sum, member) => sum + member.splitValue,
                0
            );
            if (Math.abs(totalPercentage - 100) > 0.01) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "O total das porcentagens deve ser 100%."
                });
                return;
            }
        } else if (splitMethod === "fixed") {
            const totalFixed = expenseMembers.reduce(
                (sum, member) => sum + member.splitValue,
                0
            );
            const totalAmount = parseFloat(newExpenseAmount);
            if (Math.abs(totalFixed - totalAmount) > 0.01) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: `O total dos valores fixos deve ser igual ao valor total (${totalAmount}).`
                });
                return;
            }
        }

        try {
            const amount = parseFloat(newExpenseAmount);
            const now = Timestamp.now();
            const expenseDate = new Date(newExpenseDate);

            await addDoc(collection(db, "expenses"), {
                groupId: selectedGroup,
                description: newExpenseDescription,
                amount,
                paidBy: newExpensePaidBy,
                category: newExpenseCategory,
                date: Timestamp.fromDate(expenseDate),
                members: expenseMembers,
                childrenIds: selectedChildrenIds.length > 0 ? selectedChildrenIds : undefined,
                createdAt: now,
                updatedAt: now,
            });

            toast({
                title: "Despesa criada",
                description: "Despesa criada com sucesso!"
            });

            // Reset form
            setNewExpenseDescription("");
            setNewExpenseAmount("");
            setNewExpenseCategory("");
            setNewExpenseDate(new Date().toISOString().split("T")[0]);
            setSelectedChildrenIds([]);
            setIsAddingExpense(false);

            // Reload expenses
            loadExpenses(selectedGroup);
        } catch (error) {
            console.error("Error creating expense:", error);
            toast({
                variant: "destructive",
                title: "Erro ao criar despesa",
                description: "Não foi possível criar a despesa. Tente novamente."
            });
        }
    };

    // Handle viewing expense details
    const handleViewExpense = (expense: Expense) => {
        setSelectedExpense(expense);
        setViewExpenseModalOpen(true);
    };

    // Handle editing an expense
    const handleEditExpense = (expense: Expense) => {
        // Set all form fields to the values from the selected expense
        setSelectedExpense(expense);
        setNewExpenseDescription(expense.description);
        setNewExpenseAmount(expense.amount.toString());
        setNewExpensePaidBy(expense.paidBy);
        setNewExpenseCategory(expense.category);
        
        // Convert Firebase timestamp to date string
        try {
            const date = expense.date.toDate();
            setNewExpenseDate(date.toISOString().split('T')[0]);
        } catch (error) {
            setNewExpenseDate(new Date().toISOString().split('T')[0]);
        }
        
        // Set selected children IDs if available
        setSelectedChildrenIds(expense.childrenIds || []);
        
        // Set expense members
        if (expense.members && expense.members.length > 0) {
            setExpenseMembers(expense.members);
            // Determine split method from first member
            setSplitMethod(expense.members[0].splitType);
        } else {
            resetSplitPercentages();
        }
        
        // Show the form for editing
        setIsEditingExpense(true);
        setIsAddingExpense(true);
    };
    
    // Handle updating an expense
    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedExpense || !userData || !selectedGroup) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Despesa não encontrada ou usuário não autenticado."
            });
            return;
        }
        
        try {
            const amount = parseFloat(newExpenseAmount);
            const now = Timestamp.now();
            const expenseDate = new Date(newExpenseDate);
            
            // Update the expense document
            await updateDoc(doc(db, "expenses", selectedExpense.id), {
                description: newExpenseDescription,
                amount,
                paidBy: newExpensePaidBy,
                category: newExpenseCategory,
                date: Timestamp.fromDate(expenseDate),
                members: expenseMembers,
                childrenIds: selectedChildrenIds.length > 0 ? selectedChildrenIds : [],
                updatedAt: now,
            });
            
            toast({
                title: "Despesa atualizada",
                description: "Despesa atualizada com sucesso!"
            });
            
            // Reset form and state
            setNewExpenseDescription("");
            setNewExpenseAmount("");
            setNewExpenseCategory("");
            setNewExpenseDate(new Date().toISOString().split("T")[0]);
            setSelectedChildrenIds([]);
            setIsAddingExpense(false);
            setIsEditingExpense(false);
            setSelectedExpense(null);
            
            // Reload expenses
            loadExpenses(selectedGroup);
        } catch (error) {
            console.error("Error updating expense:", error);
            toast({
                variant: "destructive",
                title: "Erro ao atualizar despesa",
                description: "Não foi possível atualizar a despesa. Tente novamente."
            });
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;

        try {
            // Find the expense to check permissions
            const expense = expenses.find((e) => e.id === expenseId);

            if (!expense) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Despesa não encontrada."
                });
                return;
            }

            if (!userData) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Usuário não autenticado."
                });
                return;
            }

            // Check if current user paid for the expense or is the group creator
            const group = costGroups.find((g) => g.id === expense.groupId);
            const isGroupCreator = group && group.createdBy === userData.uid;
            const isPayer = expense.paidBy === userData.uid;

            if (!isGroupCreator && !isPayer) {
                toast({
                    variant: "destructive",
                    title: "Permissão negada",
                    description: "Você só pode excluir despesas que você pagou ou se for o criador do grupo."
                });
                return;
            }

            await deleteDoc(doc(db, "expenses", expenseId));
            toast({
                title: "Despesa excluída",
                description: "Despesa excluída com sucesso!"
            });

            // Reload expenses
            if (selectedGroup) {
                loadExpenses(selectedGroup);
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({
                variant: "destructive",
                title: "Erro ao excluir despesa",
                description: "Verifique se você tem permissão para esta ação."
            });
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (
            !confirm(
                "Tem certeza que deseja excluir este grupo? Todas as despesas serão perdidas."
            )
        )
            return;

        try {
            // Check if the current user is the creator of the group
            const group = costGroups.find((g) => g.id === groupId);

            if (!group) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: "Grupo não encontrado."
                });
                return;
            }

            // Check if the current user is the creator of the group
            if (!userData || group.createdBy !== userData.uid) {
                toast({
                    variant: "destructive",
                    title: "Permissão negada",
                    description: "Você não tem permissão para excluir este grupo. Apenas o criador pode excluí-lo."
                });
                return;
            }

            // First, delete the group document
            await deleteDoc(doc(db, "cost_groups", groupId));

            // Reset selected group if it was deleted
            if (selectedGroup === groupId) {
                setSelectedGroup(null);
                setExpenses([]);
                setBalances([]);
            }

            toast({
                title: "Grupo excluído",
                description: "Grupo e suas despesas foram excluídos com sucesso!"
            });

            // Reload groups
            loadCostGroups();

            // Now handle expense deletion separately to avoid permission issues
            // This runs after the primary operation is complete and UI is updated
            setTimeout(async () => {
                try {
                    // Get all expenses in this group
                    const expensesQuery = query(
                        collection(db, "expenses"),
                        where("groupId", "==", groupId)
                    );
                    
                    const snapshot = await getDocs(expensesQuery);
                    
                    // If there are no expenses, we're done
                    if (snapshot.empty) return;
                    
                    // Delete expenses in batches to avoid timeouts
                    const deleteBatch = async (docs: any[]) => {
                        for (const docSnap of docs) {
                            try {
                                await deleteDoc(docSnap.ref);
                            } catch (err) {
                                console.log(`Could not delete expense ${docSnap.id}:`, err);
                                // Continue with other deletions even if one fails
                            }
                        }
                    };
                    
                    await deleteBatch(snapshot.docs);
                } catch (err) {
                    console.log("Error cleaning up expenses:", err);
                    // Don't show error to user since the main operation succeeded
                }
            }, 500);
        } catch (error) {
            console.error("Error deleting group:", error);
            toast({
                variant: "destructive",
                title: "Erro ao excluir grupo",
                description: "Verifique se você tem permissão para esta ação."
            });
        }
    };

    // Filter expenses by date period
    const filteredExpenses = expenses.filter((expense) => {
        if (selectedPeriod === "all") return true;

        const expenseDate = expense.date.toDate();
        const now = new Date();

        if (selectedPeriod === "7d") {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return expenseDate >= sevenDaysAgo;
        } else if (selectedPeriod === "30d") {
            const thirtyDaysAgo = new Date(
                now.getTime() - 30 * 24 * 60 * 60 * 1000
            );
            return expenseDate >= thirtyDaysAgo;
        } else if (selectedPeriod === "90d") {
            const ninetyDaysAgo = new Date(
                now.getTime() - 90 * 24 * 60 * 60 * 1000
            );
            return expenseDate >= ninetyDaysAgo;
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <UserProfileBar pathname="Finanças" />
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner />
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

    return (
        <div className="flex flex-col min-h-screen pb-20 md:pb-0">
            <UserProfileBar pathname="Finanças" />

            <div className="flex-1 p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left Column - Groups */}
                    <div className={`lg:col-span-1 ${selectedGroup ? "sm:block" : ""}`}>
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
                                    handleCreateExpense={isEditingExpense ? handleUpdateExpense : handleCreateExpense}
                                    isEditing={isEditingExpense}
                                    userData={userData}
                                    friends={friends}
                                    children={children}
                                    costGroups={costGroups}
                                    selectedGroup={selectedGroup}
                                    selectedChildrenIds={selectedChildrenIds}
                                    setSelectedChildrenIds={setSelectedChildrenIds}
                                    resetSplitPercentages={resetSplitPercentages}
                                />

                                <ExpenseList
                                    isLoadingExpenses={isLoadingExpenses}
                                    filteredExpenses={filteredExpenses}
                                    handleDeleteExpense={handleDeleteExpense}
                                    handleViewExpense={handleViewExpense}
                                    handleEditExpense={handleEditExpense}
                                    userData={userData}
                                    friends={friends}
                                    children={childrenMap}
                                />
                                
                                {/* View Expense Modal */}
                                <ExpenseModal 
                                    expense={selectedExpense}
                                    isOpen={viewExpenseModalOpen}
                                    onClose={() => setViewExpenseModalOpen(false)}
                                    userData={userData}
                                    friends={friends}
                                    children={childrenMap}
                                />

                                {/* Analytics */}
                                <ExpenseAnalytics 
                                    filteredExpenses={filteredExpenses}
                                    children={children}
                                />

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
}