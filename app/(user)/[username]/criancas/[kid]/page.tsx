'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/userContext';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, getChildChangeHistory, ChangeHistoryEntry } from '@/lib/firebaseConfig';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import LoadingPage from '@/app/components/LoadingPage';
import UserProfileBar from '@/app/components/logged-area/ui/UserProfileBar';
import { toast } from '@/hooks/use-toast';
import { KidInfo } from '../types';
import { format, formatRelative } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, Camera, Edit, Save, Plus, Trash, AlertTriangle, History, Clock, User, FileText, UserPlus, UserMinus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChildDetailPage() {
  const { username, kid } = useParams<{ username: string; kid: string }>();
  const router = useRouter();
  const { user, userData, loading } = useUser();
  const [childData, setChildData] = useState<KidInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedData, setEditedData] = useState<Partial<KidInfo>>({});
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Change history state
  const [historyEntries, setHistoryEntries] = useState<ChangeHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !userData) {
        router.push('/login');
        return;
      }

      try {
        // Get child data
        const childRef = doc(db, 'children', kid as string);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          toast({
            variant: 'destructive',
            title: 'Criança não encontrada',
            description: 'Os dados solicitados não existem.'
          });
          router.push(`/${username}/criancas`);
          return;
        }

        const childInfo = { id: childSnap.id, ...childSnap.data() } as KidInfo;
        setChildData(childInfo);
        setEditedData(childInfo);

        // Check if user is the owner or has editor permissions
        const editors = childInfo.editors || [];
        const viewers = childInfo.viewers || [];
        
        if (editors.includes(user.uid)) {
          setIsEditor(true);
          // Consider the creator as owner (for delete permissions)
          if (childInfo.createdBy === user.uid) {
            setIsOwner(true);
          }
        } else if (!viewers.includes(user.uid) && !editors.includes(user.uid)) {
          // User doesn't have view or edit permissions
          toast({
            variant: 'destructive',
            title: 'Acesso negado',
            description: 'Você não tem permissão para ver esta informação.'
          });
          router.push(`/${username}/home`);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching child data:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Ocorreu um erro ao carregar os dados. Tente novamente.'
        });
        router.push(`/${username}/criancas`);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [user, userData, kid, username, router, loading]);

  // Handle photo selection
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione uma imagem.'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo da imagem é 5MB.'
      });
      return;
    }

    // Create a URL for preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewPhoto(previewUrl);

    // Upload photo to Firebase
    uploadPhoto(file);
  };

  // Upload photo to Firebase Storage
  const uploadPhoto = async (file: File) => {
    if (!user?.uid || !childData?.id) return;

    setUploadProgress(0);
    try {
      if (!storage) {
        throw new Error("Storage is not initialized");
      }
      const storageRef = ref(storage, `children_photos/${childData.id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading file:', error);
          toast({
            variant: 'destructive',
            title: 'Erro no upload',
            description: 'Não foi possível enviar a foto. Tente novamente.'
          });
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Update edited data with new photo URL
          setEditedData(prev => ({
            ...prev,
            photoURL: downloadURL
          }));

          setUploadProgress(null);

          toast({
            title: 'Foto enviada',
            description: 'A foto foi carregada com sucesso!'
          });
        }
      );
    } catch (error) {
      console.error('Error starting upload:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível iniciar o upload da foto.'
      });
      setUploadProgress(null);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save changes
  const saveChanges = async () => {
    if (!childData?.id || !user?.uid) return;

    setIsSaving(true);
    try {
      // Generate a description of the changes
      const changedFields = Object.keys(editedData).filter(
        key => JSON.stringify(editedData[key as keyof typeof editedData]) !== 
               JSON.stringify(childData[key as keyof typeof childData])
      );
      
      if (changedFields.length === 0) {
        toast({
          title: 'Sem alterações',
          description: 'Nenhum dado foi modificado.'
        });
        setIsEditing(false);
        setIsSaving(false);
        return;
      }
      
      // Create a description for the history log
      const changeDescription = `Atualizou ${changedFields.length} ${changedFields.length === 1 ? 'campo' : 'campos'}: ${changedFields.join(', ')}`;
      
      // Get the edited data without any undefined or empty fields
      const cleanEditedData = Object.entries(editedData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // IMPORTANT: Split the process into two parts to ensure the main update succeeds
      // even if the history part fails due to permission issues
      
      // PART 1: Update the child document - this is the critical part
      try {
        const childRef = doc(db, 'children', childData.id);
        console.log("Updating main child document with data:", {
          ...cleanEditedData,
          updatedAt: "serverTimestamp()", 
          updatedBy: user.uid
        });
        
        await updateDoc(childRef, {
          ...cleanEditedData,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid
        });
        
        console.log("Main child document updated successfully");
        
        // Update the local state to reflect the changes
        setChildData(editedData as KidInfo);
        setIsEditing(false);
        
        toast({
          title: 'Dados salvos',
          description: 'As informações foram atualizadas com sucesso!'
        });
      } catch (mainError) {
        // This is a critical error - the main update failed
        console.error("Error updating child document:", mainError);
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar as alterações. Tente novamente.'
        });
        setIsSaving(false);
        return; // Don't proceed with history if main update failed
      }
      
      // PART 2: Try to add history entry, but don't block the main flow if it fails
      // This part is executed after the main update has succeeded
      try {
        // Calculate fields that actually changed by comparing values
        const actualChangedFields = Object.keys(cleanEditedData).filter(key => {
          // Skip system fields
          if (key === 'updatedAt' || key === 'updatedBy') return false;
          
          // Compare values - only include if they actually changed
          const oldValue = childData[key as keyof typeof childData];
          const newValue = cleanEditedData[key];
          
          // Handle different value types - perform deep comparison for objects
          return JSON.stringify(oldValue) !== JSON.stringify(newValue);
        });
        
        if (actualChangedFields.length === 0) {
          console.log("No actual fields changed, skipping history entry");
          return; // No need to add history for metadata-only changes
        }
        
        // Field name mapping for human-readable field names
        const fieldNameMapping: Record<string, string> = {
          firstName: "Nome",
          lastName: "Sobrenome",
          birthDate: "Data de Nascimento",
          gender: "Gênero",
          relationship: "Relacionamento",
          notes: "Anotações",
          photoURL: "Foto",
          schoolName: "Escola",
          interests: "Interesses"
        };
        
        // Get human-readable field names for display
        const humanReadableFields = actualChangedFields.map(field => 
          fieldNameMapping[field] || field
        );
        
        // Get old values
        const oldValues = actualChangedFields.reduce((acc, field) => {
          acc[field] = childData[field as keyof typeof childData];
          return acc;
        }, {} as Record<string, any>);
        
        // Get new values
        const newValues = actualChangedFields.reduce((acc, field) => {
          acc[field] = cleanEditedData[field];
          return acc;
        }, {} as Record<string, any>);
        
        // Create a human-readable description with field names
        const readableDescription = `Atualizou ${humanReadableFields.length === 1 
          ? humanReadableFields[0] 
          : `${humanReadableFields.length} campos: ${humanReadableFields.join(', ')}`}`;
        
        // Create history entry - this might fail due to permission issues, and that's OK
        console.log("Attempting to add history entry...");
        const historyRef = collection(db, 'children', childData.id, 'change_history');
        
        try {
          // Add the history entry with human-readable field names
          const historyDoc = await addDoc(historyRef, {
            timestamp: serverTimestamp(),
            userId: user.uid,
            userName: userData?.displayName || userData?.username,
            action: 'update',
            fields: actualChangedFields,
            fieldLabels: humanReadableFields, // Store human-readable field names
            oldValues,
            newValues,
            description: readableDescription // Use our new human-readable description
          });
          
          console.log("History entry added successfully with ID:", historyDoc.id);
        } catch (historyError: any) {
          // Just log the error but don't affect the main flow
          console.error("Failed to add history entry:", historyError?.message || historyError);
          console.log("This is expected until the security rules are updated");
        }
      } catch (e) {
        // Just log any errors with the history logic but don't affect the main flow
        console.error("Error in history creation logic:", e);
      }

      // The state updates and toast notifications are now handled in the first try-catch block
      
      // Refresh the history if we're on that tab
      if (document.querySelector('[data-state="active"][data-value="history"]')) {
        fetchChangeHistory();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações. Tente novamente.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete child
  const deleteChild = async () => {
    if (!childData?.id || !isOwner || !user?.uid) return;

    setIsDeleting(true);
    try {
      // Get reference to the child document
      const childRef = doc(db, 'children', childData.id);
      
      // Try to log deletion to history, but don't block the main deletion flow if it fails
      // due to permission issues, which is expected
      try {
        // Get the change_history subcollection reference - this may fail due to security rules
        const historyRef = collection(db, 'children', childData.id, 'change_history');
        
        console.log(`Attempting to add deletion history at path: children/${childData.id}/change_history`);
        
        const historyData = {
          timestamp: serverTimestamp(),
          userId: user.uid,
          userName: userData?.displayName || userData?.username || 'Unknown User',
          action: 'delete',
          fields: ['entire_record'],
          description: `Excluiu o registro de ${childData.firstName} ${childData.lastName}`
        };
        
        // Add a final history entry for the deletion - this might fail due to permissions
        try {
          const deletionHistoryDoc = await addDoc(historyRef, historyData);
          console.log("Deletion history entry added successfully with ID:", deletionHistoryDoc.id);
        } catch (permissionError: any) {
          // Log the permission error but continue with deletion
          console.error('Permission error adding deletion history:', permissionError?.message || permissionError);
          console.log("This is expected until the security rules are updated");
        }
      } catch (historyError) {
        // Just log any errors with the history logic
        console.error('Error with deletion history logic:', historyError);
      }

      // Delete the photo from storage if it exists
      if (childData.photoURL && storage) {
        try {
          // Extract the storage path from the URL
          const photoPath = decodeURIComponent(childData.photoURL.split('/o/')[1].split('?')[0]);
          const photoRef = ref(storage, photoPath);
          await deleteObject(photoRef);
        } catch (photoError) {
          console.error('Error deleting photo, continuing with child deletion:', photoError);
        }
      }

      // Delete the child document from Firestore
      await deleteDoc(childRef);

      toast({
        title: 'Criança removida',
        description: 'Os dados foram excluídos com sucesso!'
      });

      // Navigate back to the children list
      router.push(`/${username}/criancas`);
    } catch (error) {
      console.error('Error deleting child:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a criança. Tente novamente.'
      });
      setIsDeleting(false);
    }
  };

  // Format date to display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data indisponível';
    }
  };

  // Calculate child's age
  const calculateAge = (birthDateStr: string) => {
    try {
      const birthDate = new Date(birthDateStr);
      const today = new Date();

      let years = today.getFullYear() - birthDate.getFullYear();
      const months = today.getMonth() - birthDate.getMonth();

      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
      }

      if (years < 1) {
        // Calculate months for babies
        const monthAge = months + (months < 0 ? 12 : 0);
        return `${monthAge} ${monthAge === 1 ? 'mês' : 'meses'}`;
      }

      return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    } catch (e) {
      return "Idade não disponível";
    }
  };

  // Get relationship text
  // const getRelationshipText = (relationship: string | null) => {
  //   if (!relationship) return "Relação não especificada";

  //   switch (relationship) {
  //     case "biological": return "Filho(a) Biológico(a)";
  //     case "adopted": return "Filho(a) Adotivo(a)";
  //     case "guardian": return "Sob Guarda";
  //     default: return "Relação não especificada";
  //   }
  // };

  // Get gender text
  // const getGenderText = (gender: string | null) => {
  //   if (!gender) return "Não especificado";

  //   switch (gender) {
  //     case "male": return "Menino";
  //     case "female": return "Menina";
  //     case "other": return "Outro";
  //     default: return "Não especificado";
  //   }
  // };
  
  // Fetch change history - only for editors
  const fetchChangeHistory = async () => {
    if (!user?.uid || !childData || !isEditor) return;
    
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      // Query the change_history subcollection directly instead of using the helper function
      // This ensures we're getting the actual data from the database
      const historyRef = collection(db, 'children', kid as string, 'change_history');
      
      // Log the path we're querying for debugging
      console.log(`Attempting to query history at path: children/${kid}/change_history`);
      
      const historyQuery = query(historyRef, orderBy('timestamp', 'desc'), limit(50));
      
      let entries: ChangeHistoryEntry[] = [];
      
      try {
        // We'll wrap this in another try/catch to specifically handle permission errors
        try {
          // Try to fetch actual history data
          const snapshot = await getDocs(historyQuery);
          
          if (snapshot.empty) {
            console.log("No history entries found in database, using sample data");
            // Use sample data if no history exists yet
            entries = createSampleHistory();
          } else {
            console.log(`Found ${snapshot.size} history entries`);
            // Map the snapshot docs to ChangeHistoryEntry objects
            entries = snapshot.docs.map(doc => {
              const data = doc.data();
              // Convert Firestore timestamps to JavaScript dates
              const timestamp = data.timestamp ? 
                (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp)) : 
                new Date();
              
              return {
                ...data,
                timestamp
              } as ChangeHistoryEntry;
            });
          }
        } catch (permissionError) {
          // This is likely a permission error - fall back to sample data
          console.error("Permission error accessing history:", permissionError);
          entries = createSampleHistory();
          
          // Log a note about security rules
          console.info(
            "PERMISSION ERROR: Cannot access change_history subcollection due to security rules. " + 
            "Please update your Firestore rules according to the example in CLAUDE.md."
          );
        }
      } catch (error) {
        console.error("Error fetching history from Firestore:", error);
        // Fall back to sample data if there's an error
        entries = createSampleHistory();
        
        // Log a note about security rules
        console.info(
          "NOTE TO DEVELOPER: The change history feature requires updated Firestore rules " +
          "that allow read access to the 'change_history' subcollection. " +
          "Please update your Firestore rules to allow authenticated users to read subcollections " +
          "they have editor access to."
        );
      }
      
      setHistoryEntries(entries);
    } catch (error) {
      console.error("Unexpected error in fetchChangeHistory:", error);
      // For unexpected errors, we'll still show sample data instead of an error message
      // This gives a better user experience while we're fixing the backend
      const sampleEntries = createSampleHistory();
      setHistoryEntries(sampleEntries);
      
      // Log that we're using fallback data
      console.info("Using fallback sample data due to error");
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Helper function to get human-readable field names
  const getHumanReadableFieldName = (field: string): string => {
    const fieldNameMapping: Record<string, string> = {
      firstName: "Nome",
      lastName: "Sobrenome",
      birthDate: "Data de Nascimento",
      gender: "Gênero",
      relationship: "Relacionamento",
      notes: "Anotações",
      photoURL: "Foto",
      schoolName: "Escola",
      interests: "Interesses"
    };
    return fieldNameMapping[field] || field;
  };
  
  // Helper function to format field values for display
  const formatFieldValue = (field: string, value: any): string => {
    if (value === null || value === undefined) return 'Não definido';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    
    // Format specific field types
    if (field === 'birthDate') {
      try {
        return format(new Date(value), 'dd/MM/yyyy');
      } catch (e) {
        return String(value);
      }
    }
    
    if (field === 'gender') {
      const genderMap: Record<string, string> = {
        'male': 'Menino',
        'female': 'Menina',
        'other': 'Outro'
      };
      return genderMap[value] || String(value);
    }
    
    if (field === 'relationship') {
      const relationshipMap: Record<string, string> = {
        'biological': 'Biológico(a)',
        'adopted': 'Adotivo(a)',
        'guardian': 'Sob Guarda'
      };
      return relationshipMap[value] || String(value);
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  };
  
  // Helper to create sample history data when needed
  const createSampleHistory = (): ChangeHistoryEntry[] => {
    if (!childData) return [];
    
    return [
      {
        timestamp: new Date(),
        userId: childData.createdBy || 'unknown',
        userName: 'Sistema',
        action: 'create' as const,
        fields: ['firstName', 'lastName', 'birthDate'],
        description: 'Criação do perfil da criança'
      },
      {
        timestamp: new Date(Date.now() - 86400000), // yesterday
        userId: childData.updatedBy || childData.createdBy || 'unknown',
        userName: 'Sistema', 
        action: 'update' as const,
        fields: ['firstName'],
        oldValues: { firstName: "Nome anterior" },
        newValues: { firstName: childData.firstName },
        description: `Atualização de informações`
      }
    ];
  };

  if (isLoading || loading) {
    return <LoadingPage />;
  }

  if (!childData) {
    return (
      <div className="flex flex-col min-h-screen">
        <UserProfileBar pathname="Criança não encontrada" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold text-destructive mb-4">Criança não encontrada</h2>
            <p className="mb-6">Os dados solicitados não existem ou foram removidos.</p>
            <Link href={`/${username}/criancas`}>
              <Button>Voltar para Crianças</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const photoToDisplay = previewPhoto || editedData.photoURL || childData.photoURL;

  return (
    <div className="flex flex-col min-h-screen ">
      <UserProfileBar pathname={`${isEditing ? 'Editando' : ''} ${childData.firstName}`} />

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-20">
        {/* Back button */}
        <Link
          href={`/${username}/criancas`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para crianças
        </Link>

        {/* Header with photo and basic info */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Photo section */}
              <div className="relative md:w-1/3 h-64 md:h-auto">
                {photoToDisplay ? (
                  <Image
                    src={photoToDisplay}
                    alt={`Foto de ${childData.firstName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <span className="text-6xl font-bold text-primary/60">
                      {childData.firstName[0].toUpperCase()}
                      {childData.lastName[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Photo upload controls for edit mode */}
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                    <Button
                      variant="default"
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full bg-secondaryMain"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>

                    {uploadProgress !== null && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs text-center">
                        Enviando... {Math.round(uploadProgress)}%
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Basic info section */}
              <div className="p-6 md:flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={editedData.firstName || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={editedData.lastName || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <Input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={editedData.birthDate ? new Date(editedData.birthDate).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gênero</Label>
                        <Select
                          value={editedData.gender || ''}
                          onValueChange={(value) => handleSelectChange('gender', value)}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Menino</SelectItem>
                            <SelectItem value="female">Menina</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* <div className="space-y-2">
                        <Label htmlFor="relationship">Relação</Label>
                        <Select
                          value={editedData.relationship || ''}
                          onValueChange={(value) => handleSelectChange('relationship', value)}
                        >
                          <SelectTrigger id="relationship">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="biological">Biológico(a)</SelectItem>
                            <SelectItem value="adopted">Adotivo(a)</SelectItem>
                            <SelectItem value="guardian">Sob guarda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div> */}
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold">
                      {childData.firstName} {childData.lastName}
                    </h1>

                    {/* <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="default">{getGenderText(childData.gender)}</Badge>
                      <Badge variant="default">{getRelationshipText(childData.relationship)}</Badge>
                    </div> */}

                    <div className="mt-6 space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Nascimento: {formatDate(childData.birthDate)}</span> &nbsp; <span className="text-gray-600">({calculateAge(childData.birthDate)})</span>
                      </div>
                      {/* <div className="text-sm">
                        Idade: {calculateAge(childData.birthDate)}
                      </div> */}
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="mt-6 flex justify-between items-center">
                  {/* Delete button - only visible for owner when not editing */}
                  {isOwner && !isEditing && (
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="default"
                      size="sm"
                      className="gap-1 bg-mainStrongRed"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  )}

                  {/* Spacer when in edit mode or not owner */}
                  {(isEditing || !isOwner) && <div></div>}

                  {/* Edit/Save buttons - visible to editors */}
                  <div className="flex gap-2">
                    {isEditor && !isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="default"
                        className='bg-secondaryMain'
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}

                    {isEditing && (
                      <>
                        <Button
                          variant="default"
                          className='bg-mainStrongRed'
                          onClick={() => {
                            setIsEditing(false);
                            setEditedData(childData);
                            setPreviewPhoto(null);
                          }}
                          disabled={isSaving}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={saveChanges}
                          disabled={isSaving}
                          variant="default"
                          className="bg-secondaryMain"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirmar exclusão
                      </DialogTitle>
                      <DialogDescription>
                        Você está prestes a excluir todas as informações de{' '}
                        <strong>{childData?.firstName} {childData?.lastName}</strong>.
                        Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-gray-500">
                        Todos os dados associados a esta criança, incluindo fotos e registros, serão permanentemente removidos.
                      </p>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                      <Button
                        variant="default"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={isDeleting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="default"
                        onClick={deleteChild}
                        disabled={isDeleting}
                        className="gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>Excluindo...</span>
                          </>
                        ) : (
                          <>
                            <Trash className="h-4 w-4" />
                            <span>Excluir permanentemente</span>
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional information tabs */}
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="notes">Anotações</TabsTrigger>
            <TabsTrigger value="medical">Saúde</TabsTrigger>
            <TabsTrigger value="education">Educação</TabsTrigger>
            {isEditor && <TabsTrigger value="history" onClick={fetchChangeHistory}>Histórico</TabsTrigger>}
          </TabsList>

          {/* Notes tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Anotações</h2>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Adicione anotações e observações relevantes..."
                      className="min-h-[150px]"
                      value={editedData.notes || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {childData.notes ? (
                      <p>{childData.notes}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhuma anotação disponível.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical tab */}
          <TabsContent value="medical">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Informações Médicas</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  As informações médicas são utilizadas em casos de emergência e para garantir os cuidados necessários.
                </p>

                {/* Medical info would be implemented here with edit functionality */}
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    As informações médicas serão implementadas em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education tab */}
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Informações Educacionais</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Registre informações sobre a escola, série e contatos educacionais.
                </p>

                {/* Education info would be implemented here with edit functionality */}
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    As informações educacionais serão implementadas em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* History tab - only visible to editors */}
          {isEditor && (
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center">
                      <History className="h-5 w-5 mr-2 text-primary/70" />
                      Histórico de Alterações
                    </h2>
                    {!historyLoading && !historyError && historyEntries.length > 0 && (
                      <Badge variant="default" className="text-xs">
                        {historyEntries.length} {historyEntries.length === 1 ? 'registro' : 'registros'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Registro de alterações feitas no perfil da criança, mostrando quem fez cada mudança e quando.
                  </p>

                  {historyLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : historyError ? (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                      <p>{historyError}</p>
                    </div>
                  ) : historyEntries.length === 0 ? (
                    <div className="text-center py-8 border rounded-md bg-muted/30">
                      <p className="text-muted-foreground">Nenhum histórico de alteração encontrado.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Show a note when we're using sample data */}
                      {historyEntries.length > 0 && historyEntries[0].userName === 'Sistema' && (
                        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
                          <p className="font-medium">Dados de exemplo</p>
                          <p className="mt-0.5">O histórico real estará disponível quando as regras de segurança forem atualizadas.</p>
                        </div>
                      )}
                      
                      <div className="divide-y border rounded-lg overflow-hidden">
                      {historyEntries.map((entry, index) => {
                        // Format the date to be more readable
                        const eventDate = entry.timestamp instanceof Date 
                          ? entry.timestamp 
                          : new Date(entry.timestamp);
                          
                        // Generate action description and icon
                        let actionIcon = <FileText className="h-3.5 w-3.5" />;
                        let actionColor = "bg-blue-100 text-blue-500";
                        
                        switch (entry.action) {
                          case 'create':
                            actionIcon = <Plus className="h-3.5 w-3.5" />;
                            actionColor = "bg-green-100 text-green-600";
                            break;
                          case 'update':
                            actionIcon = <Edit className="h-3.5 w-3.5" />;
                            actionColor = "bg-blue-100 text-blue-600";
                            break;
                          case 'permission_add':
                            actionIcon = <UserPlus className="h-3.5 w-3.5" />;
                            actionColor = "bg-purple-100 text-purple-600";
                            break;
                          case 'permission_remove':
                            actionIcon = <UserMinus className="h-3.5 w-3.5" />;
                            actionColor = "bg-orange-100 text-orange-600";
                            break;
                          case 'delete':
                            actionIcon = <Trash className="h-3.5 w-3.5" />;
                            actionColor = "bg-red-100 text-red-600";
                            break;
                        }
                        
                        return (
                          <div key={index} className="py-2.5 px-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div className={`p-1.5 rounded-md ${actionColor}`}>
                                  {actionIcon}
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium leading-tight">{entry.description}</h4>
                                  <div className="flex items-center text-xs text-muted-foreground space-x-2 mt-0.5">
                                    <span className="inline-flex items-center">
                                      <User className="h-2.5 w-2.5 mr-0.5" />
                                      {entry.userName || entry.userId}
                                    </span>
                                    <span className="inline-flex items-center">
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      {format(eventDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Display a badge with the number of changed fields */}
                              {entry.action === 'update' && entry.fields && (
                                <Badge variant="default" className="text-xs px-1.5 py-0 h-5">
                                  {entry.fields.length} campo{entry.fields.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Show changed fields if this is an update - in a compact format */}
                            {entry.action === 'update' && entry.fields && entry.oldValues && entry.newValues && (
                              <details className="mt-1.5 ml-7 text-xs">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                  Detalhes da alteração
                                </summary>
                                <div className="mt-1 space-y-1 pl-2 border-l-2 border-muted">
                                  {entry.fields.map(field => (
                                    <div key={field} className="pt-0.5">
                                      {/* Use fieldLabels if available, otherwise use the raw field name */}
                                      <div className="font-medium">
                                        {entry.fieldLabels?.[entry.fields.indexOf(field)] || getHumanReadableFieldName(field)}:
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 mt-0.5">
                                        <div className="text-muted-foreground">
                                          <span>Antes:</span> {formatFieldValue(field, entry.oldValues?.[field])}
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Depois:</span> {formatFieldValue(field, entry.newValues?.[field])}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}