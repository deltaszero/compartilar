// /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/plan/form/page.tsx
// https://docs.google.com/document/d/1B0S61UmF6-GrUWRGw2MwkR_fa-GwX63V/edit
'use client';
import React, { useState, useEffect } from 'react';
import { 
    collection, 
    doc, 
    setDoc, 
    query, 
    where, 
    getDocs,
    // getDoc,
    updateDoc,
    arrayUnion,
    Timestamp 
} from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { useUser } from '@context/userContext';
import { useSearchParams } from 'next/navigation';
import { KidInfo } from '@/types/signup.types';
import { ParentalPlan } from '@/types/shared.types';
import toast from 'react-hot-toast';
import IconIdea from '@assets/icons/icon_meu_lar_idea.svg';

// General Form Component
const GeneralForm: React.FC = () => {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const planId = searchParams.get('planId');
    
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
                if (planId && plans.length > 0) {
                    const plan = plans.find(p => p.id === planId);
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
    }, [user, planId]);

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

    const handlePlanSelection = (planId: string) => {
        const plan = existingPlans.find(p => p.id === planId);
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

    const EmployedSection = () => (
        <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium mb-2">
                Quando Empregada ou Autônoma
            </label>
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-12">
                <div className="flex flex-col items-start gap-2 w-full md:w-auto">
                    <label className="flex flex-row items-center">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={employedAlimonyInMoney}
                            onChange={() => setEmployedAlimonyInMoney(!employedAlimonyInMoney)}
                        />
                        <span className="ml-2">Dinheiro</span>
                    </label>
                    {employedAlimonyInMoney && (
                        <div className="flex flex-col my-2 md:my-4 gap-2 pl-6">
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="radio"
                                    value="Deposito"
                                    className="radio radio-primary radio-sm"
                                    checked={employedMoneyMethod === 'Deposito'}
                                    onChange={() => setEmployedMoneyMethod('Deposito')}
                                />
                                <span className="ml-2">Depósito em conta corrente</span>
                            </label>
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="radio"
                                    value="Desconto"
                                    className="radio radio-primary radio-sm"
                                    checked={employedMoneyMethod === 'Desconto'}
                                    onChange={() => setEmployedMoneyMethod('Desconto')}
                                />
                                <span className="ml-2">Desconto em Folha</span>
                            </label>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-start gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <label className="flex flex-row items-center">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={employedObligationsChecked}
                            onChange={() => setEmployedObligationsChecked(!employedObligationsChecked)}
                        />
                        <span className="ml-2">Obrigações</span>
                    </label>
                    {employedObligationsChecked && (
                        <div className="flex flex-col my-2 md:my-4 gap-2 pl-6">
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={employedPaymentChecked}
                                    onChange={() => setEmployedPaymentChecked(!employedPaymentChecked)}
                                />
                                <span className="ml-2">Pagamento de serviços e objetos</span>
                            </label>
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={employedReimbursementChecked}
                                    onChange={() => setEmployedReimbursementChecked(!employedReimbursementChecked)}
                                />
                                <span className="ml-2">Reembolso</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const UnemployedSection = () => (
        <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium mb-2">
                Quando Desempregada
            </label>
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-12">
                <div className="flex flex-col items-start gap-2 w-full md:w-auto">
                    <label className="flex flex-row items-center">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={unemployedAlimonyInMoney}
                            onChange={() => setUnemployedAlimonyInMoney(!unemployedAlimonyInMoney)}
                        />
                        <span className="ml-2">Dinheiro</span>
                    </label>
                    {unemployedAlimonyInMoney && (
                        <div className="flex flex-col my-2 md:my-4 gap-2 pl-6">
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="radio"
                                    value="Deposito"
                                    className="radio radio-primary radio-sm"
                                    checked={unemployedMoneyMethod === 'Deposito'}
                                    onChange={() => setUnemployedMoneyMethod('Deposito')}
                                />
                                <span className="ml-2">Depósito em conta corrente</span>
                            </label>
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="radio"
                                    value="Desconto"
                                    className="radio radio-primary radio-sm"
                                    checked={unemployedMoneyMethod === 'Desconto'}
                                    onChange={() => setUnemployedMoneyMethod('Desconto')}
                                />
                                <span className="ml-2">Desconto em Folha</span>
                            </label>
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-start gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <label className="flex flex-row items-center">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={unemployedObligationsChecked}
                            onChange={() => setUnemployedObligationsChecked(!unemployedObligationsChecked)}
                        />
                        <span className="ml-2">Obrigações</span>
                    </label>
                    {unemployedObligationsChecked && (
                        <div className="flex flex-col my-2 md:my-4 gap-2 pl-6">
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={unemployedPaymentChecked}
                                    onChange={() => setUnemployedPaymentChecked(!unemployedPaymentChecked)}
                                />
                                <span className="ml-2">Pagamento de serviços e objetos</span>
                            </label>
                            <label className="flex items-center flex-wrap">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary checkbox-sm"
                                    checked={unemployedReimbursementChecked}
                                    onChange={() => setUnemployedReimbursementChecked(!unemployedReimbursementChecked)}
                                />
                                <span className="ml-2">Reembolso</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Existing Plans Selector */}
            {existingPlans.length > 0 && (
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-semibold">Selecionar Plano Existente</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <select 
                            className="select select-bordered flex-1"
                            onChange={(e) => e.target.value ? handlePlanSelection(e.target.value) : resetForm()}
                            value={currentPlanId || ''}
                        >
                            <option value="">Criar Novo Plano</option>
                            {existingPlans.map(plan => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.title}
                                </option>
                            ))}
                        </select>
                        
                        {isEditing && (
                            <button 
                                type="button" 
                                className="btn btn-outline w-full sm:w-auto" 
                                onClick={resetForm}
                            >
                                Novo Plano
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            {/* Plan Title and Description */}
            <div>
                <h2 className="text-lg font-semibold mb-2">Informações Básicas do Plano</h2>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Título do Plano</span>
                    </label>
                    <input 
                        type="text" 
                        className="input input-bordered w-full" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Plano de Parentalidade - João e Maria"
                        required
                    />
                </div>
                <div className="form-control mt-2">
                    <label className="label">
                        <span className="label-text">Descrição (opcional)</span>
                    </label>
                    <textarea 
                        className="textarea textarea-bordered h-20"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o propósito deste plano..."
                    ></textarea>
                </div>
            </div>

            {/* Children Selection */}
            <div>
                <h2 className="text-lg font-semibold mb-2">Crianças Incluídas no Plano</h2>
                {availableChildren.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableChildren.map(child => (
                            <label key={child.id} className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary mr-3"
                                    checked={selectedChildren.includes(child.id)}
                                    onChange={() => handleChildSelection(child.id)}
                                />
                                <span className="text-sm md:text-base">{child.firstName} {child.lastName}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <div className="alert alert-warning">
                        <span>Nenhuma criança encontrada. Cadastre crianças primeiro.</span>
                    </div>
                )}
            </div>

            <div className="p-4 bg-base-200 rounded-lg">
                <p className="text-xs md:text-sm opacity-70 italic">
                    O plano de parentalidade deve incluir: base de residência do menor; tipo de guarda; regime de convivência; 
                    pagamento de alimentos; prazos para revisão do plano; situações de revisão antecipada; profissionais que acompanham;
                    forma de comunicação entre os genitores; idade dos filhos; atividades laborais dos pais; distância das residências;
                    possibilidades financeiras; atividades dos filhos; acompanhamento psicológico; necessidades especiais.
                </p>
            </div>
            
            {/* Lar Referência */}
            <div className="flex flex-row items-center gap-2">
                <h2 className="text-lg font-semibold">Lar Referência</h2>
                <div className="tooltip tooltip-right md:tooltip-right" data-tip="O que é lar referência?">
                    <span className="text-primary"><IconIdea width={20} height={20} /></span>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                <label className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                    <input type="radio" value="Mãe" className="radio radio-primary" checked={referenceHome === 'Mãe'} onChange={() => setReferenceHome('Mãe')} />
                    <span className="ml-2">Mãe</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                    <input type="radio" value="Pai" className="radio radio-primary" checked={referenceHome === 'Pai'} onChange={() => setReferenceHome('Pai')} />
                    <span className="ml-2">Pai</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                    <input type="radio" value="Outro" className="radio radio-primary" checked={referenceHome === 'Outro'} onChange={() => setReferenceHome('Outro')} />
                    <span className="ml-2">Outro</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                    <input type="radio" value="Alternado" className="radio radio-primary" checked={referenceHome === 'Alternado'} onChange={() => setReferenceHome('Alternado')} />
                    <span className="ml-2">Alternado</span>
                    <div className="tooltip tooltip-top md:tooltip-right ml-1" data-tip="O que é lar referência alternado?">
                        <span className="text-primary"><IconIdea width={18} height={18} /></span>
                    </div>
                </label>
            </div>
            {/* Tipo de Guarda */}
            <div className="flex flex-row items-center gap-2 mt-6">
                <h2 className="text-lg font-semibold">Tipo de Guarda</h2>
                <div className="tooltip tooltip-right md:tooltip-right" data-tip="O que é tipo de guarda?">
                    <span className="text-primary"><IconIdea width={20} height={20} /></span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                    <input type="radio" value="Unilateral" className="radio radio-primary" checked={guardType === 'Unilateral'} onChange={() => setGuardType('Unilateral')} />
                    <span className="ml-2">Unilateral</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg hover:bg-base-200 cursor-pointer">
                    <input type="radio" value="Compartilhada" className="radio radio-primary" checked={guardType === 'Compartilhada'} onChange={() => setGuardType('Compartilhada')} />
                    <span className="ml-2">Compartilhada</span>
                </label>
            </div>
            {/* Pensão Alimentícia */}
            <article className="w-full flex flex-col gap-4">
                <div className="flex items-center">
                    <h2 className="text-lg font-semibold">Pensão Alimentícia</h2>
                </div>
                <div className="flex flex-col md:flex-row items-stretch gap-6">
                    <EmployedSection />
                    <div className="hidden md:flex divider divider-horizontal"></div>
                    <div className="block md:hidden divider divider-vertical my-2"></div>
                    <UnemployedSection />
                </div>
            </article>
            <br />
            <button 
                type="submit" 
                className={`btn btn-lg w-full sm:w-auto ${isSubmitting ? 'btn-disabled' : 'btn-primary'}`}
                disabled={isSubmitting || !user || availableChildren.length === 0}
            >
                {isSubmitting ? (
                    <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Salvando...
                    </>
                ) : isEditing ? (
                    'Atualizar Plano'
                ) : (
                    'Criar Plano'
                )}
            </button>
            
            {!user && (
                <div className="alert alert-error mt-4">
                    <span>Você precisa estar autenticado para criar um plano de parentalidade.</span>
                </div>
            )}
            
            {availableChildren.length === 0 && user && (
                <div className="alert alert-warning mt-4">
                    <span>Você precisa cadastrar pelo menos um filho para criar um plano de parentalidade.</span>
                </div>
            )}
        </form>
    );
};

// Education Form Component
const EducationForm: React.FC = () => {
    return (
        <form className="space-y-4">
            <p>
                Como chegarão a um consenso sobre qual escola o petiz vai estudar em caso de desentendimento? Quais parâmetros poderão compor a deliberação: preço, localização, amigos da criança, amigos dos pais, método de estudo?
                Quem será responsável por levar e buscar o infante na escola em cada dia e horários? 
                Quem será o responsável financeiro? 
                Quem deverá arcar com material escolar, fardamento, apostilado e excursões?
                Quem a escola comunicará em caso de emergência? 
                Em caso de necessidade de transporte escolar, de quem é o custo?
                Se necessário professor particular, quem decide? Quem arca com esses valores? 
                Quem será responsável por levar e buscar nas atividades suplementares à escola? 
                Família extensa – avós, tios, madrastas e padrastos – são autorizados a fazer o transporte do menor e/ou assinar qualquer tipo de autorização do menor na escola? 
                Em festas escolares, ambos os progenitores participarão? Ou revezarão? 
            </p>
            <h2 className="text-lg font-semibold">Educação</h2>
            <div className="space-y-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Escola Atual</span>
                    </label>
                    <input type="text" className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Atividades Extracurriculares</span>
                    </label>
                    <textarea className="textarea textarea-bordered h-24"></textarea>
                </div>
                {/* Add more education-related fields */}
            </div>
        </form>
    );
};

// Health Form Component
const HealthForm: React.FC = () => {
    return (
        <form className="space-y-4">
            <p>
                O menor terá plano de saúde? Qual? Quem paga? 
                Quem deve levar nas consultas regulares? 
                Como será avisado ao outro genitor o que o médico disse? 
                Como o outro genitor terá acesso aos exames, boletins médicos etc?
                Em caso de emergência deve o outro genitor comparecer? 
                Em caso de despesas extras (com médicos ou medicamentos) quem deverá pagar? 
                Em caso de plano odontológico, quem paga? E gastos extras? 
                Em caso de não ter cobertura odontológica, quem suporta tais tratamentos? 
                Quando os pais optarem por tratamentos não inclusos no plano de saúde (sejam médicos, odontológicos ou de saúde mental) quem faz essa opção? Quem arcará com as despesas? 
                Tratamento de saúde mental, quem escolhe o profissional? 
                A quem o profissional de saúde mental deve se reportar? 
                Intervenções como piercing e tatuagens serão permitidas?
                Tratamentos alternativos: quais são permitidos? 
            </p>
            <h2 className="text-lg font-semibold">Saúde</h2>
            <div className="space-y-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Plano de Saúde</span>
                    </label>
                    <input type="text" className="input input-bordered w-full" />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Condições Médicas Especiais</span>
                    </label>
                    <textarea className="textarea textarea-bordered h-24"></textarea>
                </div>
                {/* Add more health-related fields */}
            </div>
        </form>
    );
};

// Main Component
const PlanoDeParentalidade: React.FC = () => {
    const [activeSection, setActiveSection] = useState('general');

    const IconHeader = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" id="Collaboration-Meeting-Team-File--Streamline-Freehand" height={48} width={48} fill="currentColor" ><desc>{"Collaboration Meeting Team File Streamline Icon: https://streamlinehq.com"}</desc><path fillRule="evenodd" d="M12.090613333333332 13.683466666666668c0.5731466666666667 0.22666666666666668 1.1823866666666665 0.34853333333333336 1.7985866666666666 0.3597333333333333 0.5146666666666666 0.033466666666666665 1.0309333333333333 0.033466666666666665 1.5455999999999999 0 1.0658666666666665 -0.07999999999999999 1.8518666666666665 -0.31986666666666663 3.304133333333333 -0.38639999999999997 0.29306666666666664 0 1.1457333333333333 0.0932 1.6919999999999997 0 0.2884 -0.02266666666666667 0.5670666666666666 -0.11413333333333332 0.8128 -0.2665333333333333 0.4685333333333333 -0.3472533333333333 0.8102666666666667 -0.8387066666666666 0.9725333333333334 -1.398893333333333 0.24093333333333333 -1.0114933333333331 0.3174666666666667 -2.0551866666666667 0.2265333333333333 -3.0909999999999997 0 -0.7594266666666667 0.10653333333333333 -2.185013333333333 0 -3.344146666666666 -0.028399999999999998 -0.5824666666666667 -0.17333333333333334 -1.15332 -0.42639999999999995 -1.6787199999999998 -0.33946666666666664 -0.5803333333333334 -0.7367999999999999 -1.1249066666666665 -1.1857333333333333 -1.6254399999999998 -0.6315999999999999 -0.7213066666666667 -1.3079999999999998 -1.4021386666666666 -2.0250666666666666 -2.038465333333333 -0.1608 -0.14372493333333333 -0.3708 -0.22005878666666667 -0.5862666666666666 -0.21317288266666667 -0.4397333333333333 0 -1.4922666666666666 0.19984888266666667 -1.6654666666666667 0.21317288266666667L12.67684 0.733208c-0.09633333333333333 0.01214 -0.18733333333333335 0.05102933333333333 -0.26269333333333333 0.112256 -0.07536 0.061226666666666665 -0.13205333333333333 0.14234266666666667 -0.16365333333333332 0.23414933333333332 -0.03288 -0.09008933333333333 -0.09273333333333333 -0.16785066666666665 -0.17141333333333333 -0.22268666666666664C12.000399999999999 0.8020906666666666 11.90672 0.7728453333333333 11.810826666666665 0.7731786666666666c-0.05949333333333333 0.001724 -0.11806666666666667 0.015156 -0.17237333333333332 0.039527999999999994 -0.05430666666666667 0.024373333333333334 -0.10326666666666667 0.059208 -0.14409333333333332 0.10251466666666666 -0.04084 0.04330666666666667 -0.07273333333333333 0.094236 -0.09387999999999999 0.149876 -0.02113333333333333 0.05564 -0.031093333333333334 0.11490133333333333 -0.02932 0.174396l-0.13324 7.9140266666666665c0 0.5862133333333333 -0.18651999999999996 1.5588133333333334 -0.19984000000000002 2.3848666666666665 -0.022266666666666664 0.42804 0.03188 0.8566400000000001 0.15988 1.2657066666666665 0.08055999999999999 0.19993333333333332 0.20137333333333332 0.38117333333333336 0.3549333333333333 0.53244 0.15355999999999997 0.15133333333333332 0.3366 0.2693333333333333 0.53772 0.3469333333333333Zm7.674186666666666 -10.525426666666666c0.3678666666666666 0.44096 0.6893333333333334 0.9186933333333333 0.9593333333333334 1.4255999999999998 0.09933333333333333 0.24178666666666665 0.15786666666666666 0.49842666666666663 0.17319999999999997 0.7594266666666667l-0.07999999999999999 -0.013333333333333332c-0.7529333333333332 -0.1457733333333333 -1.5135999999999998 -0.24808 -2.2782666666666667 -0.3064266666666666 -0.28026666666666666 -0.040119999999999996 -0.5510666666666666 -0.13037333333333334 -0.7993333333333333 -0.26646666666666663 0 -0.22649333333333332 0.10653333333333333 -0.5862266666666667 0.10653333333333333 -0.8393733333333333v-1.2657066666666665l-0.07999999999999999 -1.1458c0.18653333333333333 0 0.34639999999999993 0 0.4130666666666667 -0.13324 0.5606666666666666 0.5658 1.0898666666666665 1.1618 1.5854666666666666 1.7853199999999998Zm-6.968053333333334 -1.33232 3.823786666666667 -0.3464133333333333 -0.19986666666666666 1.13248c0 0.10658666666666666 -0.14653333333333332 0.5595866666666667 -0.23986666666666667 1.0791866666666667 -0.05053333333333333 0.39327999999999996 -0.07719999999999999 0.7892666666666666 -0.07986666666666667 1.1857733333333331 -0.016 0.23346666666666666 0.021333333333333333 0.4674933333333333 0.10906666666666666 0.6844399999999999 0.08773333333333333 0.21694666666666665 0.22346666666666665 0.41114666666666666 0.3972 0.5679466666666666 0.4301333333333333 0.23934666666666665 0.9078666666666666 0.38039999999999996 1.3989333333333331 0.41302666666666665 0.8793333333333333 0 1.7986666666666666 -0.21317333333333333 2.6646666666666663 -0.15988 0.0824 0.025626666666666666 0.17066666666666666 0.025626666666666666 0.2532 0 0 1.01256 -0.14666666666666667 2.0784266666666666 -0.14666666666666667 2.6646533333333333 0.051199999999999996 0.6251466666666666 0.051199999999999996 1.2534266666666665 0 1.8785733333333332 -0.26639999999999997 2.09176 -1.2124 1.0525466666666665 -2.0650666666666666 1.09252 -1.4789333333333332 0.09325333333333333 -2.2782666666666667 0.33308 -3.3707999999999996 0.43966666666666665 -0.4436 0.029133333333333334 -0.8886666666666666 0.029133333333333334 -1.3322666666666665 0 -0.3437333333333333 0.007013333333333333 -0.6874133333333333 -0.01976 -1.0259333333333331 -0.07994666666666667 -0.11990666666666666 0 -0.2531333333333333 -0.18651999999999996 -0.31976 -0.11990666666666666 -0.08657333333333334 -0.32110666666666665 -0.12253333333333333 -0.6537333333333333 -0.10657333333333333 -0.9859199999999999 0 -0.7594266666666667 0.09325333333333333 -1.5721466666666668 0.06661333333333333 -2.0784399999999996l-0.33308 -7.7008399999999995c0.04768 0.09028 0.12153333333333333 0.16404 0.21189333333333332 0.2116 0.09034666666666666 0.04754666666666666 0.19297333333333333 0.06667999999999999 0.29438666666666663 0.05486666666666666v0.06661333333333333Z" clipRule="evenodd" strokeWidth={1.3333} /><path fillRule="evenodd" d="M29.07773333333333 25.514533333333333c-0.18146666666666667 -0.19266666666666665 -0.39293333333333336 -0.3546666666666667 -0.6261333333333333 -0.4796 -0.18546666666666667 -0.07813333333333333 -0.37706666666666666 -0.14053333333333332 -0.5729333333333333 -0.18653333333333333 0.46706666666666663 -0.4298666666666667 0.7997333333333333 -0.9855999999999999 0.9581333333333333 -1.6001333333333332 0.15839999999999999 -0.6146666666666667 0.13573333333333332 -1.262 -0.06546666666666666 -1.8639999999999999 -0.23213333333333333 -0.7454666666666667 -0.6825333333333333 -1.4041333333333332 -1.2928 -1.8910666666666665 -0.6103999999999999 -0.48693333333333333 -1.3527999999999998 -0.7796 -2.1311999999999998 -0.8401333333333333 -0.7089333333333332 -0.05173333333333333 -1.4117333333333333 0.16186666666666666 -1.9718666666666667 0.5994666666666666 -0.7245333333333333 0.6078666666666667 -1.1989333333333332 1.462 -1.3323999999999998 2.3982666666666663 -0.12306666666666666 0.5278666666666666 -0.09586666666666667 1.0796 0.0784 1.5929333333333333 0.1741333333333333 0.5133333333333333 0.4885333333333333 0.9676 0.9076 1.3114666666666666 -0.3457333333333333 0.08159999999999999 -0.6809333333333334 0.20226666666666665 -0.9993333333333334 0.3597333333333333 -0.21746666666666664 0.12533333333333332 -0.4150666666666667 0.2825333333333333 -0.5861333333333333 0.4664 -0.17026666666666668 0.19106666666666666 -0.3177333333333333 0.4012 -0.4397333333333333 0.6261333333333333 -0.2713333333333333 0.5129333333333332 -0.4389333333333333 1.0742666666666665 -0.4929333333333333 1.6521333333333335 -0.23893333333333333 -0.294 -0.5169333333333332 -0.5538666666666666 -0.8260000000000001 -0.7727999999999999 -0.32226666666666665 -0.19773333333333332 -0.6610666666666667 -0.36719999999999997 -1.0126666666666666 -0.5062666666666666 0.4361333333333333 -0.4935999999999999 0.7326666666666666 -1.0945333333333331 0.8590666666666666 -1.7409333333333334 0.12653333333333333 -0.6464 0.07826666666666666 -1.3148 -0.1396 -1.9362666666666666 -0.3442666666666666 -1.0005333333333333 -1.0618666666666665 -1.8294666666666668 -2.0027999999999997 -2.3136 -0.9408 -0.484 -2.0324 -0.586 -3.046666666666667 -0.2845333333333333 -0.6453333333333333 0.20146666666666668 -1.22904 0.5633333333333332 -1.6965199999999998 1.0515999999999999 -0.4674666666666667 0.4884 -0.8034399999999999 1.0873333333333333 -0.9764666666666666 1.7409333333333334 -0.17302666666666666 0.6534666666666666 -0.17746666666666666 1.3402666666666667 -0.012906666666666665 1.9958666666666665 0.16455999999999998 0.6557333333333333 0.49274666666666667 1.2590666666666666 0.9538666666666666 1.7533333333333332 -0.18653333333333333 0.07999999999999999 -0.3863733333333333 0.14666666666666667 -0.5595866666666667 0.23986666666666667 -0.32243999999999995 0.20213333333333333 -0.6217866666666666 0.43879999999999997 -0.8926533333333333 0.7061333333333333 0 0.07999999999999999 -0.10658666666666666 0.17319999999999997 -0.17319999999999997 0.23986666666666667 -0.06541333333333332 -0.5934666666666666 -0.24646666666666664 -1.1682666666666666 -0.5329333333333333 -1.692133333333333 -0.13313333333333333 -0.23146666666666665 -0.29918666666666666 -0.44239999999999996 -0.49295999999999995 -0.6261333333333333 -0.17750666666666665 -0.18226666666666663 -0.37924 -0.3392 -0.5995466666666667 -0.4664 -0.1958933333333333 -0.07426666666666666 -0.39610666666666666 -0.13653333333333334 -0.5995466666666667 -0.1864 0.46953333333333336 -0.4310666666666666 0.8038266666666667 -0.9890666666666666 0.9622933333333333 -1.6062666666666667 0.15845333333333333 -0.6173333333333333 0.13426666666666665 -1.2673333333333332 -0.06964 -1.8712 -0.23958666666666664 -0.7252000000000001 -0.6866399999999999 -1.3641333333333332 -1.2857866666666666 -1.8377333333333334 -0.5991466666666666 -0.47373333333333334 -1.32408 -0.7611999999999999 -2.085 -0.8269333333333333 -0.7048533333333333 -0.05213333333333334 -1.4036799999999998 0.16173333333333334 -1.95852 0.5995999999999999 -0.7284799999999999 0.6045333333333334 -1.2038533333333332 1.4602666666666666 -1.33232 2.398133333333333 -0.12626666666666667 0.5278666666666666 -0.10069333333333333 1.0806666666666667 0.07375999999999999 1.5945333333333331 0.17445333333333335 0.514 0.49066666666666664 0.9681333333333333 0.9121599999999999 1.31 -0.35045333333333334 0.086 -0.6901066666666666 0.21106666666666665 -1.0125733333333333 0.37306666666666666 -0.21506666666666666 0.13413333333333333 -0.41208 0.29533333333333334 -0.5862266666666667 0.4796 -0.17021333333333333 0.19106666666666666 -0.3177466666666666 0.4012 -0.43966666666666665 0.6261333333333333 -0.29291999999999996 0.5004 -0.48738666666666663 1.0521333333333334 -0.5728933333333333 1.6254666666666666 -0.020626666666666665 0.06386666666666665 -0.028346666666666666 0.13119999999999998 -0.022719999999999997 0.19799999999999998 0.005626666666666666 0.06693333333333333 0.024480000000000002 0.132 0.05548 0.19146666666666667 0.030986666666666666 0.05946666666666667 0.07349333333333333 0.11226666666666665 0.12505333333333332 0.1552 0.05156 0.04293333333333333 0.11113333333333332 0.07519999999999999 0.17526666666666668 0.09493333333333333 0.1290133333333333 0.042666666666666665 0.2696133333333333 0.03306666666666666 0.39164 -0.026799999999999997 0.12204 -0.05973333333333333 0.2158 -0.16493333333333332 0.2612 -0.29306666666666664 0.12323999999999999 -0.22826666666666665 0.27064 -0.44266666666666665 0.43966666666666665 -0.6394666666666666 0.16768 -0.18306666666666666 0.34559999999999996 -0.3566666666666667 0.5329333333333333 -0.5196l0.49295999999999995 -0.5196c0.32448 -0.42186666666666667 0.6808000000000001 -0.8182666666666667 1.0658533333333333 -1.1857333333333333 0.08535999999999999 -0.046933333333333334 0.15142666666666665 -0.12240000000000001 0.18653333333333333 -0.21319999999999997h0.22649333333333332c0.12147999999999999 0.0036 0.23958666666666664 -0.040266666666666666 0.3291733333333333 -0.12240000000000001s0.14357333333333333 -0.19599999999999998 0.15046666666666667 -0.3173333333333333c-0.006346666666666667 -0.10746666666666667 -0.05189333333333333 -0.20879999999999999 -0.1280133333333333 -0.2849333333333333 -0.07613333333333333 -0.07613333333333333 -0.17753333333333332 -0.12173333333333333 -0.28501333333333334 -0.128 -1.1458 -0.14653333333333332 -1.33232 -1.1990666666666665 -1.0791866666666667 -2.131733333333333 0.25314666666666663 -0.9326666666666666 0.8926666666666666 -1.692133333333333 1.8386133333333332 -1.5721333333333334 0.44164000000000003 0.029066666666666664 0.8653866666666665 0.1856 1.22004 0.45039999999999997 0.35463999999999996 0.2648 0.6250133333333333 0.6266666666666666 0.7784533333333333 1.0417333333333332 0.19050666666666666 0.4112 0.23357333333333333 0.8754666666666666 0.12194666666666666 1.3146666666666667 -0.11161333333333334 0.43920000000000003 -0.3711066666666667 0.8265333333333333 -0.7348133333333333 1.0969333333333333 -0.1684 0.13093333333333332 -0.3642666666666666 0.222 -0.5729066666666667 0.26639999999999997 -0.25914666666666664 0.054266666666666664 -0.52184 0.08986666666666666 -0.7860666666666667 0.10653333333333333 -0.13548 0.006933333333333333 -0.26288 0.06653333333333333 -0.3549866666666666 0.16613333333333333 -0.09212 0.0996 -0.14162666666666665 0.2312 -0.13797333333333334 0.3668 0.00168 0.06773333333333333 0.016919999999999998 0.1344 0.04479999999999999 0.19599999999999998 0.027880000000000002 0.061733333333333335 0.06785333333333332 0.1172 0.11753333333333334 0.16306666666666667 0.04968 0.046 0.10807999999999998 0.08146666666666666 0.17173333333333332 0.10453333333333333 0.06365333333333333 0.023066666666666666 0.13126666666666664 0.03306666666666666 0.19885333333333333 0.02946666666666667 0.38376 0.019333333333333334 0.7684533333333332 -0.0076 1.1458133333333334 -0.07999999999999999h0.18651999999999996c0.34639999999999993 0.3064 0.6261866666666667 0.6396 0.9193066666666666 0.9326666666666666l0.5329333333333333 0.5329333333333333c0.19588 0.1628 0.38267999999999996 0.3362666666666666 0.5595733333333333 0.5196 0.17473333333333332 0.20013333333333333 0.32665333333333335 0.4190666666666667 0.45298666666666665 0.6527999999999999 0.03333333333333333 0.09720000000000001 0.09618666666666666 0.18159999999999998 0.17978666666666665 0.24133333333333332 0.08361333333333333 0.05973333333333333 0.18378666666666665 0.09173333333333333 0.2865333333333333 0.09173333333333333 -0.42216 0.7362666666666666 -0.7023599999999999 1.5452 -0.82604 2.384933333333333 -0.031213333333333333 0.0676 -0.04750666666666667 0.1412 -0.04778666666666666 0.21573333333333333 -0.00028 0.07453333333333333 0.015466666666666665 0.14813333333333334 0.04617333333333333 0.216 0.030706666666666663 0.06799999999999999 0.07565333333333332 0.1284 0.13178666666666666 0.17746666666666666 0.056146666666666664 0.048933333333333336 0.12215999999999999 0.0852 0.19357333333333332 0.10653333333333333 0.07141333333333333 0.0212 0.14656 0.026799999999999997 0.22034666666666664 0.016399999999999998 0.07377333333333333 -0.010266666666666667 0.14446666666666666 -0.0364 0.20726666666666665 -0.07653333333333333 0.0628 -0.039999999999999994 0.11625333333333333 -0.0932 0.15672 -0.15573333333333333 0.04048 -0.06253333333333333 0.06702666666666666 -0.13306666666666667 0.07783999999999999 -0.20679999999999998 0.41828 -0.9022666666666666 1.0167866666666665 -1.7093333333333334 1.7586666666666666 -2.3714666666666666l0.6262 -0.5862666666666666c0.3221866666666666 -0.2949333333333333 0.6649866666666666 -0.5665333333333333 1.02592 -0.8128 0.0444 0.0024 0.0888 0.0024 0.13319999999999999 0 0.6830666666666666 0.12026666666666666 1.382 0.12026666666666666 2.0650666666666666 0 0.0392 0.0116 0.0808 0.0116 0.12 0 0.06653333333333333 0.0952 0.16319999999999998 0.16519999999999999 0.27426666666666666 0.19906666666666664 0.11106666666666666 0.03373333333333333 0.23026666666666665 0.02933333333333333 0.33853333333333335 -0.012533333333333334 0.19519999999999998 -0.09053333333333333 0.38239999999999996 -0.19746666666666668 0.5596 -0.3197333333333333 0.3961333333333333 0.29706666666666665 0.7744 0.6173333333333333 1.1325333333333334 0.9593333333333334 0.21306666666666665 0.21319999999999997 0.3996 0.4262666666666666 0.5728 0.6261333333333333 0.6650666666666667 0.7813333333333332 1.1677333333333333 1.6870666666666667 1.4789333333333332 2.6646666666666663 0.019733333333333332 0.06586666666666666 0.0524 0.12706666666666666 0.09599999999999999 0.18026666666666663 0.0436 0.053066666666666665 0.09733333333333333 0.09706666666666666 0.15813333333333332 0.12933333333333333 0.06066666666666666 0.03213333333333333 0.12719999999999998 0.052 0.1956 0.058399999999999994 0.06853333333333333 0.006266666666666667 0.13746666666666665 -0.0010666666666666667 0.20306666666666665 -0.021599999999999998 0.12986666666666666 -0.034666666666666665 0.2417333333333333 -0.11706666666666667 0.3133333333333333 -0.23066666666666663 0.07173333333333333 -0.11359999999999999 0.09773333333333334 -0.2501333333333333 0.07306666666666667 -0.3821333333333333 -0.0608 -0.8686666666666666 -0.24013333333333334 -1.7248 -0.5329333333333333 -2.5448 -0.08026666666666665 -0.16706666666666664 -0.17386666666666664 -0.3274666666666667 -0.2797333333333333 -0.4796 0.11986666666666665 0.02693333333333333 0.24546666666666667 0.009333333333333332 0.3532 -0.04959999999999999 0.10786666666666667 -0.0588 0.19066666666666665 -0.1548 0.23293333333333333 -0.27013333333333334 0.13119999999999998 -0.22666666666666668 0.2828 -0.44066666666666665 0.4530666666666666 -0.6396 0.14653333333333332 -0.18653333333333333 0.34639999999999993 -0.3197333333333333 0.5196 -0.5062666666666666 0.17319999999999997 -0.18653333333333333 0.3330666666666666 -0.3197333333333333 0.4929333333333333 -0.5062666666666666 0.3248 -0.41746666666666665 0.6812 -0.8094666666666666 1.0658666666666665 -1.1723999999999999 0.092 -0.04226666666666666 0.16373333333333334 -0.11879999999999999 0.19986666666666666 -0.21319999999999997h0.2265333333333333c0.12013333333333333 0 0.2353333333333333 -0.04773333333333333 0.32026666666666664 -0.13266666666666665s0.13266666666666665 -0.20026666666666665 0.13266666666666665 -0.3204c0 -0.12013333333333333 -0.04773333333333333 -0.2353333333333333 -0.13266666666666665 -0.32026666666666664s-0.20013333333333333 -0.13266666666666665 -0.32026666666666664 -0.13266666666666665c-1.1325333333333334 -0.14653333333333332 -1.3323999999999998 -1.1990666666666665 -1.0792 -2.131733333333333 0.25306666666666666 -0.9326666666666666 0.9059999999999999 -1.6919999999999997 1.8518666666666665 -1.5721333333333334 0.4398666666666667 0.03 0.8614666666666666 0.1869333333333333 1.2138666666666666 0.45186666666666664 0.3522666666666666 0.2648 0.6202666666666666 0.6262666666666666 0.7713333333333333 1.0402666666666667 0.2081333333333333 0.4085333333333333 0.2673333333333333 0.8766666666666666 0.1676 1.3239999999999998 -0.0996 0.4474666666666667 -0.352 0.8461333333333334 -0.7138666666666666 1.1276 -0.17466666666666666 0.12866666666666665 -0.37439999999999996 0.21933333333333332 -0.5862666666666666 0.26639999999999997 -0.2545333333333333 0.054400000000000004 -0.5127999999999999 0.09 -0.7726666666666666 0.10653333333333333 -0.13546666666666665 0.006933333333333333 -0.2629333333333333 0.06653333333333333 -0.35506666666666664 0.16613333333333333 -0.092 0.0996 -0.1416 0.2312 -0.13786666666666667 0.3668 -0.00013333333333333334 0.06706666666666666 0.013466666666666665 0.13346666666666665 0.03986666666666666 0.19506666666666667 0.0264 0.061599999999999995 0.06506666666666666 0.1172 0.11373333333333333 0.16333333333333333 0.048666666666666664 0.04613333333333333 0.10613333333333333 0.08186666666666667 0.16906666666666664 0.10506666666666666 0.06293333333333333 0.023066666666666666 0.13 0.03319999999999999 0.19693333333333332 0.0296 0.38813333333333333 0.019333333333333334 0.7771999999999999 -0.007466666666666667 1.1590666666666665 -0.07999999999999999h0.18653333333333333c0.34639999999999993 0.3064 0.6261333333333333 0.6262666666666666 0.9193333333333333 0.9193333333333333 0.29306666666666664 0.29306666666666664 0.3597333333333333 0.34639999999999993 0.5329333333333333 0.5196 0.17319999999999997 0.17319999999999997 0.38639999999999997 0.3197333333333333 0.5596 0.5196 0.16893333333333332 0.19986666666666666 0.32053333333333334 0.41373333333333334 0.4529333333333333 0.6394666666666666 0.018266666666666667 0.06533333333333333 0.04959999999999999 0.12639999999999998 0.09186666666666667 0.17933333333333334 0.04226666666666666 0.053066666666666665 0.09493333333333333 0.09706666666666666 0.15453333333333333 0.12933333333333333 0.05959999999999999 0.0324 0.12519999999999998 0.0524 0.19266666666666665 0.0588 0.0676 0.006533333333333333 0.13573333333333332 -0.0006666666666666666 0.20039999999999997 -0.021066666666666668 0.13 -0.039999999999999994 0.23906666666666665 -0.12946666666666667 0.3038666666666666 -0.24893333333333334 0.06466666666666666 -0.1196 0.07999999999999999 -0.2597333333333333 0.042533333333333326 -0.3905333333333333 -0.064 -0.61 -0.2545333333333333 -1.1998666666666666 -0.5594666666666666 -1.7319999999999998 -0.1316 -0.256 -0.3024 -0.48973333333333335 -0.5064 -0.6927999999999999Zm-15.441600000000001 0.4529333333333333c-0.2672 -0.33959999999999996 -0.4429066666666666 -0.742 -0.5105333333333333 -1.1688 -0.06763999999999999 -0.42679999999999996 -0.02489333333333333 -0.8637333333333334 0.12414666666666666 -1.2693333333333332 0.09212 -0.39080000000000004 0.2842533333333333 -0.7510666666666667 0.5575866666666667 -1.0453333333333332 0.2732 -0.2942666666666667 0.6182666666666666 -0.5125333333333333 1.0011999999999999 -0.6333333333333333 0.6195999999999999 -0.22186666666666666 1.3006666666666666 -0.1976 1.9029333333333334 0.0676s1.0798666666666665 0.7512 1.3346666666666664 1.3578666666666666c1.5054666666666665 3.5973333333333333 -3.530666666666667 3.664 -4.41 2.691333333333333Z" clipRule="evenodd" strokeWidth={1.3333} /><path fillRule="evenodd" d="M3.3772399999999996 17.493866666666666c0.19984000000000002 0 0.26646666666666663 0.18653333333333333 1.17244 -1.7853333333333332 0.11990666666666666 -0.25306666666666666 0.21317333333333333 -0.5329333333333333 0.30644 -0.786 0.6128666666666667 -1.59884 0.8127199999999999 -1.6787733333333332 0.50628 -1.9852133333333333 -0.5995466666666667 -0.5329333333333333 -1.8785733333333332 1.1325466666666666 -1.8919066666666666 1.1724133333333333 -0.14485333333333333 0.18386666666666665 -0.2657333333333333 0.3853333333333333 -0.35971999999999993 0.5995999999999999 -0.09097333333333332 0.2185333333333333 -0.15797333333333333 0.44639999999999996 -0.19985333333333333 0.6794666666666667 -0.07993333333333333 0.39973333333333333 -0.14656 2.051733333333333 0.46631999999999996 2.1050666666666666Z" clipRule="evenodd" strokeWidth={1.3333} /><path fillRule="evenodd" d="M30.423466666666663 14.656c-0.08893333333333332 -0.214 -0.2053333333333333 -0.41559999999999997 -0.34639999999999993 -0.5994666666666666 0 0 -1.3322666666666665 -1.7054133333333334 -1.8918666666666666 -1.1724933333333332 -0.3330666666666666 0.30644 -0.14653333333333332 0.41302666666666665 0.46626666666666666 1.9851599999999998 0.10653333333333333 0.2532 0.19986666666666666 0.5329333333333333 0.3064 0.7861333333333334 0.9193333333333333 1.9717333333333331 0.9726666666666667 1.7985333333333333 1.1858666666666666 1.7853333333333332 0.6128 0 0.5329333333333333 -1.7054666666666665 0.4796 -2.1052 -0.03613333333333333 -0.23426666666666665 -0.10333333333333333 -0.4628 -0.19986666666666666 -0.6794666666666667Z" clipRule="evenodd" strokeWidth={1.3333} /><path fillRule="evenodd" d="M8.027 11.618319999999999c0.12713333333333332 -0.05810666666666667 0.24772 -0.12957333333333332 0.3597333333333333 -0.21317333333333333 0.11766666666666666 -0.06934666666666667 0.22525333333333333 -0.15453333333333333 0.31976 -0.25314666666666663 1.01256 -0.8926533333333333 1.1990933333333333 -0.9592799999999999 1.0525333333333333 -1.33232 0 -0.14656 -0.21317333333333333 -0.63952 -1.8652533333333334 -0.06662666666666667 -0.16397333333333333 0.056493333333333326 -0.32054666666666665 0.13254666666666665 -0.46631999999999996 0.22650666666666666 -0.14035999999999998 0.09177333333333333 -0.26996 0.19902666666666669 -0.3863733333333333 0.3197466666666666 -0.21317333333333333 0.23982666666666666 -0.99924 1.3323333333333331 -0.67948 1.6520933333333332 0.11990666666666666 0.10658666666666666 0.19984000000000002 0.33308 1.6654 -0.33308Z" clipRule="evenodd" strokeWidth={1.3333} /><path fillRule="evenodd" d="M24.787733333333335 11.151973333333332c0.09999999999999999 0.09242666666666667 0.20679999999999998 0.17706666666666665 0.3197333333333333 0.25314666666666663 0.11666666666666665 0.08376 0.2417333333333333 0.1552 0.37306666666666666 0.21317333333333333 1.4789333333333332 0.66616 1.5588 0.43966666666666665 1.6654666666666667 0.31976 0.3197333333333333 -0.34639999999999993 -0.47973333333333334 -1.4122666666666666 -0.6796 -1.6520933333333332 -0.12106666666666667 -0.12084 -0.2552 -0.22806666666666667 -0.3996 -0.3197466666666666 -0.14439999999999997 -0.09654666666666667 -0.30119999999999997 -0.17275999999999997 -0.4664 -0.22650666666666666 -1.6386666666666667 -0.5728933333333333 -1.8118666666666665 -0.07993333333333333 -1.8652 0.06662666666666667 -0.13319999999999999 0.3863733333333333 0.05333333333333333 0.45298666666666665 1.0525333333333333 1.34564Z" clipRule="evenodd" strokeWidth={1.3333} /></svg>


    const renderContent = () => {
        switch (activeSection) {
            case 'general':
                return <GeneralForm />;
            case 'education':
                return <EducationForm />;
            case 'health':
                return <HealthForm />;
            default:
                return <GeneralForm />;
        }
    };

    return (
        <div className="p-4">
            <h1 className="flex flex-row gap-4 text-2xl font-bold items-center">
                <IconHeader />
                Plano de Parentalidade
            </h1>
            
            {/* Mobile and Desktop Views */}
            <div className="flex flex-col md:flex-row mt-6 md:mt-12">
                {/* Menu for mobile - Dropdown */}
                <div className="block md:hidden w-full mb-6">
                    <select 
                        className="select select-bordered w-full" 
                        value={activeSection}
                        onChange={(e) => setActiveSection(e.target.value)}
                    >
                        <option value="general">Geral</option>
                        <option value="health">Regime de Convivência</option>
                        <option value="education">Educação</option>
                        <option value="education">Atividades Extracurriculares</option>
                        <option value="education">Despesas Extras</option>
                        <option value="education">Segurança</option>
                        <option value="education">Festividades & Religiosidade</option>
                        <option value="health">Saúde</option>
                        <option value="health">Pessoas Terceiras</option>
                        <option value="education">Descumprimento</option>
                    </select>
                </div>
                
                {/* Sidebar for desktop */}
                <div className="join w-full">
                    <div className="hidden md:block md:w-1/4">
                        <div className="join join-vertical w-full">
                            {/* GENERAL */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    defaultChecked
                                    onChange={() => setActiveSection('general')}
                                />
                                <div className="collapse-title text-xl font-medium">Geral</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* CONVIVENCE REGIME */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('health')}
                                />
                                <div className="collapse-title text-xl font-medium">Regime de Convivência</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* EDUCATION */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('education')}
                                />
                                <div className="collapse-title text-xl font-medium">Educação</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* EXTRA CURRICULAR */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('education')}
                                />
                                <div className="collapse-title text-xl font-medium">Atividades Extracurriculares</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* EXTRA EXPENSES */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('education')}
                                />
                                <div className="collapse-title text-xl font-medium">Despesas Extras</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* SECURITY */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('education')}
                                />
                                <div className="collapse-title text-xl font-medium">Segurança</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* FESTIVITIES AND RELIGIOSITY */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('education')}
                                />
                                <div className="collapse-title text-xl font-medium">Festividades & Religiosidade</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* HEALTH */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('health')}
                                />
                                <div className="collapse-title text-xl font-medium">Saúde</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* NEW FAMILY MEMBERS */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('health')}
                                />
                                <div className="collapse-title text-xl font-medium">Pessoas Terceiras</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                            {/* NON-COMPLIANCE */}
                            <div className="collapse join-item">
                                <input
                                    type="radio"
                                    name="my-accordion-3"
                                    onChange={() => setActiveSection('education')}
                                />
                                <div className="collapse-title text-xl font-medium">Descumprimento</div>
                                <div className="collapse-content">
                                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nunc nec ultricies ultricies, nunc nunc.</p>
                                </div>
                            </div>
                            <div className="divider" />
                        </div>
                    </div>
                    <div className="w-full md:w-3/4 md:px-12">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanoDeParentalidade;