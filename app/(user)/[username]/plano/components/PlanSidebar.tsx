'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { planSections, Section } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface PlanSidebarProps {
  planId: string;
  username: string;
  completedSections?: string[];
}

export default function PlanSidebar({ planId, username, completedSections = [] }: PlanSidebarProps) {
  const pathname = usePathname();
  
  // Helper to check if a section is completed
  const isSectionCompleted = (sectionId: string) => {
    return completedSections.includes(sectionId);
  };
  
  // Helper to check if a section is active
  const isSectionActive = (sectionRoute: string) => {
    return pathname.includes(`/${username}/plano/${planId}/${sectionRoute}`);
  };

  return (
    <div className="w-64 border-r p-4 h-full">
      <h2 className="font-semibold text-lg mb-4">Seções do Plano</h2>
      
      <div className="space-y-1">
        <Link href={`/${username}/plano/${planId}`} passHref>
          <Button 
            variant={pathname === `/${username}/plano/${planId}` ? "default" : "ghost"} 
            className="w-full justify-start"
          >
            Visão Geral
          </Button>
        </Link>
        
        {planSections.map((section) => (
          <Link 
            key={section.id} 
            href={`/${username}/plano/${planId}/${section.route}`}
            passHref
          >
            <Button
              variant={isSectionActive(section.route) ? "default" : "ghost"}
              className="w-full justify-start"
            >
              <span className="mr-2">
                {isSectionCompleted(section.id) ? 
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                  <Circle className="h-4 w-4" />
                }
              </span>
              {section.title}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}