'use client';
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWindowSize } from '@/app/hooks/useWindowSize';

// Import components
import GeneralForm from './components/GeneralForm';
import TabNavigation from './components/TabNavigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';

// Health Form Component (simplified placeholder)
const HealthForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground italic">
        O menor terá plano de saúde? Qual? Quem paga? 
        Quem deve levar nas consultas regulares? 
        Como será avisado ao outro genitor o que o médico disse? 
        Como o outro genitor terá acesso aos exames, boletins médicos etc?
      </p>
      <p className="text-center text-muted mt-8">
        Esta seção será implementada em breve.
      </p>
    </div>
  );
};

// Education Form Component (simplified placeholder)
const EducationForm: React.FC = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground italic">
        Como chegarão a um consenso sobre qual escola o petiz vai estudar em caso de desentendimento?
        Quem será responsável por levar e buscar o infante na escola em cada dia e horários?
        Quem será o responsável financeiro?
      </p>
      <p className="text-center text-muted mt-8">
        Esta seção será implementada em breve.
      </p>
    </div>
  );
};

// Main Component
const PlanoDeParentalidade: React.FC = () => {
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const [activeSection, setActiveSection] = useState('general');
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

//   const renderContent = () => {
//     switch (activeSection) {
//       case 'general':
//         return <GeneralForm planId={planId} />;
//       case 'education':
//         return <EducationForm />;
//       case 'health':
//         return <HealthForm />;
//       default:
//         return <GeneralForm planId={planId} />;
//     }
//   };

  return (
    <div className="p-4 max-w-6xl w-full">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-8">
        Plano de Parentalidade
      </h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation tabs - shown differently on mobile vs desktop */}
        <TabNavigation 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          isMobile={isMobile}
        />

        {/* Content area */}
        <div className="w-full md:w-3/4">
          <Tabs value={activeSection}>
            <TabsContent value="general" className="mt-0">
              <GeneralForm planId={planId} />
            </TabsContent>
            <TabsContent value="education" className="mt-0">
              <EducationForm />
            </TabsContent>
            <TabsContent value="health" className="mt-0">
              <HealthForm />
            </TabsContent>
            <TabsContent value="regime" className="mt-0">
              <HealthForm />
            </TabsContent>
            <TabsContent value="activities" className="mt-0">
              <EducationForm />
            </TabsContent>
            <TabsContent value="expenses" className="mt-0">
              <EducationForm />
            </TabsContent>
            <TabsContent value="security" className="mt-0">
              <EducationForm />
            </TabsContent>
            <TabsContent value="celebrations" className="mt-0">
              <EducationForm />
            </TabsContent>
            <TabsContent value="third-parties" className="mt-0">
              <HealthForm />
            </TabsContent>
            <TabsContent value="compliance" className="mt-0">
              <EducationForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PlanoDeParentalidade;