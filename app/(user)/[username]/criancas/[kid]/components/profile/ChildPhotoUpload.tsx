import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

interface ChildPhotoUploadProps {
  childId: string;
  photoUrl: string | null | undefined;
  previewUrl: string | null;
  isEditing: boolean;
  isOwnerOrEditor: boolean;
  onPhotoChange: (url: string | null) => void;
  onPreviewChange: (url: string | null) => void;
  onProgressChange: (progress: number | null) => void;
}

export function ChildPhotoUpload({
  childId,
  photoUrl,
  previewUrl,
  isEditing,
  isOwnerOrEditor,
  onPhotoChange,
  onPreviewChange,
  onProgressChange
}: ChildPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    if (isEditing && isOwnerOrEditor && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size validation (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 5MB.'
      });
      return;
    }

    // File type validation
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Apenas imagens são permitidas.'
      });
      return;
    }

    // Create a local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onPreviewChange(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload to Firebase Storage
    if (!storage) throw new Error('Storage not initialized');
    const storageRef = ref(storage, `children/${childId}/profile-${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgressChange(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro no upload',
          description: 'Não foi possível fazer upload da imagem.'
        });
        onProgressChange(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onPhotoChange(downloadURL);
          onProgressChange(null);
          
          // Delete old photo if exists
          if (photoUrl && photoUrl !== downloadURL && storage) {
            try {
              const oldPhotoRef = ref(storage, photoUrl);
              await deleteObject(oldPhotoRef);
              console.log('Old photo deleted successfully');
            } catch (error) {
              console.error('Error deleting old photo:', error);
              // Don't show error to user as this is not critical
            }
          }
        } catch (error) {
          console.error('Error getting download URL:', error);
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível finalizar o upload da imagem.'
          });
        }
      }
    );
  };

  const displayUrl = previewUrl || photoUrl;
  
  return (
    <div className="flex justify-center mb-6">
      <div 
        className={`relative w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 
                    ${isEditing && isOwnerOrEditor ? 'cursor-pointer border-primary' : 'border-muted'}`}
        onClick={handlePhotoClick}
      >
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Foto da criança"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Camera className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        
        {isEditing && isOwnerOrEditor && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="h-8 w-8 text-white" />
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={!isEditing || !isOwnerOrEditor}
        />
      </div>
    </div>
  );
}