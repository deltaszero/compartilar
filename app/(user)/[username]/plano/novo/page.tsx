'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createParentalPlan } from '../services/plan-service';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";


interface ChildOption {
    id: string;
    name: string;
}

export default function NewParentalPlanPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [planTitle, setPlanTitle] = useState('');
    const [selectedChildId, setSelectedChildId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [childrenOptions, setChildrenOptions] = useState<ChildOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // In a real implementation, fetch the user's children that they can edit
        // This is a mock example, which would be replaced with actual API call
        const fetchUserChildren = async () => {
            if (!user) return;

            try {
                // Mock data - in real app, fetch this from API
                // Let's use a real sample child ID for testing
                const mockChildren = [
                    { id: 'child1', name: 'Ana Clara' },
                    { id: 'child2', name: 'João Pedro' },
                    { id: 'child3', name: 'Maria Eduarda' },
                ];

                setChildrenOptions(mockChildren);
            } catch (error) {
                console.error('Error fetching children:', error);
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar a lista de crianças.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserChildren();
    }, [user, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({
                title: "Erro",
                description: "Você precisa estar logado para criar um plano.",
                variant: "destructive",
            });
            return;
        }

        if (!planTitle.trim()) {
            toast({
                title: "Erro",
                description: "O título do plano é obrigatório.",
                variant: "destructive",
            });
            return;
        }

        if (!selectedChildId) {
            toast({
                title: "Erro",
                description: "Selecione uma criança para o plano.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const planId = await createParentalPlan(user.uid, selectedChildId, planTitle);

            toast({
                title: "Sucesso",
                description: "Plano parental criado com sucesso!",
            });

            // Redirect to the new plan's education section
            router.push(`/${resolvedParams.username}/plano/${planId}/educacao`);
        } catch (error) {
            console.error('Error creating plan:', error);
            toast({
                title: "Erro",
                description: "Não foi possível criar o plano parental.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="h-32 w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <UserProfileBar pathname='Plano de Parentalidade' />
            <div className="p-8 max-w-4xl mx-auto">
                <Button
                    variant={null}
                    className="mb-4"
                    onClick={() => router.push(`/${resolvedParams.username}/plano`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <Card className="bg-bw rounded-none">
                    <CardHeader>
                        <CardTitle>
                            <div className='font-raleway'>
                                Novo Plano Parental
                            </div>
                        </CardTitle>
                        <CardDescription>
                            <div className='font-nunito'>
                                Crie um novo plano parental para uma criança
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} id="new-plan-form">
                            <div className="space-y-6">
                                <div className="mb-4">
                                    <Label htmlFor="plan-title" className="block mb-2">Título do Plano</Label>
                                    <Input
                                        id="plan-title"
                                        type="text"
                                        placeholder="Ex: Plano Parental - Ana Clara"
                                        value={planTitle}
                                        onChange={(e) => setPlanTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <Label htmlFor="child-select" className="block mb-2">
                                        Criança
                                    </Label>
                                    <Select
                                        value={selectedChildId}
                                        onValueChange={setSelectedChildId}
                                    >
                                        <SelectTrigger className="bg-bw">
                                            <SelectValue placeholder="Selecione uma criança" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-bw">
                                            {childrenOptions.map((child) => (
                                                <SelectItem key={child.id} value={child.id}>
                                                    {child.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button
                            type="submit"
                            form="new-plan-form"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Criando...' : 'Criar Plano'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}