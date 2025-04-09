'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { toast } from '@/hooks/use-toast';
import { KidInfo } from '../../types';
import LoadingPage from '@/app/components/LoadingPage';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    fetchChildData,
    updateChildData,
    deleteChildData
} from '../services/child-api';
import { ChildPhotoUpload } from '../components/profile';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export default function EditChildProfile() {
    const { username, kid } = useParams<{ username: string; kid: string }>();
    const router = useRouter();
    const { user, userData, loading } = useUser();

    // Child data and status
    const [childData, setChildData] = useState<KidInfo | null>(null);
    const [editedData, setEditedData] = useState<Partial<KidInfo>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isEditor, setIsEditor] = useState(false);
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // Load initial child data
    useEffect(() => {
        const loadChildData = async () => {
            if (!user || !userData) {
                router.push('/login');
                return;
            }

            try {
                setIsLoading(true);
                const token = await user.getIdToken(true);
                const childInfo = await fetchChildData(kid as string, token);

                setChildData(childInfo);
                setEditedData(childInfo);

                // Determine access level
                const editors = childInfo.editors || [];
                if (childInfo.createdBy === user.uid || childInfo.owner === user.uid) {
                    setIsOwner(true);
                    setIsEditor(true);
                } else if (editors.includes(user.uid)) {
                    setIsEditor(true);
                }

                setIsLoading(false);
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
                    }
                }

                router.push(`/${username}/criancas`);
            }
        };

        if (!loading) {
            loadChildData();
        }
    }, [user, userData, kid, username, router, loading]);

    // Handle input changes
    const handleInputChange = (name: string, value: string) => {
        setEditedData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Save changes
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
                setIsSaving(false);
                return;
            }

            // Clean edited data (remove undefined values)
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
                notes: "Anotações",
                photoURL: "Foto"
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

            // Update child data
            await updateChildData(childData.id, cleanEditedData, historyEntry, token);

            toast({
                title: 'Dados salvos',
                description: 'As informações foram atualizadas com sucesso!'
            });

            // Navigate back to profile page
            router.push(`/${username}/criancas/${kid}`);
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

    // Delete child
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleDeleteChild = async () => {
        if (!childData?.id || !user?.uid) return;

        // Confirm deletion
        const confirmation = window.confirm(
            `Você tem certeza que deseja excluir o perfil de ${childData.firstName}? Esta ação não pode ser desfeita.`
        );

        if (!confirmation) return;

        setIsDeleting(true);
        try {
            // Get fresh auth token
            const token = await user.getIdToken(true);

            // Delete child
            const result = await deleteChildData(childData.id, token);

            toast({
                title: 'Perfil excluído',
                description: 'O perfil foi excluído com sucesso!'
            });

            // Navigate back to children list
            router.push(`/${username}/criancas`);
        } catch (error) {
            console.error('Error deleting child:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir',
                description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir. Tente novamente.'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return <LoadingPage />;
    }

    if (!childData || (!isOwner && !isEditor)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold">Acesso negado</h1>
                <p className="mt-2 text-gray-600">Você não tem permissão para editar este perfil.</p>
                <Button className="mt-4" onClick={() => router.push(`/${username}/criancas/${kid}`)}>
                    Voltar para o perfil
                </Button>
            </div>
        );
    }

    return (
        <div>
            <UserProfileBar pathname='Editar Perfil' />
            <div className="p-4 max-w-lg mx-auto">
                <div className="p-6 mt-4">
                    <h1 className="text-xl font-bold mb-6 text-center">
                        Editar Perfil de {childData.firstName}
                    </h1>

                    {/* Photo Upload Section */}
                    <div className="flex justify-center mb-6">
                        <div className="relative w-48 h-48 rounded-full border-4 border-primary overflow-hidden">
                            <ChildPhotoUpload
                                childId={childData.id}
                                photoUrl={childData.photoURL}
                                previewUrl={previewPhoto}
                                isEditing={true}
                                isOwnerOrEditor={isOwner || isEditor}
                                onPhotoChange={(url) => setEditedData(prev => ({ ...prev, photoURL: url }))}
                                onPreviewChange={setPreviewPhoto}
                                onProgressChange={setUploadProgress}
                            />
                        </div>
                    </div>

                    {/* Basic Information Form */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="firstName">Nome</Label>
                            <Input
                                id="firstName"
                                value={editedData.firstName || ''}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                placeholder="Nome"
                            />
                        </div>

                        <div>
                            <Label htmlFor="lastName">Sobrenome</Label>
                            <Input
                                id="lastName"
                                value={editedData.lastName || ''}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                placeholder="Sobrenome"
                            />
                        </div>

                        <div>
                            <Label htmlFor="birthDate">Data de nascimento</Label>
                            <Input
                                id="birthDate"
                                type="date"
                                value={editedData.birthDate ? format(new Date(editedData.birthDate), 'yyyy-MM-dd') : ''}
                                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Descrição / Anotações</Label>
                            <Textarea
                                id="notes"
                                value={editedData.notes || ''}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Anotações sobre a criança"
                                className="h-32"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4 mt-6">
                        <div className="flex gap-2">
                            <Button
                                variant="default"
                                onClick={() => router.push(`/${username}/criancas/${kid}`)}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>

                            <Button
                                type="button"
                                onClick={handleSaveChanges}
                                disabled={isSaving || isDeleting || uploadProgress !== null}
                                className="flex-1"
                            >
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                        
                        {/* Delete button - only visible for creators/owners/editors */}
                        {(isOwner || isEditor) && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteChild}
                                disabled={isDeleting || isSaving}
                                className="w-full mt-2"
                            >
                                {isDeleting ? 'Excluindo...' : 'Excluir Perfil'}
                            </Button>
                        )}
                    </div>
                </div>
                <div className="h-[8em]" />
            </div>
        </div>
    );
}