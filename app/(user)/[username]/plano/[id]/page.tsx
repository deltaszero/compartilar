'use client';

import { useState, use, useEffect } from 'react';
import { usePlan } from './context';
import { planSections } from '../types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Pencil, CheckCircle2, CircleDashed, PlusCircle, History, Grid3X3, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate, cn } from '@/lib/utils';
import Image from 'next/image';
import PlanChangeLog from '../components/PlanChangeLog';
import PlanSectionImage from '../components/PlanSectionImage';
import { useUser } from '@/context/userContext';

interface EditorInfo {
    id: string;
    displayName: string;
    photoURL: string | null;
    email: string | null;
}

export default function PlanPage({ params }: { params: Promise<{ username: string; id: string }> }) {
    const resolvedParams = use(params);
    const { plan, isLoading, error } = usePlan();
    const router = useRouter();
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("sections"); // 'sections' or 'history'
    const [editors, setEditors] = useState<EditorInfo[]>([]);
    const [isLoadingEditors, setIsLoadingEditors] = useState(false);
    
    // Fetch editor information when plan loads
    useEffect(() => {
        const fetchEditors = async () => {
            if (!plan || !plan.editors || plan.editors.length === 0) return;
            
            setIsLoadingEditors(true);
            
            try {
                const editorsList: EditorInfo[] = [];
                
                // Fetch data for each editor
                for (const editorId of plan.editors) {
                    try {
                        const response = await fetch(`/api/users/${editorId}`);
                        
                        if (response.ok) {
                            const userData = await response.json();
                            
                            editorsList.push({
                                id: editorId,
                                displayName: userData.displayName || userData.email || 'Usuário',
                                photoURL: userData.photoURL,
                                email: userData.email
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching editor ${editorId}:`, error);
                    }
                }
                
                setEditors(editorsList);
            } catch (error) {
                console.error('Error fetching editors:', error);
            } finally {
                setIsLoadingEditors(false);
            }
        };
        
        fetchEditors();
    }, [plan]);

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary border-t-primary mb-4"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Carregando plano parental...</p>
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div className="p-8 bg-white/50 border border-red-200 rounded-lg max-w-md mx-auto my-12">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-red-700 mb-2">Erro ao carregar plano</h1>
                    <p className="text-gray-600 mb-6">{error || 'Plano parental não encontrado ou sem permissão de acesso'}</p>
                    <Button
                        variant="default"
                        onClick={() => router.push(`/${resolvedParams.username}/plano`)}
                    >
                        Voltar para lista de planos
                    </Button>
                </div>
            </div>
        );
    }

    const getCompletedSectionsCount = () => {
        if (!plan.sections) return 0;

        let count = 0;
        planSections.forEach(section => {
            if (plan.sections[section.id as keyof typeof plan.sections]) {
                count++;
            }
        });

        return count;
    };

    // Calculate completion percentage
    const completionPercentage = Math.round((getCompletedSectionsCount() / planSections.length) * 100);

    // Check if plan has any pending changes
    const hasPendingChanges = () => {
        return Object.entries(plan.sections || {}).some(([_, sectionData]) => {
            if (typeof sectionData === 'object') {
                return Object.entries(sectionData).some(([_, fieldValue]) => {
                    return fieldValue !== null && 
                           typeof fieldValue === 'object' && 
                           'status' in fieldValue && 
                           fieldValue.status === 'pending';
                });
            }
            return false;
        });
    };

    return (
        <div className="px-4 md:px-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <div className='bg-bw p-4 border-2 border-black shadow-brutalist'>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div className="flex-grow">
                            <h2 className="text-lg md:text-xl font-bold font-raleway">
                                Progresso Geral
                            </h2>
                            <span className="inline-flex items-center py-1 text-sm text-main font-nunito">
                                {completionPercentage}% completo
                            </span>
                            <div className="py-2">
                                <Progress value={completionPercentage} className="h-3" />
                            </div>
                            <div className="flex flex-row gap-1 text-sm font-nunito">
                                <span className="font-medium">{getCompletedSectionsCount()}</span> de <span className="font-medium">{planSections.length}</span> seções preenchidas
                            </div>
                        </div>
                        
                        <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <h3 className="text-md font-raleway font-semibold">
                                    Editores do Plano
                                </h3>
                            </div>
                            
                            <div className="mt-1 space-y-2 max-w-xs">
                                {isLoadingEditors ? (
                                    <div className="text-xs text-gray-500 italic">Carregando editores...</div>
                                ) : editors.length === 0 ? (
                                    <div className="text-xs text-gray-500">Nenhum editor encontrado</div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {editors.map(editor => (
                                            <div key={editor.id} className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                    {editor.photoURL ? (
                                                        <Image 
                                                            src={editor.photoURL} 
                                                            alt={editor.displayName}
                                                            width={24}
                                                            height={24} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-blank text-white text-xs font-black">
                                                            {editor.displayName.substring(0, 1).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm">
                                                    <div className="font-raleway font-semibold">
                                                        {editor.displayName} 
                                                        {user && editor.id === user.uid && (
                                                            <span className="ml-1 text-xs text-gray-500 italic">
                                                                (você)
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* {editor.email && (
                                                        <div className="text-gray-500 text-xs">
                                                            {editor.email}
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-row items-end justify-end gap-4 font-nunito my-2">
                    <span className="text-xs">
                        Última atualização em {new Date(plan.updated_at).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                    {hasPendingChanges() && (
                        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-100">
                            Mudanças pendentes
                        </Badge>
                    )}
                </div>
            </div>

            <Tabs defaultValue="sections" onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-none">
                    <TabsTrigger value="sections" className="data-[state=active]:bg-main data-[state=active]:font-raleway data-[state=active]:text-bold">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                            Seções
                    </TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-main data-[state=active]:font-raleway data-[state=active]:text-bold">
                        <History className="h-4 w-4 mr-2" />
                            Histórico
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sections" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {planSections.map((section) => {
                            const isCompleted = !!plan.sections[section.id as keyof typeof plan.sections];
                            return (
                                <div
                                    key={section.id}
                                    // className={cn(
                                    //     "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-none",//"bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg",
                                    //     isCompleted ? "border-main/70" : "border-gray-200"
                                    // )}
                                    className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-none"
                                >
                                    <div className="px-4 pt-2 border-b border-gray-100">
                                        <div className="flex items-end overflow-hidden">
                                        
                                            {/* <div className={cn(
                                                "flex items-center justify-center w-8 h-8 rounded-full mr-3 flex-shrink-0",
                                                isCompleted ? "bg-main" : "bg-gray-100 border border-gray-200"
                                            )}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-bw" />
                                                ) : (
                                                    <CircleDashed className="h-5 w-5 text-blank" />
                                                )}
                                            </div> */}
                                            <div className="flex-grow flex items-center min-w-0 mr-2">
                                                <div className="w-full">
                                                    <h3 className="font-bold font-raleway text-xl break-words">
                                                        {section.title}
                                                    </h3>
                                                    <p className="text-xs md:text-sm text-gray-500 mt-1 font-nunito">
                                                        {isCompleted ? "Informações preenchidas" : "Pendente de preenchimento"}
                                                    </p>
                                                </div>
                                            </div>

                                            <PlanSectionImage 
                                                    sectionId={section.id}
                                                    alt={section.title}
                                                    width={128}
                                                    height={128}
                                                    className="h-36 w-36 sm:h-28 sm:w-28 flex-shrink-0"
                                                />
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 bg-gray-50">
                                        <Button
                                            onClick={() => router.push(`/${resolvedParams.username}/plano/${resolvedParams.id}/${section.route}`)}
                                            className={cn(
                                                "w-full px-4 text-md font-semibold font-raleway",
                                                isCompleted
                                                    ? ""
                                                    : "bg-bw text-blank hover:bg-main/90"
                                            )}
                                        >
                                            {isCompleted ? (
                                                <>
                                                    <Pencil className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                                                    Informações
                                                </>
                                            ) : (
                                                <>
                                                    <PlusCircle className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                                                    Preencher
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {getCompletedSectionsCount() === 0 && (
                        <div className="flex flex-col items-center justify-center my-8 p-4 md:p-6 bg-white/50 border border-dashed border-gray-300 rounded-lg">
                            <Image
                                src="/assets/images/plan_01.webp"
                                alt="Plano Parental"
                                width={200}
                                height={140}
                                className="mb-4 opacity-90"
                            />
                            <h3 className="text-base md:text-lg font-medium text-gray-700 mb-2">Comece preenchendo as seções</h3>
                            <p className="text-xs md:text-sm text-gray-500 text-center mb-4 max-w-md">
                                Preencha as seções do plano parental para documentar os acordos e diretrizes sobre a educação e cuidados com a criança.
                            </p>
                            <Button
                                onClick={() => router.push(`/${resolvedParams.username}/plano/${resolvedParams.id}/educacao`)}
                                className="bg-main hover:bg-main/90 w-full sm:w-auto"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Começar com Educação Regular
                            </Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <PlanChangeLog planId={resolvedParams.id} limit={20} />
                </TabsContent>
            </Tabs>
        </div>
    );
}