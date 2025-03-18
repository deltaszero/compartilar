'use client';
import { useState } from 'react';
import { SignupFormData } from '../types';
import { toast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

export function useProfileEdit(initialData: Partial<SignupFormData>, userId: string) {
  // Track if edit mode is active
  const [isEditing, setIsEditing] = useState(false);
  
  // Ensure gender is one of the allowed values
  const safeInitialData = {
    ...initialData,
    gender: initialData.gender === 'male' || initialData.gender === 'female' || initialData.gender === 'other'
      ? initialData.gender
      : null
  };
  
  // Track form data during edits
  const [formData, setFormData] = useState<Partial<SignupFormData>>(safeInitialData);
  // Track loading state during save
  const [isSaving, setIsSaving] = useState(false);

  // Toggle edit mode
  const toggleEditMode = () => {
    if (isEditing) {
      // If canceling edit, reset form data to initial values with safe gender value
      setFormData(safeInitialData);
    }
    setIsEditing(!isEditing);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { name: string, value: string }) => {
    if ('target' in e) {
      // Handle standard input changes
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      // Handle select changes
      const { name, value } = e;
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : value
      }));
    }
  };

  // Save profile changes
  const saveChanges = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      // Get updatable fields (exclude certain fields like password)
      const { password, confirmPassword, uid, ...updatableData } = formData;
      
      // Call the API to update the profile
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          updateData: updatableData
        })
      });
      
      if (!response.ok) {
        // Try to get the error message
        let errorMessage = 'Não foi possível salvar suas alterações.';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If we can't parse the JSON, just use the default message
        }
        
        throw new Error(errorMessage);
      }
      
      // Show success toast
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Handle the error with proper type checking
      let errorMessage = 'Não foi possível salvar suas alterações. Tente novamente.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    formData,
    isSaving,
    toggleEditMode,
    handleChange,
    saveChanges
  };
}

export default useProfileEdit;