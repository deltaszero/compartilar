'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { toast } from '@/hooks/use-toast';
import { KidInfo } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LoadingPage from '@/app/components/LoadingPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash, History, Users } from 'lucide-react';
import { ChangeHistoryEntry } from '@/lib/firebaseConfig';
import Link from 'next/link';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";

// Custom components
import { 
  ChildHeaderSection, 
  ChildPhotoUpload, 
  ChildInfoForm, 
  AccessControl, 
  DeleteConfirmDialog 
} from './components/profile';
import HistoryList from './components/HistoryList';
import { createSampleHistory } from './components/HistoryUtils';

// API services
import {
  fetchChildData,
  updateChildData,
  deleteChild,
  fetchChildHistory,
  fetchUsersDetails,
  searchUsers,
  addUserAccess as apiAddUserAccess,
  removeUserAccess as apiRemoveUserAccess
} from './services/child-api';

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
        const loadChildData = async () => {
            if (!user || !userData) {
                router.push('/login');
                return;
            }

            try {
                setIsLoading(true);
                
                // Get auth token
                const token = await user.getIdToken(true);
                
                // Fetch child data using API service
                const childInfo = await fetchChildData(kid as string, token);

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

                // Determine access level
                const editors = childInfo.editors || [];
                const viewers = childInfo.viewers || [];
                
                // Check if user is the owner/creator
                if (childInfo.createdBy === user.uid || childInfo.owner === user.uid) {
                    setIsOwner(true);
                    setIsEditor(true); // Owner automatically has editor permissions
                }
                // Check if user is an editor but not owner
                else if (editors.includes(user.uid)) {
                    setIsEditor(true);
                }

                // Always fetch user details for complete lists
                if (editors.length > 0 || viewers.length > 0) {
                    try {
                        const editorDetails = await fetchUsersDetails(editors, token);
                        const viewerDetails = await fetchUsersDetails(viewers, token);
                        
                        setEditorsList(editorDetails);
                        setViewersList(viewerDetails);
                    } catch (error) {
                        console.error('Error fetching users details:', error);
                    }
                }

                setIsLoading(false);
                
                // The history data will be loaded by the useEffect hook
            } catch (error) {
                console.error('Error fetching child data:', error);
                
                if (error instanceof Error) {
                    if (error.message === 'child_not_found') {
                        toast({
                            variant: 'destructive',
                            title: 'Criança não encontrada',
                            description: 'Os dados solicitados não existem.'
                        });
                    } else if (error.message === 'access_denied') {
                        toast({
                            variant: 'destructive',
                            title: 'Acesso negado',
                            description: 'Você não tem permissão para ver esta informação.'
                        });
                        router.push(`/${username}/home`);
                        return;
                    } else {
                        toast({
                            variant: 'destructive',
                            title: 'Erro',
                            description: 'Ocorreu um erro ao carregar os dados. Tente novamente.'
                        });
                    }
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Erro',
                        description: 'Ocorreu um erro ao carregar os dados. Tente novamente.'
                    });
                }
                
                router.push(`/${username}/criancas`);
            }
        };

        if (!loading) {
            loadChildData();
        }
    }, [user, userData, kid, username, router, loading]);
    
    // Fetch history data via API - memoize to prevent infinite re-renders
    const fetchHistoryData = useCallback(async () => {
        if (!user || !childData?.id) {
            console.log('Cannot fetch history: no user or child ID', { user: !!user, childId: childData?.id });
            return;
        }
        
        setHistoryLoading(true);
        setHistoryError(null);
        
        try {
            console.log('Fetching history data for child:', childData.id);
            
            // Get fresh token
            const token = await user.getIdToken(true);
            
            // Fetch history entries using API service
            const historyData = await fetchChildHistory(childData.id, token);
            console.log('History data received:', { count: historyData?.length || 0 });
            
            if (!historyData || historyData.length === 0) {
                console.log('No history entries found');
                setHistoryEntries([]);
                setHistoryLoading(false);
                return;
            }
            
            // Format and sort entries
            const formattedHistory = historyData.map((entry: any) => ({
                ...entry,
                timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date()
            }));
            
            // Sort by timestamp (newest first)
            formattedHistory.sort((a: ChangeHistoryEntry, b: ChangeHistoryEntry) => {
                return b.timestamp.getTime() - a.timestamp.getTime();
            });
            
            console.log('Processed history entries:', formattedHistory.length);
            setHistoryEntries(formattedHistory);
        } catch (error) {
            console.error('Error fetching history:', error);
            setHistoryError('Não foi possível carregar o histórico de alterações');
        } finally {
            setHistoryLoading(false);
        }
    }, [user, childData]);
    
    // Fetch history data when childData changes
    useEffect(() => {
        if (childData?.id && user) {
            console.log('Child data changed, fetching history data');
            fetchHistoryData();
        }
    }, [childData?.id, user, fetchHistoryData]);

    // Handle input changes for form fields
    const handleInputChange = (name: string, value: string) => {
        setEditedData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle searching for users to add as editors or viewers 
    const handleUserSearch = async (term: string) => {
        console.log(`Searching users with term: "${term}"`);
        
        if (!term || term.length < 3) {
            toast({
                title: 'Termo muito curto',
                description: 'Digite pelo menos 3 caracteres para buscar'
            });
            return;
        }

        setIsSearching(true);
        setSearchResults([]);

        try {
            // Get auth token
            const token = await user?.getIdToken(true);
            if (!token) {
                throw new Error('User not authenticated');
            }
            
            console.log('Calling user search API');
            // Search users via API
            const results = await searchUsers(term, token);
            console.log('Search results:', results);
            
            // Filter out current user and users already with access
            const filteredResults = results.filter((userData: any) => {
                // Skip the current user
                if (userData.id === user?.uid) {
                    console.log(`Filtering out current user: ${userData.id}`);
                    return false;
                }
                
                // Skip users who are already editors or viewers
                const childEditors = childData?.editors || [];
                const childViewers = childData?.viewers || [];
                
                // Check both arrays to be extra safe
                if (childEditors.includes(userData.id) ||
                    childViewers.includes(userData.id) ||
                    editorsList.some(editor => editor.id === userData.id) ||
                    viewersList.some(viewer => viewer.id === userData.id)) {
                    console.log(`Filtering out user already with access: ${userData.id}`);
                    return false;
                }
                
                return true;
            });

            console.log('Filtered results:', filteredResults);
            setSearchResults(filteredResults);
            
            if (filteredResults.length === 0) {
                toast({
                    title: 'Nenhum resultado',
                    description: 'Nenhum usuário encontrado com este termo'
                });
            }
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

    // Handle adding user access via API
    const handleAddUserAccess = async (userId: string, type: 'editor' | 'viewer') => {
        if (!childData || !user || !isOwner) return;
        
        try {
            // Get fresh auth token
            const token = await user.getIdToken(true);
            
            // Add user access using API service
            await apiAddUserAccess(childData.id, userId, type, token);
            
            // Get user details for UI update
            const userData = searchResults.find(user => user.id === userId);
            
            // Update local state based on role
            if (type === 'editor') {
                // Add to editors list
                if (userData) {
                    setEditorsList(prev => [...prev, userData]);
                }
                
                // Update child data
                setChildData(prev => {
                    if (!prev) return prev;
                    
                    return {
                        ...prev,
                        editors: [...(prev.editors || []), userId]
                    };
                });
            } else {
                // Add to viewers list
                if (userData) {
                    setViewersList(prev => [...prev, userData]);
                }
                
                // Update child data
                setChildData(prev => {
                    if (!prev) return prev;
                    
                    return {
                        ...prev,
                        viewers: [...(prev.viewers || []), userId]
                    };
                });
            }
            
            // Reset search
            setSearchTerm('');
            setSearchResults([]);
            
            // Close dialogs
            setShowEditorsDialog(false);
            setShowViewersDialog(false);
            
            // Show success message
            toast({
                title: 'Acesso adicionado',
                description: `Usuário agora tem acesso como ${type === 'editor' ? 'editor' : 'visualizador'}.`
            });
            
        } catch (error) {
            console.error('Error adding user access:', error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao adicionar acesso ao usuário'
            });
        }
    };

    // Handle removing user access via API
    const handleRemoveUserAccess = async (userId: string, type: 'editor' | 'viewer') => {
        if (!childData || !user || !isOwner || userId === childData.createdBy) return;
        
        try {
            // Get fresh auth token
            const token = await user.getIdToken(true);
            
            // Remove user access using API service
            await apiRemoveUserAccess(childData.id, userId, type, token);
            
            // Update local state based on role
            if (type === 'editor') {
                // Remove from editors list
                setEditorsList(prev => prev.filter(editor => editor.id !== userId));
                
                // Update child data
                setChildData(prev => {
                    if (!prev) return prev;
                    
                    return {
                        ...prev,
                        editors: (prev.editors || []).filter(id => id !== userId)
                    };
                });
            } else {
                // Remove from viewers list
                setViewersList(prev => prev.filter(viewer => viewer.id !== userId));
                
                // Update child data
                setChildData(prev => {
                    if (!prev) return prev;
                    
                    return {
                        ...prev,
                        viewers: (prev.viewers || []).filter(id => id !== userId)
                    };
                });
            }
            
            // Show success message
            toast({
                title: 'Acesso removido',
                description: `Usuário não tem mais acesso como ${type === 'editor' ? 'editor' : 'visualizador'}.`
            });
            
            // Refresh history
            fetchHistoryData();
            
        } catch (error) {
            console.error('Error removing user access:', error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: error instanceof Error ? error.message : 'Erro ao remover acesso do usuário'
            });
        } finally {
            setUserBeingRemoved(null);
        }
    };

    // Save changes using API
    const handleSaveChanges = async () => {
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

            // Get the edited data without any undefined or empty fields
            const cleanEditedData = Object.entries(editedData).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, any>);

            // Get fresh auth token
            const token = await user.getIdToken(true);
            
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
            
            // Create a description for the history log
            const humanReadableFields = changedFields.map(field =>
                fieldNameMapping[field] || field
            );
            
            const readableDescription = `Atualizou ${humanReadableFields.length === 1
                ? humanReadableFields[0]
                : `${humanReadableFields.length} campos: ${humanReadableFields.join(', ')}`}`;

            // Create history entry
            const historyEntry = {
                action: 'update',
                fields: changedFields,
                description: readableDescription
            };
            
            // Use API service to update child data
            await updateChildData(childData.id, cleanEditedData, historyEntry, token);
            
            // Update the local state to reflect the changes
            setChildData({...childData, ...cleanEditedData} as KidInfo);
            setIsEditing(false);
            
            toast({
                title: 'Dados salvos',
                description: 'As informações foram atualizadas com sucesso!'
            });
            
            // Refresh the history data
            fetchHistoryData();
        } catch (error) {
            console.error('Error saving changes:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: error instanceof Error ? error.message : 'Ocorreu um erro ao salvar. Tente novamente.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Delete child (soft delete) using API
    const handleDeleteChild = async () => {
        if (!childData?.id || !isOwner || !user?.uid) return;

        setIsDeleting(true);
        try {
            const childName = `${childData.firstName} ${childData.lastName}`;
            
            // Get fresh auth token
            const token = await user.getIdToken(true);
            
            // First add a history entry for the deletion
            const historyEntry = {
                action: 'delete',
                fields: ['entire_record'],
                description: `Excluiu o registro de ${childName}`
            };
            
            // Use API service to delete the child
            await deleteChild(childData.id, token);
            
            // Show success message
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
                errorMessage = error.message;
                
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
            
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return `${age} ${age === 1 ? 'ano' : 'anos'}`;
        } catch (e) {
            return 'Idade indisponível';
        }
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    if (!childData) {
        return (
            <div className="flex flex-col min-h-screen">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-6">
                        <h2 className="text-2xl font-bold text-destructive mb-4">
                            Criança não encontrada
                        </h2>
                        <p className="mb-6">
                            Os dados solicitados não existem ou foram removidos.
                        </p>
                        <Link href={`/${username}/criancas`}>
                            <Button>
                                Voltar para Crianças
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
        <UserProfileBar pathname='Perfil de Criança' />
        <div className="p-4 max-w-4xl mx-auto">
            {/* Header with back link and title */}
            {/* <ChildHeaderSection
                username={username as string}
                childName={`${childData.firstName} ${childData.lastName}`}
            /> */}
            
            {/* Photo Upload Component */}
            <ChildPhotoUpload
                childId={kid as string}
                photoUrl={childData?.photoURL}
                previewUrl={previewPhoto}
                isEditing={isEditing}
                isOwnerOrEditor={isOwner || isEditor}
                onPhotoChange={(url) => setEditedData(prev => ({ ...prev, photoURL: url }))}
                onPreviewChange={setPreviewPhoto}
                onProgressChange={setUploadProgress}
            />
            
            {/* Child Info Form */}
            <ChildInfoForm
                childData={childData}
                editedData={editedData}
                isEditing={isEditing}
                isOwnerOrEditor={isOwner || isEditor}
                isSaving={isSaving}
                uploadProgress={uploadProgress}
                onEditToggle={() => {
                    if (isEditing) {
                        setIsEditing(false);
                        setEditedData(childData as KidInfo);
                        setPreviewPhoto(null);
                    } else {
                        setIsEditing(true);
                    }
                }}
                onSave={handleSaveChanges}
                onInputChange={handleInputChange}
            />
            
            {/* Tabs for History and Access Control */}
            <Tabs 
                defaultValue="history" 
                className="mt-6"
                onValueChange={(value) => {
                    if (value === "history") {
                        // Refresh history data when this tab is activated
                        fetchHistoryData();
                    }
                }}
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history">
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                    </TabsTrigger>
                    <TabsTrigger value="access" disabled={!isOwner}>
                        <Users className="h-4 w-4 mr-2" />
                        Gerenciar Acesso
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="history" className="mt-4">
                    <HistoryList
                        entries={historyEntries}
                        isLoading={historyLoading}
                        error={historyError}
                        noDataMessage="Nenhuma alteração registrada ainda"
                        onRefresh={fetchHistoryData}
                    />
                </TabsContent>
                
                <TabsContent value="access" className="mt-4">
                    <AccessControl
                        childId={childData.id}
                        user={user}
                        isOwner={isOwner}
                        editorsList={editorsList}
                        viewersList={viewersList}
                        onSearch={handleUserSearch}
                        onAddAccess={handleAddUserAccess}
                        onRemoveAccess={handleRemoveUserAccess}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        searchResults={searchResults}
                        isSearching={isSearching}
                        userBeingRemoved={userBeingRemoved}
                        setUserBeingRemoved={setUserBeingRemoved}
                        showEditorsDialog={showEditorsDialog}
                        setShowEditorsDialog={setShowEditorsDialog}
                        showViewersDialog={showViewersDialog}
                        setShowViewersDialog={setShowViewersDialog}
                    />
                </TabsContent>
            </Tabs>
            
            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={showDeleteDialog}
                isDeleting={isDeleting}
                childName={`${childData.firstName} ${childData.lastName}`}
                onOpenChange={setShowDeleteDialog}
                onDelete={handleDeleteChild}
            />
        </div>
    </div>
    );
}