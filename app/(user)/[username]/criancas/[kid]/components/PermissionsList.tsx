'use client';
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, UserPlus, Trash, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KidInfo } from '../../types';
import { 
  fetchChildData, 
  searchUsers, 
  addUserAccess, 
  removeUserAccess,
  fetchUsersDetails
} from '../services/child-api';

interface UserInfo {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
}

interface PermissionsListProps {
  childId: string;
  user: User | null;
  isOwner: boolean;
}

export function PermissionsList({ childId, user, isOwner }: PermissionsListProps) {
  // State for permissions data
  const [childData, setChildData] = useState<KidInfo | null>(null);
  const [editorsList, setEditorsList] = useState<UserInfo[]>([]);
  const [viewersList, setViewersList] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for user search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [userBeingRemoved, setUserBeingRemoved] = useState<string | null>(null);
  const [accessType, setAccessType] = useState<'editor' | 'viewer'>('viewer');

  // Load child data and permissions
  const loadPermissionsData = async () => {
    if (!user || !childId) {
      setIsLoading(false);
      setError('É necessário estar autenticado para ver as permissões');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get fresh token
      const token = await user.getIdToken(true);

      // Fetch child data
      const data = await fetchChildData(childId, token);
      setChildData(data);

      // Extract editors and viewers from child data
      const editors = data.editors || [];
      const viewers = data.viewers || [];

      // Fetch user details if there are any editors or viewers
      if (editors.length > 0) {
        const editorsDetails = await fetchUsersDetails(editors, token);
        setEditorsList(editorsDetails);
      } else {
        setEditorsList([]);
      }

      if (viewers.length > 0) {
        const viewersDetails = await fetchUsersDetails(viewers, token);
        setViewersList(viewersDetails);
      } else {
        setViewersList([]);
      }

    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError('Não foi possível carregar as permissões');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar as permissões. Tente novamente mais tarde.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Search for users to add
  const handleUserSearch = async () => {
    if (!user || searchTerm.length < 3) {
      toast({
        title: 'Termo muito curto',
        description: 'Digite pelo menos 3 caracteres para buscar'
      });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Get fresh token
      const token = await user.getIdToken(true);

      // Search for users
      const results = await searchUsers(searchTerm, token);
      
      // Filter out current user and users already with access
      const filteredResults = results.filter((userData: UserInfo) => {
        // Skip current user
        if (userData.id === user.uid) {
          return false;
        }

        // Skip users who are already editors or viewers
        const currentEditors = childData?.editors || [];
        const currentViewers = childData?.viewers || [];

        return !(
          currentEditors.includes(userData.id) ||
          currentViewers.includes(userData.id)
        );
      });

      setSearchResults(filteredResults);

      if (filteredResults.length === 0) {
        toast({
          title: 'Nenhum resultado',
          description: 'Nenhum usuário encontrado com este termo'
        });
      }
    } catch (err) {
      console.error('Error searching users:', err);
      toast({
        variant: 'destructive',
        title: 'Erro na busca',
        description: 'Não foi possível realizar a busca. Tente novamente mais tarde.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add user access
  const handleAddUserAccess = async (userId: string, type: 'editor' | 'viewer') => {
    if (!user || !childId) return;

    try {
      // Get fresh token
      const token = await user.getIdToken(true);

      // Add access
      await addUserAccess(childId, userId, type, token);

      // Get user details
      const userData = searchResults.find(u => u.id === userId);

      // Update local state based on role
      if (type === 'editor' && userData) {
        setEditorsList(prev => [...prev, userData]);
      } else if (userData) {
        setViewersList(prev => [...prev, userData]);
      }

      // Close dialog and reset search
      setShowSearchDialog(false);
      setSearchTerm('');
      setSearchResults([]);
      
      // Show success message
      toast({
        title: 'Acesso adicionado',
        description: `Usuário agora tem acesso como ${type === 'editor' ? 'editor' : 'visualizador'}.`
      });

      // Refresh data
      loadPermissionsData();
    } catch (err) {
      console.error('Error adding user access:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível adicionar acesso ao usuário. Tente novamente mais tarde.'
      });
    }
  };

  // Remove user access
  const handleRemoveUserAccess = async (userId: string, type: 'editor' | 'viewer') => {
    if (!user || !childId || userId === childData?.createdBy || userId === childData?.owner) return;

    try {
      // Get fresh token
      const token = await user.getIdToken(true);

      // Remove access
      await removeUserAccess(childId, userId, type, token);

      // Update local state
      if (type === 'editor') {
        setEditorsList(prev => prev.filter(editor => editor.id !== userId));
      } else {
        setViewersList(prev => prev.filter(viewer => viewer.id !== userId));
      }

      // Show success message
      toast({
        title: 'Acesso removido',
        description: `Usuário não tem mais acesso como ${type === 'editor' ? 'editor' : 'visualizador'}.`
      });

      // Reset state
      setUserBeingRemoved(null);
    } catch (err) {
      console.error('Error removing user access:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover o acesso do usuário. Tente novamente mais tarde.'
      });
    } finally {
      setUserBeingRemoved(null);
    }
  };

  // Load permissions data on component mount
  useEffect(() => {
    loadPermissionsData();
  }, [childId, user]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Carregando permissões...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadPermissionsData} variant="neutral" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
        <h3 className="font-medium">Permissões de Acesso</h3>
        {isOwner && (
          <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
            <DialogTrigger asChild>
              <Button variant="neutral" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar acesso a usuário</DialogTitle>
              </DialogHeader>
              <div className="flex items-center space-x-2 mt-4">
                <div className="grid flex-1 gap-2">
                  <Input
                    placeholder="Buscar por nome ou email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    disabled={isSearching}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      variant={accessType === 'viewer' ? 'default' : 'neutral'} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setAccessType('viewer')}
                    >
                      Visualizador
                    </Button>
                    <Button 
                      variant={accessType === 'editor' ? 'default' : 'neutral'} 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setAccessType('editor')}
                    >
                      Editor
                    </Button>
                  </div>
                </div>
                <Button onClick={handleUserSearch} disabled={isSearching || searchTerm.length < 3}>
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {result.photoURL ? (
                            <AvatarImage src={result.photoURL} alt={result.displayName || 'Usuário'} />
                          ) : (
                            <AvatarFallback>
                              {result.displayName 
                                ? result.displayName.charAt(0).toUpperCase() 
                                : (result.email ? result.email.charAt(0).toUpperCase() : 'U')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{result.displayName || 'Usuário'}</p>
                          {result.email && (
                            <p className="text-xs text-gray-500">{result.email}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAddUserAccess(result.id, accessType)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="p-4">
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3">Editores ({editorsList.length})</h4>
          {editorsList.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum editor adicional.</p>
          ) : (
            <div className="space-y-3">
              {editorsList.map((editor) => (
                <div key={editor.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      {editor.photoURL ? (
                        <AvatarImage src={editor.photoURL} alt={editor.displayName || 'Editor'} />
                      ) : (
                        <AvatarFallback>
                          {editor.displayName 
                            ? editor.displayName.charAt(0).toUpperCase() 
                            : (editor.email ? editor.email.charAt(0).toUpperCase() : 'E')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{editor.displayName || 'Usuário'}</p>
                      {editor.email && (
                        <p className="text-xs text-gray-500">{editor.email}</p>
                      )}
                    </div>
                  </div>
                  {isOwner && editor.id !== childData?.createdBy && editor.id !== childData?.owner && (
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => handleRemoveUserAccess(editor.id, 'editor')}
                      disabled={userBeingRemoved === editor.id}
                    >
                      {userBeingRemoved === editor.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Visualizadores ({viewersList.length})</h4>
          {viewersList.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum visualizador adicional.</p>
          ) : (
            <div className="space-y-3">
              {viewersList.map((viewer) => (
                <div key={viewer.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      {viewer.photoURL ? (
                        <AvatarImage src={viewer.photoURL} alt={viewer.displayName || 'Visualizador'} />
                      ) : (
                        <AvatarFallback>
                          {viewer.displayName 
                            ? viewer.displayName.charAt(0).toUpperCase() 
                            : (viewer.email ? viewer.email.charAt(0).toUpperCase() : 'V')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{viewer.displayName || 'Usuário'}</p>
                      {viewer.email && (
                        <p className="text-xs text-gray-500">{viewer.email}</p>
                      )}
                    </div>
                  </div>
                  {isOwner && viewer.id !== childData?.createdBy && viewer.id !== childData?.owner && (
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={() => handleRemoveUserAccess(viewer.id, 'viewer')}
                      disabled={userBeingRemoved === viewer.id}
                    >
                      {userBeingRemoved === viewer.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}