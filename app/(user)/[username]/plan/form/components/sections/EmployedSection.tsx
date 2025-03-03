'use client';
import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface EmployedSectionProps {
    alimonyInMoney: boolean;
    setAlimonyInMoney: (value: boolean) => void;
    moneyMethod: string;
    setMoneyMethod: (value: string) => void;
    obligationsChecked: boolean;
    setObligationsChecked: (value: boolean) => void;
    paymentChecked: boolean;
    setPaymentChecked: (value: boolean) => void;
    reimbursementChecked: boolean;
    setReimbursementChecked: (value: boolean) => void;
}

export const EmployedSection: React.FC<EmployedSectionProps> = ({
    alimonyInMoney,
    setAlimonyInMoney,
    moneyMethod,
    setMoneyMethod,
    obligationsChecked,
    setObligationsChecked,
    paymentChecked,
    setPaymentChecked,
    reimbursementChecked,
    setReimbursementChecked
}) => {
    return (
        <div className="flex flex-col gap-2 flex-1">
            <Label className="text-sm font-medium mb-2">
                Quando Empregada ou Autônoma
            </Label>
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-12">
                <div className="flex flex-col items-start gap-2 w-full md:w-auto">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="employed-money" 
                            checked={alimonyInMoney}
                            onCheckedChange={() => setAlimonyInMoney(!alimonyInMoney)}
                        />
                        <Label htmlFor="employed-money">Dinheiro</Label>
                    </div>
                    
                    {alimonyInMoney && (
                        <div className="flex flex-col my-2 md:my-4 gap-2 pl-6">
                            <RadioGroup value={moneyMethod} onValueChange={setMoneyMethod}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Deposito" id="employed-deposito" />
                                    <Label htmlFor="employed-deposito">Depósito em conta corrente</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="Desconto" id="employed-desconto" />
                                    <Label htmlFor="employed-desconto">Desconto em Folha</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col items-start gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="employed-obligations" 
                            checked={obligationsChecked}
                            onCheckedChange={() => setObligationsChecked(!obligationsChecked)}
                        />
                        <Label htmlFor="employed-obligations">Obrigações</Label>
                    </div>
                    
                    {obligationsChecked && (
                        <div className="flex flex-col my-2 md:my-4 gap-2 pl-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="employed-payment" 
                                    checked={paymentChecked}
                                    onCheckedChange={() => setPaymentChecked(!paymentChecked)}
                                />
                                <Label htmlFor="employed-payment" className="text-sm">
                                    Pagamento de serviços e objetos
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="employed-reimbursement" 
                                    checked={reimbursementChecked}
                                    onCheckedChange={() => setReimbursementChecked(!reimbursementChecked)}
                                />
                                <Label htmlFor="employed-reimbursement" className="text-sm">
                                    Reembolso
                                </Label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};