'use client';

import { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import type { PremiumFeature } from '@/hooks/usePremiumFeatures';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubscriptionButton } from '@/app/components/logged-area/ui/SubscriptionButton';

interface PremiumFeatureProps {
  feature: PremiumFeature;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradeDialog?: boolean;
  showLockIcon?: boolean;
  className?: string;
}

export function PremiumFeature({
  feature,
  children,
  fallback,
  showUpgradeDialog = true,
  showLockIcon = true,
  className
}: PremiumFeatureProps) {
  const { canUseFeature, getFeatureLockedMessage, isPremium } = usePremiumFeatures();
  
  const hasAccess = canUseFeature(feature);
  
  // User has access, render normal content
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // User doesn't have access
  // If there's a fallback, render that
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Otherwise show locked feature with upgrade option
  return (
    <div className={`relative ${className || ''}`}>
      <div className="opacity-50 pointer-events-none blur-[1px]">
        {children}
      </div>
      
      {showLockIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          {showUpgradeDialog ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="bg-slate-800/80 backdrop-blur border-purple-500/30 hover:bg-slate-700/90"
                >
                  <Lock className="w-4 h-4 mr-2 text-purple-400" />
                  Recurso Premium
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
                    Recurso Premium
                  </DialogTitle>
                  <DialogDescription>
                    {getFeatureLockedMessage(feature)}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                  <SubscriptionButton />
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="bg-slate-800/80 backdrop-blur py-1.5 px-3 rounded border border-purple-500/30 text-sm flex items-center">
              <Lock className="w-3.5 h-3.5 mr-2 text-purple-400" />
              Recurso Premium
            </div>
          )}
        </div>
      )}
    </div>
  );
}