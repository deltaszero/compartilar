'use client';

import { useState, use, useEffect, useCallback } from 'react';
import { usePlan } from '../context';
import { EducationSection, FieldStatus } from '../../types';
import { useUser } from '@/context/userContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import RegularEducationForm from '../../components/RegularEducationForm';
import PlanSectionImage from '../../components/PlanSectionImage';

// API service functions
const educationService = {
  // Get token from Firebase Auth directly
  getToken: async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No current user - user may need to reauthenticate');
        throw new Error('User not authenticated');
      }
      
      // Force token refresh to ensure we have a fresh token
      return await currentUser.getIdToken(true);
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw new Error('Authentication error - please refresh the page and try again');
    }
  },
  
  // Update a field in the education section
  updateField: async (planId: string, fieldName: string, value: string) => {
    try {
      const token = await educationService.getToken();
      
      console.log(`Updating field ${fieldName} with auth token`);
      
      const response = await fetch(`/api/parental-plan/${planId}/education`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          fieldName,
          value,
          changeDescription: `Campo ${fieldName} atualizado`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Error updating field: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to update field:', error);
      throw error;
    }
  },
  
  // Approve or reject a field
  approveField: async (planId: string, fieldName: string, approved: boolean, comments?: string) => {
    try {
      const token = await educationService.getToken();
      
      console.log(`${approved ? 'Approving' : 'Rejecting'} field ${fieldName}`);
      
      const response = await fetch(`/api/parental-plan/${planId}/education`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          fieldName,
          approved,
          comments
        })
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('API error response:', errorData);
        } catch (e) {
          errorData = { error: 'Could not parse error response', status: response.status };
          console.error('Failed to parse API error response:', e);
        }
        
        throw new Error(
          (errorData && errorData.error) || 
          `Error ${approved ? 'approving' : 'rejecting'} field: ${response.status}`
        );
      }
      
      return response.json();
    } catch (error) {
      console.error(`Failed to ${approved ? 'approve' : 'reject'} field:`, error);
      throw error;
    }
  },
  
  // Cancel a pending field change
  cancelFieldChange: async (planId: string, fieldName: string) => {
    try {
      const token = await educationService.getToken();
      
      console.log(`Cancelling field change for ${fieldName}`);
      
      const response = await fetch(`/api/parental-plan/${planId}/education?fieldName=${fieldName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Error cancelling field change: ${response.status}`);
      }
      
      // Parse the response
      const result = await response.json();
      console.log(`Cancellation result for ${fieldName}:`, result);
      
      return result;
    } catch (error) {
      console.error('Failed to cancel field change:', error);
      throw error;
    }
  },
  
  // Submit the entire education section
  submitEducationSection: async (planId: string, educationData: EducationSection) => {
    try {
      const token = await educationService.getToken();
      
      const response = await fetch(`/api/parental-plan/${planId}/education`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          educationData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Error submitting education section: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Failed to submit education section:', error);
      throw error;
    }
  }
};

export default function EducationPage({ params }: { params: Promise<{ username: string; id: string }> }) {
  const resolvedParams = use(params);
  const { plan, isLoading, error, refreshPlan } = usePlan();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="pt-6">
            <h1 className="text-xl font-bold text-center mb-4">Erro</h1>
            <p className="text-center text-gray-500">{error || 'Plano não encontrado'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const educationData = plan.sections.education;
  
  // Handler for field change
  const handleFieldChange = async (fieldName: string, value: string) => {
    if (!user) return;
    
    try {
      await educationService.updateField(resolvedParams.id, fieldName, value);
      await refreshPlan();
      
      return true;
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  };
  
  // Handler for field approval/rejection
  const handleApproveField = async (fieldName: string, approved: boolean, comments?: string) => {
    if (!user) return;
    
    try {
      await educationService.approveField(resolvedParams.id, fieldName, approved, comments);
      await refreshPlan();
      
      return true;
    } catch (error) {
      console.error(`Error ${approved ? 'approving' : 'rejecting'} field:`, error);
      throw error;
    }
  };
  
  // Handler for cancelling a pending field change
  const handleCancelChange = async (fieldName: string) => {
    if (!user) return;
    
    try {
      await educationService.cancelFieldChange(resolvedParams.id, fieldName);
      await refreshPlan();
      
      return true;
    } catch (error) {
      console.error('Error cancelling field change:', error);
      throw error;
    }
  };
  
  // Handler for submitting the entire form
  const handleSubmitForm = async (data: EducationSection) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await educationService.submitEducationSection(resolvedParams.id, data);
      await refreshPlan();
    } catch (error) {
      console.error('Error submitting education section:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handler for cancellation
  const handleCancel = () => {
    // Navigate back to the plan overview
    window.history.back();
  };

  return (
    <div className="px-4 md:px-6">
      <div className="mb-6 flex items-center gap-4">
        <PlanSectionImage 
          sectionId="education"
          alt="Educação Regular"
          width={80}
          height={80}
          className="h-16 w-16 flex-shrink-0 object-contain hidden sm:block"
        />
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Educação Regular</h1>
          <p className="text-gray-500">Configure as informações sobre a educação escolar da criança</p>
        </div>
      </div>
      
      <RegularEducationForm
        initialData={educationData}
        onSubmit={handleSubmitForm}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        planId={resolvedParams.id}
        onFieldChange={handleFieldChange}
        onApproveField={handleApproveField}
        onCancelChange={handleCancelChange}
        currentUserId={user?.uid}
        isEditMode={true} // Set to true to enable the new field-by-field editing mode
      />
    </div>
  );
}