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
      
      // Update Firestore document - now we only use users collection
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updatableData,
        updatedAt: new Date()
      });
      
      // Show success toast
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
      
      // Exit edit mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar suas alterações. Tente novamente.',
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