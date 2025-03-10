import React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Pricing() {
  const plans = [
    {
      name: "Básico",
      price: "Grátis",
      description: "Ideal para famílias começando a coordenar suas rotinas.",
      features: [
        "Calendário compartilhado",
        "Gerenciamento básico de despesas",
        "Perfis para até 2 crianças",
        "Histórico de check-in limitado",
      ],
      limitations: [
        "Armazenamento limitado",
        "Sem suporte prioritário",
        "Funcionalidades premium bloqueadas",
      ],
      cta: "Começar Agora",
      highlighted: false,
    },
    {
      name: "Premium",
      price: "R$29,90",
      period: "/mês",
      description: "Recursos completos para gerenciamento familiar eficiente.",
      features: [
        "Todas as funcionalidades do plano Básico",
        "Calendário com sincronização avançada",
        "Gerenciamento detalhado de despesas",
        "Perfis para crianças ilimitados",
        "Histórico completo de check-in",
        "Suporte prioritário",
        "Backup automático de dados",
        "Sem anúncios",
      ],
      cta: "Assinar Premium",
      highlighted: true,
    },
  ];

  return (
    <div className="px-4 sm:px-[8em] bg-white py-16" id="planos">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-12">
          <h2 className={cn(
            "bg-black text-white inline-block shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)]",
            "px-6 py-3 text-xl sm:text-4xl font-bold",
            "text-center"
          )}>
            Planos e Preços
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={cn(
                "border-2 border-black p-8",
                "flex flex-col h-full",
                plan.highlighted 
                  ? "shadow-brutalist bg-main text-white" 
                  : "shadow-brutalist-sm bg-white"
              )}
            >
              <div className="mb-4">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-extrabold">{plan.price}</span>
                  {plan.period && (
                    <span className="ml-1 text-xl font-medium">{plan.period}</span>
                  )}
                </div>
                <p className="mt-4">{plan.description}</p>
              </div>

              <div className="mt-6 space-y-4 flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex">
                      <CheckIcon className="h-5 w-5 flex-shrink-0 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Limitações:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation) => (
                        <li key={limitation} className="flex items-center">
                          <span className="mr-2">•</span>
                          <span className="opacity-75">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <Button 
                  className={cn(
                    "w-full py-3 font-bold text-lg",
                    plan.highlighted 
                      ? "bg-white text-main hover:bg-gray-100 border-2 border-black"
                      : "bg-black text-white hover:bg-gray-800"
                  )}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            Todos os planos incluem 7 dias de teste gratuito. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}