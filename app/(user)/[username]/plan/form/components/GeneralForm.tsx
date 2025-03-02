'use client';
import React, { useState, useEffect } from 'react';
import { 
    collection, 
    doc, 
    setDoc, 
    query, 
    where, 
    getDocs,
    updateDoc,
    arrayUnion,
    Timestamp 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { useUser } from '@context/userContext';
import { KidInfo } from '@/types/signup.types';
import { ParentalPlan } from '@/types/shared.types';
import toast from 'react-hot-toast';

// shadcn components
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

import { EmployedSection } from './sections/EmployedSection';
import { UnemployedSection } from './sections/UnemployedSection';
import IconIdea from '@assets/icons/icon_meu_lar_idea.svg';

interface GeneralFormProps {
    planId?: string | null;
}

const GeneralForm: React.FC<GeneralFormProps> = ({ planId: urlPlanId }) => {
    const { user } = useUser();
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
    const [availableChildren, setAvailableChildren] = useState<KidInfo[]>([]);
    const [existingPlans, setExistingPlans] = useState<ParentalPlan[]>([]);
    const [referenceHome, setReferenceHome] = useState('');
    const [guardType, setGuardType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

    // Employed states
    const [employedAlimonyInMoney, setEmployedAlimonyInMoney] = useState(false);
    const [employedMoneyMethod, setEmployedMoneyMethod] = useState('');
    const [employedObligationsChecked, setEmployedObligationsChecked] = useState(false);
    const [employedPaymentChecked, setEmployedPaymentChecked] = useState(false);
    const [employedReimbursementChecked, setEmployedReimbursementChecked] = useState(false);

    // Unemployed states
    const [unemployedAlimonyInMoney, setUnemployedAlimonyInMoney] = useState(false);
    const [unemployedMoneyMethod, setUnemployedMoneyMethod] = useState('');
    const [unemployedObligationsChecked, setUnemployedObligationsChecked] = useState(false);
    const [unemployedPaymentChecked, setUnemployedPaymentChecked] = useState(false);
    const [unemployedReimbursementChecked, setUnemployedReimbursementChecked] = useState(false);

    // Fetch available children when component loads
    useEffect(() => {
        const fetchChildren = async () => {
            if (!user) return;
            
            try {
                const childrenQuery = query(
                    collection(db, 'children'),
                    where('parentId', '==', user.uid)
                );
                const snapshot = await getDocs(childrenQuery);
                const children = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as KidInfo));
                
                setAvailableChildren(children);
            } catch (error) {
                console.error('Error fetching children:', error);
                toast.error('Erro ao buscar as crianças');
            }
        };
        
        fetchChildren();
    }, [user]);

    // Fetch existing plans
    useEffect(() => {
        const fetchExistingPlans = async () => {
            if (!user) return;
            
            try {
                const plansQuery = query(
                    collection(db, 'parental_plans'),
                    where('userId', '==', user.uid)
                );
                const snapshot = await getDocs(plansQuery);
                const plans = snapshot.docs.map(doc => ({
                    ...doc.data()
                } as ParentalPlan));
                
                setExistingPlans(plans);
                
                // If there's a planId in the URL and we have plans, load that plan
                if (urlPlanId && plans.length > 0) {
                    const plan = plans.find(p => p.id === urlPlanId);
                    if (plan) {
                        loadPlan(plan);
                    }
                }
            } catch (error) {
                console.error('Error fetching parental plans:', error);
                toast.error('Erro ao buscar planos de parentalidade');
            }
        };
        
        fetchExistingPlans();
    }, [user, urlPlanId]);

    const loadPlan = (plan: ParentalPlan) => {
        setCurrentPlanId(plan.id);
        setIsEditing(true);
        setTitle(plan.title);
        setDescription(plan.description || '');
        setSelectedChildren(plan.children || []);
        setReferenceHome(plan.referenceHome);
        setGuardType(plan.guardType);
        
        // Set employed alimony data
        setEmployedAlimonyInMoney(plan.employedAlimony.inMoney);
        setEmployedMoneyMethod(plan.employedAlimony.moneyMethod || '');
        setEmployedObligationsChecked(plan.employedAlimony.obligations);
        setEmployedPaymentChecked(plan.employedAlimony.paymentServices);
        setEmployedReimbursementChecked(plan.employedAlimony.reimbursement);
        
        // Set unemployed alimony data
        setUnemployedAlimonyInMoney(plan.unemployedAlimony.inMoney);
        setUnemployedMoneyMethod(plan.unemployedAlimony.moneyMethod || '');
        setUnemployedObligationsChecked(plan.unemployedAlimony.obligations);
        setUnemployedPaymentChecked(plan.unemployedAlimony.paymentServices);
        setUnemployedReimbursementChecked(plan.unemployedAlimony.reimbursement);
    };

    const handlePlanSelection = (value: string) => {
        if (value === "new") {
            resetForm();
            return;
        }
        
        const plan = existingPlans.find(p => p.id === value);
        if (plan) {
            loadPlan(plan);
        }
    };

    const handleChildSelection = (childId: string) => {
        setSelectedChildren(prev => {
            if (prev.includes(childId)) {
                return prev.filter(id => id !== childId);
            } else {
                return [...prev, childId];
            }
        });
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSelectedChildren([]);
        setReferenceHome('');
        setGuardType('');
        setEmployedAlimonyInMoney(false);
        setEmployedMoneyMethod('');
        setEmployedObligationsChecked(false);
        setEmployedPaymentChecked(false);
        setEmployedReimbursementChecked(false);
        setUnemployedAlimonyInMoney(false);
        setUnemployedMoneyMethod('');
        setUnemployedObligationsChecked(false);
        setUnemployedPaymentChecked(false);
        setUnemployedReimbursementChecked(false);
        setIsEditing(false);
        setCurrentPlanId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            toast.error('Você precisa estar autenticado para criar um plano de parentalidade');
            return;
        }
        
        if (!title) {
            toast.error('Por favor, forneça um título para o plano');
            return;
        }
        
        if (selectedChildren.length === 0) {
            toast.error('Por favor, selecione pelo menos um filho para o plano');
            return;
        }
        
        if (!referenceHome) {
            toast.error('Por favor, selecione o lar de referência');
            return;
        }
        
        if (!guardType) {
            toast.error('Por favor, selecione o tipo de guarda');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            let planRef;
            const now = Timestamp.now();
            
            const planData: Partial<ParentalPlan> = {
                userId: user.uid,
                title,
                description,
                children: selectedChildren,
                referenceHome: referenceHome as 'Mãe' | 'Pai' | 'Outro' | 'Alternado',
                guardType: guardType as 'Unilateral' | 'Compartilhada',
                employedAlimony: {
                    inMoney: employedAlimonyInMoney,
                    moneyMethod: employedMoneyMethod as 'Deposito' | 'Desconto' | undefined,
                    obligations: employedObligationsChecked,
                    paymentServices: employedPaymentChecked,
                    reimbursement: employedReimbursementChecked
                },
                unemployedAlimony: {
                    inMoney: unemployedAlimonyInMoney,
                    moneyMethod: unemployedMoneyMethod as 'Deposito' | 'Desconto' | undefined,
                    obligations: unemployedObligationsChecked,
                    paymentServices: unemployedPaymentChecked,
                    reimbursement: unemployedReimbursementChecked
                },
                updatedAt: now
            };
            
            // Update existing plan or create a new one
            if (isEditing && currentPlanId) {
                planRef = doc(db, 'parental_plans', currentPlanId);
                await updateDoc(planRef, planData);
                toast.success('Plano de parentalidade atualizado com sucesso!');
            } else {
                planRef = doc(collection(db, 'parental_plans'));
                await setDoc(planRef, {
                    ...planData,
                    id: planRef.id,
                    status: 'draft',
                    createdAt: now
                } as ParentalPlan);
                
                // Add the plan ID to the user's data if it doesn't exist
                const userRef = doc(db, 'account_info', user.uid);
                await updateDoc(userRef, {
                    parentalPlans: arrayUnion(planRef.id)
                });
                
                toast.success('Plano de parentalidade criado com sucesso!');
            }
            
            // Update child records to include the plan
            for (const childId of selectedChildren) {
                const childRef = doc(db, 'children', childId);
                await updateDoc(childRef, {
                    parentalPlans: arrayUnion(planRef.id)
                });
            }
            
            // Reset form after successful submission
            resetForm();
        } catch (error) {
            console.error('Error saving parental plan:', error);
            toast.error('Erro ao salvar o plano de parentalidade');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Existing Plans Selector */}
            {existingPlans.length > 0 && (
                <div className="space-y-2">
                    <Label className="font-semibold">Selecionar Plano Existente</Label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={currentPlanId || "new"} onValueChange={handlePlanSelection}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Criar Novo Plano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">Criar Novo Plano</SelectItem>
                                {existingPlans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {isEditing && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full sm:w-auto" 
                                onClick={resetForm}
                            >
                                Novo Plano
                            </Button>
                        )}
                    </div>
                </div>
            )}
            
            {/* Plan Title and Description */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Informações Básicas do Plano</h2>
                <div className="space-y-2">
                    <Label htmlFor="title">Título do Plano</Label>
                    <Input 
                        id="title"
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Plano de Parentalidade - João e Maria"
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea 
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o propósito deste plano..."
                        className="h-20"
                    />
                </div>
            </div>

            {/* Children Selection */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Crianças Incluídas no Plano</h2>
                {availableChildren.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableChildren.map(child => (
                            <label 
                                key={child.id} 
                                className="flex items-center p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                            >
                                <Checkbox
                                    id={`child-${child.id}`}
                                    checked={selectedChildren.includes(child.id)}
                                    onCheckedChange={() => handleChildSelection(child.id)}
                                    className="mr-3"
                                />
                                <span className="text-sm md:text-base">
                                    {child.firstName} {child.lastName}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <Alert variant="warning">
                        <AlertDescription>
                            Nenhuma criança encontrada. Cadastre crianças primeiro.
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <Card className="bg-muted/50 border-none">
                <CardContent className="p-4">
                    <p className="text-xs md:text-sm text-muted-foreground italic">
                        O plano de parentalidade deve incluir: base de residência do menor; tipo de guarda; regime de convivência; 
                        pagamento de alimentos; prazos para revisão do plano; situações de revisão antecipada; profissionais que acompanham;
                        forma de comunicação entre os genitores; idade dos filhos; atividades laborais dos pais; distância das residências;
                        possibilidades financeiras; atividades dos filhos; acompanhamento psicológico; necessidades especiais.
                    </p>
                </CardContent>
            </Card>
            
            {/* Lar Referência */}
            <div className="space-y-4">
                <div className="flex flex-row items-center gap-2">
                    <h2 className="text-lg font-semibold">Lar Referência</h2>
                    <div className="relative group">
                        <IconIdea className="h-5 w-5 text-primary cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-popover rounded shadow-lg text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                            O lar de referência é onde a criança tem seu endereço oficial e permanente.
                        </div>
                    </div>
                </div>
                <RadioGroup 
                    value={referenceHome} 
                    onValueChange={setReferenceHome}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2"
                >
                    <Label 
                        htmlFor="ref-mae" 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    >
                        <RadioGroupItem value="Mãe" id="ref-mae" />
                        <span>Mãe</span>
                    </Label>
                    <Label 
                        htmlFor="ref-pai" 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    >
                        <RadioGroupItem value="Pai" id="ref-pai" />
                        <span>Pai</span>
                    </Label>
                    <Label 
                        htmlFor="ref-outro" 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    >
                        <RadioGroupItem value="Outro" id="ref-outro" />
                        <span>Outro</span>
                    </Label>
                    <Label 
                        htmlFor="ref-alternado" 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    >
                        <RadioGroupItem value="Alternado" id="ref-alternado" />
                        <span>Alternado</span>
                        <div className="relative group ml-1">
                            <IconIdea className="h-4 w-4 text-primary cursor-help" />
                            <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-popover rounded shadow-lg text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                                Alternado significa que a criança possui dois lares de referência, alternando entre eles.
                            </div>
                        </div>
                    </Label>
                </RadioGroup>
            </div>

            {/* Tipo de Guarda */}
            <div className="space-y-4">
                <div className="flex flex-row items-center gap-2 mt-6">
                    <h2 className="text-lg font-semibold">Tipo de Guarda</h2>
                    <div className="relative group">
                        <IconIdea className="h-5 w-5 text-primary cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-popover rounded shadow-lg text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50">
                            Define como será compartilhada a responsabilidade legal pelos filhos.
                        </div>
                    </div>
                </div>
                <RadioGroup 
                    value={guardType} 
                    onValueChange={setGuardType}
                    className="grid grid-cols-2 gap-2 mt-2"
                >
                    <Label 
                        htmlFor="guard-uni" 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    >
                        <RadioGroupItem value="Unilateral" id="guard-uni" />
                        <span>Unilateral</span>
                    </Label>
                    <Label 
                        htmlFor="guard-comp" 
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                    >
                        <RadioGroupItem value="Compartilhada" id="guard-comp" />
                        <span>Compartilhada</span>
                    </Label>
                </RadioGroup>
            </div>

            {/* Pensão Alimentícia */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">Pensão Alimentícia</h2>
                <div className="flex flex-col md:flex-row items-stretch gap-6">
                    <EmployedSection 
                        alimonyInMoney={employedAlimonyInMoney}
                        setAlimonyInMoney={setEmployedAlimonyInMoney}
                        moneyMethod={employedMoneyMethod}
                        setMoneyMethod={setEmployedMoneyMethod}
                        obligationsChecked={employedObligationsChecked}
                        setObligationsChecked={setEmployedObligationsChecked}
                        paymentChecked={employedPaymentChecked}
                        setPaymentChecked={setEmployedPaymentChecked}
                        reimbursementChecked={employedReimbursementChecked}
                        setReimbursementChecked={setEmployedReimbursementChecked}
                    />
                    
                    <div className="hidden md:block">
                        <Separator orientation="vertical" className="h-full" />
                    </div>
                    <Separator className="md:hidden" />
                    
                    <UnemployedSection 
                        alimonyInMoney={unemployedAlimonyInMoney}
                        setAlimonyInMoney={setUnemployedAlimonyInMoney}
                        moneyMethod={unemployedMoneyMethod}
                        setMoneyMethod={setUnemployedMoneyMethod}
                        obligationsChecked={unemployedObligationsChecked}
                        setObligationsChecked={setUnemployedObligationsChecked}
                        paymentChecked={unemployedPaymentChecked}
                        setPaymentChecked={setUnemployedPaymentChecked}
                        reimbursementChecked={unemployedReimbursementChecked}
                        setReimbursementChecked={setUnemployedReimbursementChecked}
                    />
                </div>
            </div>
            
            <div className="pt-4">
                <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    size="lg"
                    disabled={isSubmitting || !user || availableChildren.length === 0}
                >
                    {isSubmitting ? (
                        <>
                            <Spinner size="sm" className="mr-2" />
                            Salvando...
                        </>
                    ) : isEditing ? (
                        'Atualizar Plano'
                    ) : (
                        'Criar Plano'
                    )}
                </Button>
            </div>
            
            {!user && (
                <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                        Você precisa estar autenticado para criar um plano de parentalidade.
                    </AlertDescription>
                </Alert>
            )}
            
            {availableChildren.length === 0 && user && (
                <Alert variant="warning" className="mt-4">
                    <AlertDescription>
                        Você precisa cadastrar pelo menos um filho para criar um plano de parentalidade.
                    </AlertDescription>
                </Alert>
            )}
        </form>
    );
};

export default GeneralForm;