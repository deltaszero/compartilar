'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/userContext';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
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
import { Calendar, ChevronLeft, Camera, Edit, Save, Plus, Trash, AlertTriangle, History, Clock, User, FileText, UserPlus, UserMinus, Users, XCircle, Check, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Custom components
import HistoryList from './components/HistoryList';
import { fetchChangeHistory, createSampleHistory } from './components/HistoryUtils';
import { addUserAccess, removeUserAccess } from './components/PermissionUtils';
import { softDeleteDocument } from '@/lib/softDelete';
import { logChildAudit } from '@/lib/auditLogger';

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
  const [showEditorsDialog, setShowEditorsDialog] = useState(false);
  const [showViewersDialog, setShowViewersDialog] = useState(false);
  const [editedData, setEditedData] = useState<Partial<KidInfo>>({});
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // User search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userBeingRemoved, setUserBeingRemoved] = useState<string | null>(null);
  const [editorsList, setEditorsList] = useState<any[]>([]);
  const [viewersList, setViewersList] = useState<any[]>([]);
  
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
        console.log('Fetching child data for kid:', kid);
        
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
        
        console.log('Child data fetched:', {
          id: childInfo.id,
          firstName: childInfo.firstName,
          lastName: childInfo.lastName,
          editorsCount: childInfo.editors?.length || 0,
          viewersCount: childInfo.viewers?.length || 0,
          createdBy: childInfo.createdBy
        });
        
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
        
        // Set the permissions flags first so they're correctly set when fetching users
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

        // Always fetch user details for complete lists
        fetchUsersDetails(editors, viewers);

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
  
  // Fetch user details for editors and viewers
  const fetchUsersDetails = async (editorIds: string[], viewerIds: string[]) => {
    try {
      // Debug logging to track the process
      console.log('Fetching user details for:', {
        editorIds,
        viewerIds,
      });
      
      // Fetch all user details in parallel
      const fetchUserDetails = async (uid: string) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              uid,
              displayName: userData.displayName || userData.username,
              photoURL: userData.photoURL,
              username: userData.username,
            };
          }
          return { uid, displayName: 'Usuário desconhecido', username: 'unknown' };
        } catch (e) {
          console.error(`Error fetching user ${uid}:`, e);
          return { uid, displayName: 'Usuário desconhecido', username: 'unknown' };
        }
      };
      
      // Don't exclude current user - include all editors except the owner for visibility
      // We'll let the owner see all editors including themselves for clarity
      const allEditorsExceptCurrentUser = editorIds.filter(id => id !== user?.uid);
      
      const [editorsData, viewersData] = await Promise.all([
        Promise.all(allEditorsExceptCurrentUser.map(fetchUserDetails)),
        Promise.all(viewerIds.map(fetchUserDetails))
      ]);
      
      console.log('Fetched editors/viewers data:', {
        editorsCount: editorsData.length,
        viewersCount: viewersData.length
      });
      
      setEditorsList(editorsData);
      setViewersList(viewersData);
    } catch (error) {
      console.error('Error fetching users details:', error);
    }
  };
  
  // Handle searching for users to add as editors or viewers
  const handleUserSearch = async () => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const searchTermLower = searchTerm.toLowerCase().trim();
      const usersRef = collection(db, 'users');
      
      // Search by username (case insensitive)
      const usernameQuery = query(
        usersRef,
        where('username', '>=', searchTermLower),
        where('username', '<=', searchTermLower + '\uf8ff')
      );
      
      // Search by displayName (case insensitive)
      const displayNameQuery = query(
        usersRef,
        where('displayName', '>=', searchTermLower),
        where('displayName', '<=', searchTermLower + '\uf8ff')
      );
      
      // Execute both queries
      const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(displayNameQuery)
      ]);
      
      // Combine results and remove duplicates
      const results: any[] = [];
      const processedUids = new Set<string>();
      
      // Helper to process search results
      const processSnapshot = (snapshot: any) => {
        snapshot.forEach((doc: any) => {
          const userData = doc.data();
          
          // Skip the current user and already processed users
          if (userData.uid === user?.uid || processedUids.has(userData.uid)) {
            return;
          }
          
          // Skip users who are already editors or viewers
          const childEditors = childData?.editors || [];
          const childViewers = childData?.viewers || [];
          
          // Check both Firebase arrays and local state arrays to be extra safe
          if (childEditors.includes(userData.uid) || 
              childViewers.includes(userData.uid) ||
              editorsList.some(editor => editor.uid === userData.uid) ||
              viewersList.some(viewer => viewer.uid === userData.uid)) {
            return;
          }
          
          processedUids.add(userData.uid);
          results.push({
            uid: userData.uid,
            username: userData.username,
            displayName: userData.displayName || userData.username,
            photoURL: userData.photoURL
          });
        });
      };
      
      processSnapshot(usernameSnapshot);
      processSnapshot(displayNameSnapshot);
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na busca',
        description: 'Não foi possível carregar os resultados da busca.'
      });
    } finally {
      setIsSearching(false);
    }
  };

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

  // Wrapped permission functions
  const handleAddUserAccess = async (userId: string, role: 'editor' | 'viewer') => {
    if (!childData || !user || !isOwner) return;
    
    await addUserAccess(
      childData,
      userId,
      role,
      user,
      userData,
      setEditorsList,
      setViewersList,
      setChildData,
      setShowEditorsDialog,
      setShowViewersDialog,
      setSearchTerm,
      setSearchResults,
      () => fetchHistoryData()
    );
  };
  
  const handleRemoveUserAccess = async (userId: string, role: 'editor' | 'viewer') => {
    if (!childData || !user || !isOwner || userId === childData.createdBy) return;
    
    await removeUserAccess(
      childData,
      userId,
      role,
      user,
      userData,
      editorsList,
      viewersList,
      setEditorsList,
      setViewersList,
      setChildData,
      setUserBeingRemoved,
      () => fetchHistoryData()
    );
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
        
        // Log to global audit system
        await logChildAudit({
          userId: user.uid,
          userDisplayName: userData?.displayName || userData?.username,
          childId: childData.id,
          childName: `${childData.firstName} ${childData.lastName}`,
          action: 'update',
          details: {
            operation: 'update_child_data',
            fields: changedFields,
            oldValues: Object.fromEntries(
              changedFields.map(field => [field, childData[field as keyof typeof childData]])
            ),
            newValues: Object.fromEntries(
              changedFields.map(field => [field, cleanEditedData[field]])
            ),
            notes: `Updated ${changedFields.length} field(s) for child ${childData.firstName} ${childData.lastName}`
          }
        });
        
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
        fetchHistoryData();
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

  // Delete child (soft delete)
  const deleteChild = async () => {
    if (!childData?.id || !isOwner || !user?.uid) return;

    setIsDeleting(true);
    try {
      // Get reference to the child document
      const childRef = doc(db, 'children', childData.id);
      const childName = `${childData.firstName} ${childData.lastName}`;
      
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
          description: `Excluiu o registro de ${childName}`
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

      // Handle the photo - we don't delete it immediately to allow for recovery
      let photoInfo = null;
      if (childData.photoURL && storage) {
        try {
          photoInfo = {
            url: childData.photoURL,
            path: decodeURIComponent(childData.photoURL.split('/o/')[1].split('?')[0])
          };
        } catch (photoError) {
          console.error('Error processing photo info:', photoError);
        }
      }

      // Preserve the current editors and viewers list which are needed for security rules validation
      console.log('Starting soft delete process for child document with ID:', childData.id);
      console.log('Using updated softDeleteDocument with proper editors/viewers handling');
      
      // Use soft delete instead of permanent deletion
      const success = await softDeleteDocument(
        'children',
        childData.id,
        user.uid,
        userData?.displayName || userData?.username,
        'User requested deletion', // Reason for deletion
        childName
      );
      
      if (!success) {
        throw new Error('Soft delete operation returned failure status');
      }
      
      // Try to add extra audit log, but don't let it block the main flow if it fails
      try {
        await logChildAudit({
          userId: user.uid,
          userDisplayName: userData?.displayName || userData?.username,
          childId: childData.id,
          childName: childName,
          action: 'soft_delete',
          details: {
            operation: 'soft_delete_child',
            fields: ['isDeleted'],
            oldValues: { isDeleted: false },
            newValues: { 
              isDeleted: true,
              photoInfo: photoInfo
            },
            notes: `User soft-deleted child record for ${childName}`
          }
        });
      } catch (auditError) {
        // Just log the error but continue with the main flow
        console.error('Error logging child audit (expected if permissions are restricted):', auditError);
      }

      // Always show success message and redirect, even if some parts failed
      toast({
        title: 'Criança removida',
        description: 'Os dados foram excluídos com sucesso!'
      });

      // Navigate back to the children list
      router.push(`/${username}/criancas`);
    } catch (error) {
      console.error('Error deleting child:', error);
      
      // Provide more specific error message if possible
      let errorMessage = 'Não foi possível excluir a criança. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('insufficient')) {
          errorMessage = 'Você não tem permissão para excluir esta criança.';
        }
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: errorMessage
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
  
  // Wrapper for fetchChangeHistory
  const fetchHistoryData = () => {
    fetchChangeHistory(
      kid as string,
      user,
      userData,
      isEditor,
      childData,
      setHistoryLoading,
      setHistoryError,
      setHistoryEntries
    );
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
          className="inline-flex items-center text-sm text-gray-400 hover:text-foreground mb-6"
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
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold">
                      {childData.firstName} {childData.lastName}
                    </h1>

                    <div className="mt-6 space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Nascimento: {formatDate(childData.birthDate)}</span> &nbsp; <span className="text-gray-600">({calculateAge(childData.birthDate)})</span>
                      </div>
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
                
                {/* Editors Dialog */}
                <Dialog open={showEditorsDialog} onOpenChange={setShowEditorsDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Gerenciar Editores
                      </DialogTitle>
                      <DialogDescription>
                        Editores podem modificar todas as informações desta criança.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {/* Search for users */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Buscar por nome ou username..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleUserSearch}
                        disabled={searchTerm.length < 3 || isSearching}
                      >
                        {isSearching ? (
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Current editors list */}
                    {editorsList.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Editores atuais:</h4>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {editorsList.map(editor => (
                            <div 
                              key={editor.uid}
                              className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {editor.photoURL ? (
                                    <Image
                                      src={editor.photoURL}
                                      alt={editor.displayName}
                                      width={32}
                                      height={32}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {editor.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{editor.displayName}</p>
                                  <p className="text-xs text-gray-400">@{editor.username}</p>
                                </div>
                              </div>
                              
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRemoveUserAccess(editor.uid, 'editor')}
                                disabled={userBeingRemoved === editor.uid}
                              >
                                {userBeingRemoved === editor.uid ? (
                                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Resultados da busca:</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {searchResults.map(user => (
                            <div 
                              key={user.uid}
                              className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {user.photoURL ? (
                                    <Image
                                      src={user.photoURL}
                                      alt={user.displayName}
                                      width={32}
                                      height={32}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {user.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{user.displayName}</p>
                                  <p className="text-xs text-gray-400">@{user.username}</p>
                                </div>
                              </div>
                              
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-secondaryMain"
                                onClick={() => handleAddUserAccess(user.uid, 'editor')}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchTerm.length > 0 && searchResults.length === 0 && !isSearching && (
                      <div className="mt-4 text-center py-4 text-gray-400">
                        Nenhum resultado encontrado
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button
                        variant="default"
                        onClick={() => {
                          setShowEditorsDialog(false);
                          setSearchTerm('');
                          setSearchResults([]);
                        }}
                      >
                        Concluído
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Viewers Dialog */}
                <Dialog open={showViewersDialog} onOpenChange={setShowViewersDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Gerenciar Visualizadores
                      </DialogTitle>
                      <DialogDescription>
                        Visualizadores podem ver as informações desta criança, mas não podem fazer alterações.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {/* Search for users */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Buscar por nome ou username..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleUserSearch}
                        disabled={searchTerm.length < 3 || isSearching}
                      >
                        {isSearching ? (
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Current viewers list */}
                    {viewersList.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Visualizadores atuais:</h4>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto">
                          {viewersList.map(viewer => (
                            <div 
                              key={viewer.uid}
                              className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {viewer.photoURL ? (
                                    <Image
                                      src={viewer.photoURL}
                                      alt={viewer.displayName}
                                      width={32}
                                      height={32}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {viewer.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{viewer.displayName}</p>
                                  <p className="text-xs text-gray-400">@{viewer.username}</p>
                                </div>
                              </div>
                              
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRemoveUserAccess(viewer.uid, 'viewer')}
                                disabled={userBeingRemoved === viewer.uid}
                              >
                                {userBeingRemoved === viewer.uid ? (
                                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Resultados da busca:</h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {searchResults.map(user => (
                            <div 
                              key={user.uid}
                              className="flex items-center justify-between bg-muted/30 p-2 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {user.photoURL ? (
                                    <Image
                                      src={user.photoURL}
                                      alt={user.displayName}
                                      width={32}
                                      height={32}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {user.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{user.displayName}</p>
                                  <p className="text-xs text-gray-400">@{user.username}</p>
                                </div>
                              </div>
                              
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-secondaryMain"
                                onClick={() => handleAddUserAccess(user.uid, 'viewer')}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {searchTerm.length > 0 && searchResults.length === 0 && !isSearching && (
                      <div className="mt-4 text-center py-4 text-gray-400">
                        Nenhum resultado encontrado
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button
                        variant="default"
                        onClick={() => {
                          setShowViewersDialog(false);
                          setSearchTerm('');
                          setSearchResults([]);
                        }}
                      >
                        Concluído
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
            {isEditor && <TabsTrigger value="history" onClick={fetchHistoryData}>Histórico</TabsTrigger>}
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
                      <p className="text-gray-400 italic">
                        Nenhuma anotação disponível.
                      </p>
                    )}
                  </div>
                )}

                {/* Access permissions section - only visible to owner and not in edit mode */}
                {isOwner && !isEditing && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-lg font-medium mb-4">Pessoas com acesso</h3>
                    
                    {/* Editors section */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold flex items-center">
                          <UserPlus className="h-4 w-4 mr-1 text-primary/70" />
                          Editores
                        </h4>
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => setShowEditorsDialog(true)}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      
                                      {childData.editors && childData.editors.length > 1 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Show the current user first as the owner/creator */}
                          {user && childData.createdBy === user.uid && (
                            <div
                              className="flex items-center justify-between bg-muted/20 p-2 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {userData?.photoURL ? (
                                    <Image
                                      src={userData.photoURL}
                                      alt={userData.displayName || userData.username}
                                      width={24}
                                      height={24}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {(userData?.displayName || userData?.username || '').charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="flex items-center gap-1">
                                  {userData?.displayName || userData?.username}
                                  <Badge variant="default" className="ml-1 text-[10px] py-0 h-4">
                                    Proprietário
                                  </Badge>
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Then show other editors */}
                          {editorsList.map(editor => (
                            <div
                              key={editor.uid}
                              className="flex items-center justify-between bg-muted/20 p-2 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {editor.photoURL ? (
                                    <Image
                                      src={editor.photoURL}
                                      alt={editor.displayName}
                                      width={24}
                                      height={24}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {editor.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span>{editor.displayName}</span>
                              </div>
                              
                              <Button
                                variant="default"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveUserAccess(editor.uid, 'editor')}
                                disabled={userBeingRemoved === editor.uid}
                              >
                                {userBeingRemoved === editor.uid ? (
                                  <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-gray-400 hover:text-destructive" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          Somente você tem permissão para editar
                        </p>
                      )}
                    </div>
                    
                    {/* Viewers section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold flex items-center">
                          <Users className="h-4 w-4 mr-1 text-primary/70" />
                          Visualizadores
                        </h4>
                        <Button 
                          variant="default"
                          size="sm"
                          onClick={() => setShowViewersDialog(true)}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      
                      {viewersList.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {viewersList.map(viewer => (
                            <div
                              key={viewer.uid}
                              className="flex items-center justify-between bg-muted/20 p-2 rounded-md text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                  {viewer.photoURL ? (
                                    <Image
                                      src={viewer.photoURL}
                                      alt={viewer.displayName}
                                      width={24}
                                      height={24}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {viewer.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span>{viewer.displayName}</span>
                              </div>
                              
                              <Button
                                variant="default"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleRemoveUserAccess(viewer.uid, 'viewer')}
                                disabled={userBeingRemoved === viewer.uid}
                              >
                                {userBeingRemoved === viewer.uid ? (
                                  <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-gray-400 hover:text-destructive" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          Nenhum visualizador adicionado
                        </p>
                      )}
                    </div>
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
                <p className="text-gray-400 mb-4">
                  As informações médicas são utilizadas em casos de emergência e para garantir os cuidados necessários.
                </p>

                {/* Medical info would be implemented here with edit functionality */}
                <div className="text-center py-4">
                  <p className="text-gray-400">
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
                <p className="text-gray-400 mb-4">
                  Registre informações sobre a escola, série e contatos educacionais.
                </p>

                {/* Education info would be implemented here with edit functionality */}
                <div className="text-center py-4">
                  <p className="text-gray-400">
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
                  <p className="text-gray-400 mb-3 text-sm">
                    Registro de alterações feitas no perfil da criança, mostrando quem fez cada mudança e quando.
                  </p>

                  <HistoryList 
                    historyEntries={historyEntries}
                    historyLoading={historyLoading}
                    historyError={historyError}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}