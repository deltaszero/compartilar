import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, Puzzle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent, AnalyticsEventType } from "@/app/components/Analytics";

export default function Pricing() {
    // Track section view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        trackEvent(AnalyticsEventType.SECTION_VIEW, {
                            section_name: 'pricing',
                            section_position: 'bottom',
                            is_visible: true
                        });
                        
                        // Once tracked, disconnect observer
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.3 } // Track when 30% of the section is visible
        );
        
        // Get the element to observe
        const plansElement = document.getElementById('planos');
        if (plansElement) {
            observer.observe(plansElement);
        }
        
        return () => observer.disconnect();
    }, []);
    
    const handlePlanClick = (planName: string, planPrice: string) => {
        trackEvent(AnalyticsEventType.PRICING_CLICK, {
            plan_name: planName,
            plan_price: planPrice,
            element: 'plan_button',
            action: 'select_plan'
        });
    };
    
    const plans = [
        {
            icon: <Puzzle className="h-8 w-8" />,
            name: "Básico",
            price: "Grátis",
            description: "Ideal para famílias começando a coordenar suas rotinas.",
            features: [
                "Adicione 1 perfil de criança",
                "Até 3 eventos diários no calendário",
                "Até 3 despesas diárias no painel financeiro",
                "Até 30 dias de histórico de check-in",
            ],
            limitations: [
                "Sem rede de apoio",
            ],
            cta: "Começar Agora",
            highlighted: false,
        },
        {
            icon: <Sparkles className="h-8 w-8" />,
            name: "Duo",
            price: "R$ 29,90",
            period: "/ mês",
            description: "Recursos completos para gerenciamento familiar eficiente.",
            features: [
                "Sem limite de perfis de crianças",
                "Sem limite de eventos no calendário",
                "Sem limite de despesas no painel financeiro",
                "Histórico completo de check-in",
            ],
            advantages: [
                "Até 5 membros na rede de apoio",
                "Notificações e lembretes personalizados",

            ],
            cta: "Assinar Duo",
            highlighted: true,
        },
    ];

    return (
        <div className="bg-blank" id="planos">
            <div
                className={cn(
                    "flex flex-row justify-center items-center text-center text-xl py-12 px-4 font-bold font-raleway",
                    "sm:text-4xl sm:px-0",
                )}>
                <span className={cn(
                    "bg-white text-black inline-block shadow-[5px_5px_0px_0px_rgba(255,255,255,0.3)] px-6 py-3"
                )}>
                    Planos e Preços
                </span>
            </div>
            <div className="px-4 pb-12 mx-auto sm:w-3/4">
                <div className="grid md:grid-cols-2 gap-8 mt-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "flex flex-col h-full p-8 font-nunito",
                                plan.highlighted
                                    ? "shadow-brutalist bg-main"
                                    : "shadow-brutalist-sm bg-white"
                            )}
                        >
                            <div className="mb-4">
                                <div className="flex flex-row items-start gap-4 align-center mb-4">
                                    <span>
                                        {plan.icon}
                                    </span>
                                    <h3 className="text-2xl font-bold">
                                        {plan.name}
                                    </h3>
                                </div>
                                <div className="mt-2 flex items-baseline font-raleway">
                                    <span className="text-4xl font-black">
                                        {plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="ml-1 text-xl font-medium">
                                            {plan.period}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-4">
                                    {plan.description}
                                </p>
                            </div>

                            <div className="mt-6 flex-grow">
                                <ul className="space-y-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex">
                                            <CheckIcon className="h-5 w-5 flex-shrink-0 mr-2" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.limitations && (
                                    <div className="mt-6">
                                        <h4 className="text-mdmb-2">
                                            Limitações:
                                        </h4>
                                        <ul className="space-y-1">
                                            {plan.limitations.map((limitation) => (
                                                <li key={limitation} className="flex items-center">
                                                    <span className="mr-2">•</span>
                                                    <span>{limitation}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {plan.advantages && (
                                    <div className="mt-6">
                                        <h4 className="text-mdmb-2">Vantagens:</h4>
                                        <ul className="space-y-1">
                                            {plan.advantages.map((advantage) => (
                                                <li key={advantage} className="flex items-center">
                                                    <CheckIcon className="h-5 w-5 flex-shrink-0 mr-2" />
                                                    <span>{advantage}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">
                                <Button
                                    className={cn(
                                        "w-full py-3 font-bold text-lg font-raleway",
                                        plan.highlighted
                                            ? "bg-white text-main border-2 border-black"
                                            : "bg-bw"
                                    )}
                                    onClick={() => handlePlanClick(plan.name, plan.price)}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}