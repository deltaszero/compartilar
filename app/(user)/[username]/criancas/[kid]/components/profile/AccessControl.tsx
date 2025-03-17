import { useState } from 'react';
import { Users, Search, UserPlus, UserMinus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KidInfo } from '../../../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccessControlProps {
  childId: string;
  user: any;
  isOwner: boolean;
  editorsList: any[];
  viewersList: any[];
  onSearch: (term: string) => void;
  onAddAccess: (userId: string, type: 'editor' | 'viewer') => Promise<void>;
  onRemoveAccess: (userId: string, type: 'editor' | 'viewer') => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: any[];
  isSearching: boolean;
  userBeingRemoved: string | null;
  setUserBeingRemoved: (userId: string | null) => void;
  showEditorsDialog: boolean;
  setShowEditorsDialog: (show: boolean) => void;
  showViewersDialog: boolean;
  setShowViewersDialog: (show: boolean) => void;
}

export function AccessControl({
  childId,
  user,
  isOwner,
  editorsList,
  viewersList,
  onSearch,
  onAddAccess,
  onRemoveAccess,
  searchTerm,
  setSearchTerm,
  searchResults,
  isSearching,
  userBeingRemoved,
  setUserBeingRemoved,
  showEditorsDialog,
  setShowEditorsDialog,
  showViewersDialog,
  setShowViewersDialog
}: AccessControlProps) {
  
  const handleSearch = () => {
    // Always call onSearch - it will handle validation
    onSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="mt-6 space-y-6">

      {isOwner && (
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="default" 
            onClick={() => setShowEditorsDialog(true)}
            type="button"
          >
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Editores
          </Button>
          
          <Button 
            variant="default" 
            onClick={() => setShowViewersDialog(true)}
            type="button"
          >
            <Users className="h-4 w-4 mr-2" />
            Gerenciar Visualizadores
          </Button>
        </div>
      )}

      {/* Editors Dialog */}
      <Dialog open={showEditorsDialog} onOpenChange={setShowEditorsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Editores</DialogTitle>
            <DialogDescription>
              Editores podem modificar as informações desta criança.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Buscar por nome ou email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="border rounded-md p-3 mb-4">
              <h4 className="text-sm font-medium mb-2">Resultados da Busca</h4>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                        {result.photoURL ? (
                          <img src={result.photoURL} alt={result.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-foreground">
                            {(result.displayName || result.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{result.displayName || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{result.email}</p>
                      </div>
                    </div>
                    {result.id !== user?.uid && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => onAddAccess(result.id, 'editor')}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Editores Atuais</h4>
            {editorsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum editor adicional.</p>
            ) : (
              <div className="space-y-2">
                {editorsList.map((editor) => (
                  <div key={editor.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                        {editor.photoURL ? (
                          <img src={editor.photoURL} alt={editor.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-foreground">
                            {(editor.displayName || editor.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{editor.displayName || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{editor.email}</p>
                        {editor.id === user?.uid && (
                          <Badge variant="default" className="text-xs">Você</Badge>
                        )}
                      </div>
                    </div>
                    {editor.id !== user?.uid && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => setUserBeingRemoved(editor.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="default" onClick={() => setShowEditorsDialog(false)} type="button">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Viewers Dialog */}
      <Dialog open={showViewersDialog} onOpenChange={setShowViewersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar Visualizadores</DialogTitle>
            <DialogDescription>
              Visualizadores podem apenas ver as informações desta criança.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Buscar por nome ou email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="border rounded-md p-3 mb-4">
              <h4 className="text-sm font-medium mb-2">Resultados da Busca</h4>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                        {result.photoURL ? (
                          <img src={result.photoURL} alt={result.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-foreground">
                            {(result.displayName || result.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{result.displayName || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{result.email}</p>
                      </div>
                    </div>
                    {result.id !== user?.uid && (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => onAddAccess(result.id, 'viewer')}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Visualizadores Atuais</h4>
            {viewersList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum visualizador adicional.</p>
            ) : (
              <div className="space-y-2">
                {viewersList.map((viewer) => (
                  <div key={viewer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                        {viewer.photoURL ? (
                          <img src={viewer.photoURL} alt={viewer.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-foreground">
                            {(viewer.displayName || viewer.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{viewer.displayName || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{viewer.email}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => setUserBeingRemoved(viewer.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="default" onClick={() => setShowViewersDialog(false)} type="button">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for User Removal */}
      <Dialog
        open={userBeingRemoved !== null}
        onOpenChange={(open) => !open && setUserBeingRemoved(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este usuário?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="default"
              onClick={() => setUserBeingRemoved(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (userBeingRemoved) {
                  // Check if the user is in editors or viewers list
                  const isEditor = editorsList.some(e => e.id === userBeingRemoved);
                  onRemoveAccess(userBeingRemoved, isEditor ? 'editor' : 'viewer');
                  setUserBeingRemoved(null);
                }
              }}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}