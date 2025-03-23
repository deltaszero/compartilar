'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { planSections, Section } from '../types';
import { CheckCircle2, Circle, LayoutDashboard, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanSidebarProps {
  planId: string;
  username: string;
  completedSections?: string[];
  onNavigate?: () => void; // New prop for mobile navigation
}

export default function PlanSidebar({ 
  planId, 
  username, 
  completedSections = [],
  onNavigate
}: PlanSidebarProps) {
  const pathname = usePathname();
  
  // Helper to check if a section is completed
  const isSectionCompleted = (sectionId: string) => {
    return completedSections.includes(sectionId);
  };
  
  // Helper to check if a section is active
  const isSectionActive = (sectionRoute: string) => {
    return pathname.includes(`/${username}/plano/${planId}/${sectionRoute}`);
  };

  // Custom Link wrapper that calls onNavigate when clicked
  const NavigationLink = ({ href, children }: { href: string, children: React.ReactNode }) => {
    return (
      <Link 
        href={href} 
        className="block" 
        onClick={onNavigate ? () => setTimeout(onNavigate, 150) : undefined}
      >
        {children}
      </Link>
    );
  };

  return (
    <aside>
      <nav className="p-3">
        <NavigationLink href={`/${username}/plano/${planId}`}>
          <Button 
            variant={pathname === `/${username}/plano/${planId}` ? "default" : "ghost"} 
            className={cn(
              "w-full justify-start font-medium rounded-lg",
              pathname === `/${username}/plano/${planId}` 
                ? "bg-main text-white hover:bg-main/90" 
                : "hover:bg-gray-100"
            )}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Visão Geral
          </Button>
        </NavigationLink>
        
        <div className="space-y-1 mt-4">
          <h3 className="text-xs font-semibold uppercase text-gray-500 px-3 mb-2">Conteúdo do Plano</h3>
          
          {planSections.map((section, index) => {
            const isCompleted = isSectionCompleted(section.id);
            const isActive = isSectionActive(section.route);
            
            return (
              <NavigationLink 
                key={section.id} 
                href={`/${username}/plano/${planId}/${section.route}`}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start pl-3 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gray-100 font-medium" 
                      : "hover:bg-gray-50",
                    isCompleted && !isActive
                      ? "text-main hover:text-main/90"
                      : ""
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <span className={cn(
                        "flex items-center justify-center w-5 h-5 mr-3 rounded-full",
                        isCompleted
                          ? "text-white bg-main"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <span className="text-xs">{index + 1}</span>
                        )}
                      </span>
                      <span className={cn(
                        "text-sm", 
                        isCompleted && "font-medium"
                      )}>
                        {section.title}
                      </span>
                    </div>
                    
                    {isActive && (
                      <ArrowRight className="h-4 w-4 ml-2 text-gray-400" />
                    )}
                  </div>
                </Button>
              </NavigationLink>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}