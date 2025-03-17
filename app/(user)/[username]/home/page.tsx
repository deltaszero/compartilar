// app/(user)/[username]/home/page.tsx
"use client";
import { useEffect, useState } from "react";
// import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

import { useUser } from "@/context/userContext";
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import Calendar from "../calendario/components/Calendar";
import LoadingPage from '@/app/components/LoadingPage';
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

// Imported images
// import supportImg from "@/app/assets/images/support-icon.png";
// import calendarImg from "@/app/assets/images/calendar-icon.png";
// import familyImg from "@/app/assets/images/family-icon.png";

// Imported components
import UserProfileCard from "./components/UserProfileCard";
import KidsGrid from "./components/KidsGrid";
import KidsGridMobile from "./components/KidsGridMobile";
import { CurrentWeek } from "./components/CurrentWeek";
import { FriendList } from "./components/FriendList";
import { InvitationDialog } from "./components/InvitationDialog";
import { HomeFinanceAnalytics } from "./components/HomeFinanceAnalytics";
import ProfileCompletion from "./components/ProfileCompletion";
import { PremiumFeatureShowcase } from "./components/PremiumFeatureShowcase";
import FeatureCardMenu from "./components/FeatureCardMenu";

// Financial analytics
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, getUserChildren } from "@/app/lib/firebaseConfig";
import { Expense, Child } from "@/app/(user)/[username]/financas/components/types";
// import { EXPENSE_CATEGORIES } from "../financas/components/constants";

// Set locale for dayjs
dayjs.locale("pt-br");

export default function HomePage() {
    const { userData } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);

    // Financial analytics state
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [children, setChildren] = useState<Child[]>([]);

    // Handle date selection for the weekly calendar
    const handleDateSelect = (date: dayjs.Dayjs) => {
        setSelectedDate(date);
    };

    // check for mobile screen size
    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);

    // Simulate loading time
    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 1);
        return () => clearTimeout(timer);
    }, []);

    // Load financial data for analytics
    useEffect(() => {
        const loadFinancialData = async () => {
            if (!userData || !userData.uid) return;

            // Simulate loading complete without actually querying Firestore
            setTimeout(() => {
                setLoadingExpenses(false);
            }, 1000);

            // All Firestore queries commented out temporarily
            /*
            // Wait a moment to ensure authentication is complete
            // This helps prevent Firestore permission errors
            await new Promise(resolve => setTimeout(resolve, 1500));

            setLoadingExpenses(true);
            try {
                // Load expenses for the last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                // First, get all children the user has access to
                const userChildren = await getUserChildren(userData.uid);
                
                // If no children found, early return
                if (userChildren.length === 0) {
                    setLoadingExpenses(false);
                    return;
                }
                
                // Extract child IDs
                const childIds = userChildren.map(child => child.id);
                
                // Fetch expense groups for all children
                let allExpenses: Expense[] = [];
                
                // Process each child's expense groups
                for (const childId of childIds) {
                    try {
                        // Query for expense groups related to this child
                        const expenseGroupsQuery = query(
                            collection(db, "children", childId, "expenseGroups")
                        );
                        
                        const expenseGroupsSnapshot = await getDocs(expenseGroupsQuery);
                        
                        // For each expense group, get the expenses
                        for (const groupDoc of expenseGroupsSnapshot.docs) {
                            const groupId = groupDoc.id;
                            const groupData = groupDoc.data();
                            
                            // Check if user has permission to view this group
                            // If it's a private group, only the creator can see it
                            if (groupData.isPrivate && groupData.createdBy !== userData.uid) {
                                continue;
                            }
                            
                            // Query for expenses in this group
                            const expensesQuery = query(
                                collection(db, "children", childId, "expenseGroups", groupId, "expenses")
                            );
                            
                            const expensesSnapshot = await getDocs(expensesQuery);
                            
                            // Add these expenses to our collection
                            const groupExpenses = expensesSnapshot.docs
                                .map(doc => ({
                                    id: doc.id,
                                    groupId,
                                    childId,
                                    ...doc.data()
                                } as Expense))
                                .filter(expense => {
                                    // Filter by date client-side
                                    try {
                                        const expenseDate = expense.date.toDate();
                                        return expenseDate >= thirtyDaysAgo;
                                    } catch (e) {
                                        console.error("Invalid date format in expense:", expense.id);
                                        return false;
                                    }
                                });
                            
                            allExpenses = [...allExpenses, ...groupExpenses];
                        }
                    } catch (error) {
                        console.error(`Error fetching expense groups for child ${childId}:`, error);
                    }
                }
                
                setExpenses(allExpenses);
                
                // Transform children data from the getUserChildren function
                const childrenData = userChildren.map(child => ({
                    id: child.id,
                    firstName: child.firstName || '',
                    lastName: child.lastName || '',
                    photoURL: child.photoURL || undefined,
                    birthDate: child.birthDate || '',
                    accessLevel: child.accessLevel
                } as Child));
                
                setChildren(childrenData);
            } catch (error) {
                console.error("Error loading financial data:", error);
            } finally {
                setLoadingExpenses(false);
            }
            */
        };

        loadFinancialData();
    }, [userData]);

    if (initialLoading || !userData) {
        return <LoadingPage />;
    }

    return (
        <div>
            <UserProfileBar pathname="Home" />
            <div className="flex flex-col sm:mb-0 sm:p-6 sm:gap-6">
                <div className="flex flex-col relative sm:rounded-none">
                    <section className="flex flex-col ">
                        <UserProfileCard userData={userData} />
                        <div className="p-4">
                            <ProfileCompletion userData={userData} />
                        </div>
                    </section>

                    {/* Mobile Feature Card Menu */}
                    {isMobile && <FeatureCardMenu username={userData.username} />}
                </div>

                <article className="flex flex-col sm:rounded-none z-[10]">
                    <div className="flex flex-col gap-0 sm:gap-4 sm:flex-row">
                        <div className="flex flex-col">
                            {/* KIDS SECTION */}
                            {/* <section className=" mx-auto p-4">
                                {isMobile ? (
                                    <div>
                                        <div className="flex flex-col gap-2 pb-2">
                                            <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto">
                                                <div className="flex flex-col gap-0">
                                                    <h2 className="text-3xl text-warning font-black">
                                                        Cuide dos seus pequenos
                                                    </h2>
                                                    <p className="text-xs">
                                                        Adicione, edite e acompanhe as principais informações
                                                        sobre seus filhos.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <KidsGridMobile parentId={userData.uid} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between px-2 rounded-none bg-warning relative mx-auto h-[8em] bg-mainStrongOrange border-2 border-border rounded-none p-4 bg-bg shadow-shadow">
                                            <div className="flex flex-col gap-2">
                                                <h2 className="text-3xl font-black z-10 max-w-[66%]">
                                                    Petiz
                                                </h2>
                                                <p className="text-xs">
                                                    Educação, Saúde, Hobbies e outras informações essenciais
                                                    sobre seus filhos.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-base-100 rounded-xl">
                                            <div className="py-4">
                                                <KidsGrid parentId={userData.uid} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section> */}

                            {/* MOBILE CALENDAR SECTION */}
                            {/* <section>
                                {isMobile ? (
                                    <div className="flex flex-col mx-auto p-4">
                                        <div className="flex flex-col gap-2 pb-2">
                                            <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto">
                                                <div className="flex flex-col gap-0">
                                                    <h2 className="text-3xl text-warning font-black">
                                                        Planeje-se para a semana
                                                    </h2>
                                                    <p className="text-xs">
                                                        Consulte dias de convivência e agende eventos de forma compartilhada.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <CurrentWeek
                                            selectedDate={selectedDate}
                                            onDateSelect={handleDateSelect}
                                        />
                                    </div>
                                ) : (
                                    <div className="h-0" />
                                )}
                            </section> */}

                            {/* SUPPORT NETWORK SECTION */}
                            <section className="w-full mx-auto p-4">
                                {isMobile ? (
                                    <div className="flex flex-col gap-2 pb-2">
                                        <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto">
                                            <div className="flex flex-col gap-0">
                                                <h2 className="text-3xl font-black font-raleway">
                                                    Rede de Apoio
                                                </h2>
                                                <p className="text-sm font-nunito">
                                                    Entre em contato com pessoas queridas que estão com você em todos os momentos.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between px-4 rounded-none relative mx-auto h-[8em] mb-4 bg-mainStrongYellow border-2 border-border rounded-none p-4 bg-bg shadow-shadow">
                                            <div className="flex flex-col gap-2 max-w-[66%]">
                                                <h2 className="text-3xl font-black font-raleway">
                                                    Rede de Apoio
                                                </h2>
                                                <p className="text-xs font-nunito">
                                                    Pessoas queridas que provam que juntos somos mais fortes!
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                )}
                                <div className="bg-white overflow-hidden border-2 border-black shadow-brutalist">
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-black tracking-tight font-raleway">
                                                Amigos e Família
                                            </h3>
                                        </div>
                                        <FriendList userId={userData.uid} />
                                    </div>

                                    {isMobile && (
                                        <div className="h-0" />
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* BROWSER CALENDAR SECTION */}
                        {/* <section className=" w-2/3 mx-auto p-4">
                            {isMobile ? (
                                <div className="h-0" />
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between px-2 rounded-none relative mx-auto h-[8em] bg-mainStrongRed border-2 border-border rounded-none p-4 bg-bg shadow-shadow">
                                        <div className="flex flex-col gap-2 ">
                                            <h2 className="text-3xl font-black z-10 max-w-[66%]">
                                                Calendário
                                            </h2>
                                            <p className="text-xs">
                                                Consulte dias de convivência e agende eventos de forma
                                                compartilhada.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden sm:block bg-base-100 rounded-xl py-4">
                                        <Calendar initialMonth={new Date()} />
                                    </div>
                                </div>
                            )}
                        </section> */}
                    </div>

                    {/* Invitation Dialog */}
                    {/* <InvitationDialog
                        isOpen={isInvitationDialogOpen}
                        onClose={() => setIsInvitationDialogOpen(false)}
                        userData={{
                            uid: userData.uid,
                            firstName: userData.firstName || '',
                            lastName: userData.lastName || '',
                            username: userData.username
                        }}
                    /> */}

                    {/* Financial Analytics Section 
                    <section className="w-full mx-auto p-4 pb-[5em]">
                        {isMobile ? (
                            <div className="flex flex-col gap-2 pb-2">
                                <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto">
                                    <div className="flex flex-col gap-0">
                                        <h2 className="text-3xl text-warning font-black">
                                            Acompanhe
                                        </h2>
                                        <p className="text-xs">
                                            Registre e visualize os valores investidos nos seus pequenos em tabelas e gráficos interativos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:block">
                                <div className="flex items-center justify-between px-4 rounded-none relative mx-auto h-[8em] mb-4 bg-mainStrongBlue border-2 border-border rounded-none p-4 bg-bg shadow-shadow">
                                    <div className="flex flex-col gap-2 z-10 max-w-[66%]">
                                        <h2 className="text-2xl sm:text-3xl font-bold">
                                            Resumo Financeiro
                                        </h2>
                                        <p className="text-xs">
                                            Acompanhe os valores investidos nos seus pequenos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="md:grid md:grid-cols-3 md:gap-4">
                            <HomeFinanceAnalytics
                                expenses={expenses}
                                childrenData={children}
                                username={userData.username}
                                isLoading={loadingExpenses}
                            />
                        </div>
                    </section>
                    */}
                    <div className="h-[5em]"/>
                </article>
            </div>
            <Toaster />
        </div>
    );
}