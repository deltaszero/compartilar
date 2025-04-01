import { FieldQuestion, RadioQuestion, FormSection } from '../../components/forms';

export interface GeneralFormData {
  referenceHome: FieldQuestion<string>; // Now accepts editor IDs or 'alternado'
  guardianshipType: RadioQuestion<'unilateral' | 'compartilhada'>;
  childSupportEmployed: {
    moneyPayment: RadioQuestion<'sim' | 'não'>;
    paymentMethod?: RadioQuestion<'depósito' | 'desconto_em_folha'>;
    directPayment: RadioQuestion<'sim' | 'não'>;
    services: RadioQuestion<'sim' | 'não'>;
    extraExpenses: RadioQuestion<'sim' | 'não'>;
  };
  childSupportUnemployed: {
    moneyPayment: RadioQuestion<'sim' | 'não'>;
    paymentMethod?: RadioQuestion<'depósito' | 'desconto_em_folha'>;
    directPayment: RadioQuestion<'sim' | 'não'>;
    services: RadioQuestion<'sim' | 'não'>;
    extraExpenses: RadioQuestion<'sim' | 'não'>;
  };
}

// Form data with questions, options, tooltips, and other metadata
export const generalFormData: FormSection<GeneralFormData> = {
  id: 'geral',
  title: 'Informações Gerais',
  description: 'Definição das regras gerais de guarda e pensão alimentícia.',
  questions: {
    referenceHome: {
      id: 'referenceHome',
      type: 'radio',
      label: 'Lar Referência',
      tooltip: 'O lar de referência é onde a criança tem seu endereço oficial e permanente.',
      options: [
        { value: 'mãe', label: 'Mãe' },
        { value: 'pai', label: 'Pai' },
        { value: 'outro', label: 'Outro' },
        { value: 'alternado', label: 'Alternado', tooltip: 'Alternado significa que a criança possui dois lares de referência, alternando entre eles' }
      ],
      required: true
    },
    guardianshipType: {
      id: 'guardianshipType',
      type: 'radio',
      label: 'Tipo de Guarda',
      tooltip: 'Define como será compartilhada a responsabilidade legal pelos filhos.',
      options: [
        { value: 'unilateral', label: 'Unilateral' },
        { value: 'compartilhada', label: 'Compartilhada' }
      ],
      required: true
    },
    childSupportEmployed: {
      moneyPayment: {
        id: 'childSupport.employed.moneyPayment',
        type: 'radio',
        label: 'Pagamento em Dinheiro (Genitor Empregado)',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      paymentMethod: {
        id: 'childSupport.employed.paymentMethod',
        type: 'radio',
        label: 'Método de Pagamento (Genitor Empregado)',
        options: [
          { value: 'depósito', label: 'Depósito' },
          { value: 'desconto_em_folha', label: 'Desconto em folha' }
        ],
        required: false,
        conditionalOn: {
          field: 'childSupport.employed.moneyPayment',
          value: 'sim'
        }
      },
      directPayment: {
        id: 'childSupport.employed.otherObligations.directPayment',
        type: 'radio',
        label: 'Pagamento direto de obrigações (Genitor Empregado)',
        tooltip: 'Ex: escola, plano de saúde, etc.',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      services: {
        id: 'childSupport.employed.otherObligations.services',
        type: 'radio',
        label: 'Custeio dos serviços (Genitor Empregado)',
        tooltip: 'Ex: internet, TV, luz, etc.',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      extraExpenses: {
        id: 'childSupport.employed.otherObligations.extraExpenses',
        type: 'radio',
        label: 'Reembolso de despesas extras (Genitor Empregado)',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      }
    },
    childSupportUnemployed: {
      moneyPayment: {
        id: 'childSupport.unemployed.moneyPayment',
        type: 'radio',
        label: 'Pagamento em Dinheiro (Genitor Desempregado)',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      paymentMethod: {
        id: 'childSupport.unemployed.paymentMethod',
        type: 'radio',
        label: 'Método de Pagamento (Genitor Desempregado)',
        options: [
          { value: 'depósito', label: 'Depósito' },
          { value: 'desconto_em_folha', label: 'Desconto em folha' }
        ],
        required: false,
        conditionalOn: {
          field: 'childSupport.unemployed.moneyPayment',
          value: 'sim'
        }
      },
      directPayment: {
        id: 'childSupport.unemployed.otherObligations.directPayment',
        type: 'radio',
        label: 'Pagamento direto de obrigações (Genitor Desempregado)',
        tooltip: 'Ex: escola, plano de saúde, etc.',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      services: {
        id: 'childSupport.unemployed.otherObligations.services',
        type: 'radio',
        label: 'Custeio dos serviços (Genitor Desempregado)',
        tooltip: 'Ex: internet, TV, luz, etc.',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      },
      extraExpenses: {
        id: 'childSupport.unemployed.otherObligations.extraExpenses',
        type: 'radio',
        label: 'Reembolso de despesas extras (Genitor Desempregado)',
        options: [
          { value: 'sim', label: 'Sim' },
          { value: 'não', label: 'Não' }
        ],
        required: true
      }
    }
  }
};