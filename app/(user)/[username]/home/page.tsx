// app/(user)/[username]/home/page.tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
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

// Financial analytics
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { EXPENSE_CATEGORIES } from "../financas/components/constants";

// Set locale for dayjs
dayjs.locale("pt-br");

export default function HomePage() {
    const { userData } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);
    
    // Financial analytics state
    const [expenses, setExpenses] = useState([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [children, setChildren] = useState([]);

    // Handle date selection for the weekly calendar
    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };

    // Check for mobile screen size
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
        }, 1500);
        return () => clearTimeout(timer);
    }, []);
    
    // Load financial data for analytics
    useEffect(() => {
        const loadFinancialData = async () => {
            if (!userData || !userData.uid) return;
            
            setLoadingExpenses(true);
            try {
                // Load expenses for the last 30 days
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                // Find cost groups for the user
                const groupsQuery = query(
                    collection(db, "cost_groups"),
                    where("members", "array-contains", userData.uid)
                );
                const groupsSnapshot = await getDocs(groupsQuery);
                const groupIds = groupsSnapshot.docs.map(doc => doc.id);
                
                // If no groups found, early return
                if (groupIds.length === 0) {
                    setLoadingExpenses(false);
                    return;
                }
                
                // Query expenses from these groups - without using date filter to avoid requiring a composite index
                let allExpenses = [];
                for (const groupId of groupIds) {
                    const expensesQuery = query(
                        collection(db, "expenses"),
                        where("groupId", "==", groupId)
                    );
                    
                    const expensesSnapshot = await getDocs(expensesQuery);
                    const groupExpenses = expensesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(expense => {
                        // Filter by date client-side instead
                        try {
                            const expenseDate = expense.date.toDate();
                            return expenseDate >= thirtyDaysAgo;
                        } catch (error) {
                            return false;
                        }
                    });
                    
                    allExpenses = [...allExpenses, ...groupExpenses];
                }
                
                setExpenses(allExpenses);
                
                // Transform kids data from userData to the format needed for the charts
                if (userData.kids) {
                    const childrenData = Object.entries(userData.kids).map(([id, kidData]) => ({
                        id,
                        firstName: kidData.firstName || '',
                        lastName: kidData.lastName || '',
                        photoURL: kidData.photoURL,
                        birthDate: kidData.birthDate || ''
                    }));
                    setChildren(childrenData);
                }
            } catch (error) {
                console.error("Error loading financial data:", error);
            } finally {
                setLoadingExpenses(false);
            }
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
                <div className="flex flex-col relative sm:rounded-3xl">
                    <section className="flex flex-col ">
                        <UserProfileCard userData={userData} />
                    </section>
                </div>

                <article className="flex flex-col sm:rounded-3xl z-[10]">
                    <div className="flex flex-col gap-0 sm:gap-4 sm:flex-row">
                        <div className="flex flex-col">
                            {/* KIDS SECTION */}
                            <section className=" mx-auto p-4">
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
                                        <div className="flex items-center justify-between px-2 rounded-md bg-warning relative mx-auto h-[8em] bg-mainStrongOrange border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                                            <div className="flex flex-col gap-2">
                                                <h2 className="text-3xl font-bold z-10 max-w-[66%]">
                                                    Petiz
                                                </h2>
                                                <p className="text-xs">
                                                    Educação, Saúde, Hobbies e outras informações essenciais
                                                    sobre seus filhos.
                                                </p>
                                            </div>
                                            {/* <Image
                                                src={familyImg}
                                                alt="Family"
                                                priority
                                                quality={75}
                                                className="object-contain"
                                                width={128}
                                                height={128}
                                            /> */}
                                        </div>
                                        <div className="bg-base-100 rounded-xl">
                                            <div className="py-4">
                                                <KidsGrid parentId={userData.uid} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>

                            {/* MOBILE CALENDAR SECTION */}
                            <section>
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
                            </section>

                            {/* SUPPORT NETWORK SECTION */}
                            <section className="w-full mx-auto p-4">
                                {isMobile ? (
                                    <div className="flex flex-col gap-2 pb-2">
                                        <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto">
                                            <div className="flex flex-col gap-0">
                                                <h2 className="text-3xl text-warning font-black">
                                                    Peça ajuda
                                                </h2>
                                                <p className="text-xs">
                                                    Entre em contato com pessoas queridas que estão com você em todos os momentos.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Banner/Header */}
                                        <div className="flex items-center justify-between px-4 rounded-md relative mx-auto h-[8em] mb-4 bg-mainStrongYellow border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                                            <div className="flex flex-col gap-2 z-10 max-w-[66%]">
                                                <h2 className="text-2xl sm:text-3xl font-bold">
                                                    Rede de Apoio
                                                </h2>
                                                <p className="text-xs">
                                                    Pessoas queridas que provam que juntos somos mais fortes!
                                                </p>
                                            </div>
                                            {/* <Image
                                                src={supportImg}
                                                alt="Support Network"
                                                priority
                                                quality={75}
                                                className="object-contain absolute right-0 bottom-0"
                                                width={isMobile ? 96 : 128}
                                                height={isMobile ? 96 : 128}
                                            /> */}
                                        </div>

                                    </div>
                                )}
                                {/* Content Area */}
                                <div className="bg-white border-2 border-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
                                    {/* Friend List - always visible */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold tracking-tight">Amigos e Família</h3>
                                            <Button
                                                onClick={() => setIsInvitationDialogOpen(true)}
                                                className="bg-secondaryMain"
                                                // className="gap-1 rounded-none border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                size="sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Convidar
                                            </Button>
                                        </div>
                                        <FriendList userId={userData.uid} />
                                    </div>

                                    {/* Mobile view */}
                                    {isMobile && (
                                        <div className="flex justify-center pb-4">
                                            <Link
                                                href={`/${userData.username}/rede`}
                                                className="inline-flex items-center justify-center rounded-none text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border-2 border-black bg-white text-black hover:bg-black hover:text-white h-10 py-2 px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                            >
                                                Ver página completa da rede
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* BROWSER CALENDAR SECTION */}
                        <section className=" mx-auto p-4">
                            {isMobile ? (
                                <div className="h-12" />
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between px-2 rounded-md relative mx-auto h-[8em] bg-mainStrongRed border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                                        <div className="flex flex-col gap-2 ">
                                            <h2 className="text-3xl font-bold z-10 max-w-[66%]">
                                                Calendário
                                            </h2>
                                            <p className="text-xs">
                                                Consulte dias de convivência e agende eventos de forma
                                                compartilhada.
                                            </p>
                                        </div>
                                        {/* <Image
                                            src={calendarImg}
                                            alt="Calendar"
                                            priority
                                            quality={75}
                                            className="object-contain"
                                            width={128}
                                            height={128}
                                        /> */}
                                    </div>
                                    <div className="hidden sm:block bg-base-100 rounded-xl py-4">
                                        <Calendar initialMonth={new Date()} />
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Invitation Dialog */}
                    <InvitationDialog
                        isOpen={isInvitationDialogOpen}
                        onClose={() => setIsInvitationDialogOpen(false)}
                        userData={{
                            uid: userData.uid,
                            firstName: userData.firstName || '',
                            lastName: userData.lastName || '',
                            username: userData.username
                        }}
                    />
                    
                    {/* Financial Analytics Section */}
                    <section className="w-full mx-auto p-4">
                        <div className="hidden md:block">
                            <div className="flex items-center justify-between px-4 rounded-md relative mx-auto h-[8em] mb-4 bg-mainStrongBlue border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                                <div className="flex flex-col gap-2 z-10 max-w-[66%]">
                                    <h2 className="text-2xl sm:text-3xl font-bold">
                                        Resumo Financeiro
                                    </h2>
                                    <p className="text-xs">
                                        Acompanhe seus gastos e organize suas finanças pessoais.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="md:grid md:grid-cols-3 md:gap-4">
                            <HomeFinanceAnalytics
                                expenses={expenses}
                                children={children}
                                username={userData.username}
                                isLoading={loadingExpenses}
                            />
                        </div>
                    </section>
                </article>
            </div>
            <Toaster />
        </div>
    );
}