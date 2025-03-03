'use client';
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabNavigationProps {
    activeSection: string;
    setActiveSection: (section: string) => void;
    isMobile?: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ 
    activeSection, 
    setActiveSection,
    isMobile = false
}) => {
    const tabs = [
        { id: 'general', label: 'Geral' },
        { id: 'regime', label: 'Regime de Convivência' },
        { id: 'education', label: 'Educação' },
        { id: 'activities', label: 'Atividades Extracurriculares' },
        { id: 'expenses', label: 'Despesas Extras' },
        { id: 'security', label: 'Segurança' },
        { id: 'celebrations', label: 'Festividades & Religiosidade' },
        { id: 'health', label: 'Saúde' },
        { id: 'third-parties', label: 'Pessoas Terceiras' },
        { id: 'compliance', label: 'Descumprimento' }
    ];

    if (isMobile) {
        return (
            <div className="w-full mb-6">
                <select 
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={activeSection}
                    onChange={(e) => setActiveSection(e.target.value)}
                >
                    {tabs.map(tab => (
                        <option key={tab.id} value={tab.id}>
                            {tab.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="w-full md:w-1/4 space-y-2">
            <Tabs 
                defaultValue={activeSection} 
                orientation="vertical" 
                onValueChange={setActiveSection}
                className="w-full"
            >
                <TabsList className="flex flex-col h-auto bg-transparent border-r space-y-1 items-start">
                    {tabs.map(tab => (
                        <TabsTrigger 
                            key={tab.id} 
                            value={tab.id}
                            className="w-full justify-start px-4 data-[state=active]:bg-accent/50 data-[state=active]:text-accent-foreground rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    );
};

export default TabNavigation;