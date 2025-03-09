'use client';
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db, storage, createChild } from '@/lib/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import Link from 'next/link';
import UserProfileBar from '@/app/components/logged-area/ui/UserProfileBar';
import { ChevronLeft, Camera, Search, UserPlus, X, UserCog, Pencil } from 'lucide-react';
import IconCamera from '@/app/assets/icons/camera.svg';

// Friend search result type
interface FriendSearchResult {
    uid: string;
    username: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    accessLevel?: 'viewer' | 'editor';
}

export default function AddChildPage() {
    const { username } = useParams<{ username: string }>();
    const router = useRouter();
    const { user, userData } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showFriendSearch, setShowFriendSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [childData, setChildData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: '',
        relationship: '',
        notes: '',
        photoURL: '',
        schoolName: '',
        interests: []
    });

    // Array to store friends with access permissions
    const [selectedFriends, setSelectedFriends] = useState<FriendSearchResult[]>([]);

    // Check if user has permission to add a child
    const hasPermission = user?.uid && userData?.username === username;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setChildData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setChildData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle profile photo upload
    const handlePhotoClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Tipo de arquivo inválido',
                description: 'Por favor, selecione uma imagem válida.'
            });
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: 'destructive',
                title: 'Arquivo muito grande',
                description: 'O tamanho máximo permitido é 2MB.'
            });
            return;
        }

        // Start upload
        setPhotoUploading(true);
        setUploadProgress(0);

        try {
            // Create a reference with a timestamp to avoid caching issues
            const timestamp = new Date().getTime();
            if (!storage) {
                throw new Error("Storage is not initialized");
            }

            // Use a path that complies with storage rules
            const storageRef = ref(storage, `children_photos/temp_${timestamp}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Listen for upload progress
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progressValue = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    );
                    setUploadProgress(progressValue);
                },
                (error) => {
                    console.error('Error uploading photo:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Erro ao enviar foto',
                        description: 'Não foi possível enviar a foto. Tente novamente.'
                    });
                    setPhotoUploading(false);
                },
                async () => {
                    // Upload completed
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setChildData(prev => ({
                        ...prev,
                        photoURL: downloadURL
                    }));
                    setPhotoUploading(false);
                }
            );
        } catch (error) {
            console.error('Error in photo upload:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao iniciar upload',
                description: 'Não foi possível iniciar o envio da foto.'
            });
            setPhotoUploading(false);
        }
    };

    // Search for friends to add as viewers/editors
    const handleFriendSearch = async () => {
        if (!searchTerm || searchTerm.length < 3) return;

        setIsSearching(true);
        setSearchResults([]);

        try {
            console.log("Searching for users:", searchTerm);
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
            const results: FriendSearchResult[] = [];
            const processedUids = new Set<string>();

            const processSnapshot = (snapshot: any) => {
                snapshot.forEach((doc: any) => {
                    const userData = doc.data();
                    // Skip the current user
                    if (userData.uid === user?.uid || processedUids.has(userData.uid)) {
                        return;
                    }

                    // Skip users who are already added as friends
                    if (selectedFriends.some(f => f.uid === userData.uid)) {
                        return;
                    }

                    processedUids.add(userData.uid);
                    results.push({
                        uid: userData.uid,
                        username: userData.username,
                        displayName: userData.displayName || userData.username,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
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

    // Add friend with specified access level
    const addFriend = (friend: FriendSearchResult, accessLevel: 'viewer' | 'editor') => {
        setSelectedFriends(prev => [
            ...prev,
            { ...friend, accessLevel }
        ]);

        // Remove from search results
        setSearchResults(prev => prev.filter(f => f.uid !== friend.uid));
    };

    // Remove friend from selected list
    const removeFriend = (uid: string) => {
        setSelectedFriends(prev => prev.filter(f => f.uid !== uid));
    };

    // Toggle friend's access level
    const toggleFriendAccessLevel = (uid: string) => {
        setSelectedFriends(prev =>
            prev.map(friend =>
                friend.uid === uid
                    ? { ...friend, accessLevel: friend.accessLevel === 'viewer' ? 'editor' : 'viewer' }
                    : friend
            )
        );
    };

    // Save child with the updated permission model
    const saveChild = async () => {
        if (!user?.uid) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Você precisa estar logado para adicionar uma criança.'
            });
            return;
        }

        // Validate required fields
        if (!childData.firstName || !childData.lastName || !childData.birthDate) {
            toast({
                variant: 'destructive',
                title: 'Campos obrigatórios',
                description: 'Por favor, preencha os campos de nome, sobrenome e data de nascimento.'
            });
            return;
        }

        setIsSaving(true);

        try {
            // Prepare viewers and editors arrays based on selected friends
            const viewers = selectedFriends
                .filter(friend => friend.accessLevel === 'viewer')
                .map(friend => friend.uid);

            const editors = [
                user.uid, // Current user is always an editor
                ...selectedFriends
                    .filter(friend => friend.accessLevel === 'editor')
                    .map(friend => friend.uid)
            ];

            // Create child using the updated method with permission model
            const childWithData = {
                ...childData,
                // Remove any undefined or empty values
                ...(childData.schoolName ? { schoolName: childData.schoolName } : {}),
                ...(childData.relationship ? { relationship: childData.relationship } : {}),
                ...(childData.photoURL ? { photoURL: childData.photoURL } : {})
            };

            const newChild = await createChild(childWithData, user.uid);

            toast({
                title: 'Criança adicionada',
                description: 'Os dados foram salvos com sucesso!'
            });

            // Redirect to the child's page
            router.push(`/${username}/criancas/${newChild.id}`);
        } catch (error) {
            console.error('Error adding child:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: 'Não foi possível adicionar a criança. Verifique as permissões ou tente novamente mais tarde.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (!hasPermission) {
        return (
            <div className="flex flex-col min-h-screen">
                <UserProfileBar pathname="Acesso negado" />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-6">
                        <h2 className="text-2xl font-bold text-destructive mb-4">Acesso negado</h2>
                        <p className="mb-6">Você não tem permissão para adicionar crianças a este perfil.</p>
                        <Link href={`/${username}/criancas`}>
                            <Button>Voltar para Crianças</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
            <UserProfileBar pathname="Adicionar Criança" />

            <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-20">
                {/* Back button */}
                <Link
                    href={`/${username}/criancas`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar para crianças
                </Link>

                <Card className="overflow-hidden">
                    <CardHeader>
                        <h1 className="text-2xl font-bold">Adicionar Nova Criança</h1>
                        <p className="text-muted-foreground">
                            Preencha as informações abaixo para adicionar uma nova criança ao seu perfil.
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Photo upload section */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <Avatar
                                    className="h-32 w-32 rounded-xl border-2 border-primary/40 cursor-pointer"
                                    onClick={handlePhotoClick}
                                >
                                    {childData.photoURL ? (
                                        <AvatarImage src={childData.photoURL} alt="Foto da criança" />
                                    ) : (
                                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-2xl font-bold">
                                            {/* {childData.firstName ? childData.firstName.charAt(0) : ''}
                      {childData.lastName ? childData.lastName.charAt(0) : ''} */}
                                            <IconCamera width={48} height={48} className="w-full" />
                                        </AvatarFallback>
                                    )}

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                    />

                                    <div className="absolute bottom-0 right-0 bg-mainStrongGreen p-2 rounded-full shadow-md">
                                        <Pencil className="w-4 h-4" />
                                    </div>

                                    {photoUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                                            <div className="text-center text-white">
                                                <div className="mb-2 font-medium">Enviando...</div>
                                                <div className="w-20 h-2 bg-gray-300 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Avatar>
                            </div>
                        </div>

                        {/* Basic information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nome*</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    value={childData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Sobrenome*</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    value={childData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Data de Nascimento*</Label>
                                <Input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    value={childData.birthDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gênero</Label>
                                <Select
                                    value={childData.gender}
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
                <Label htmlFor="schoolName">Escola</Label>
                <Input
                  id="schoolName"
                  name="schoolName"
                  placeholder="Nome da escola (opcional)"
                  value={childData.schoolName}
                  onChange={handleInputChange}
                />
              </div> */}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                placeholder="Adicione anotações e observações relevantes..."
                                className="min-h-[100px]"
                                value={childData.notes}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* Share access section */}
                        <div className="space-y-2 border rounded-md p-4">
                            <div className="flex justify-between items-center pb-4">
                                <Label className="text-lg font-semibold">
                                    Compartilhar Acesso
                                </Label>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className='bg-secondaryMain'
                                    onClick={() => setShowFriendSearch(true)}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Adicionar Pessoa
                                </Button>
                            </div>

                            <p className="text-sm text-muted-foreground mt-2">
                                Adicione pessoas para compartilhar o acesso a esta criança. Entenda as permissões:
                            </p>
                            <ul className="space-y-2 mt-2">
                                <li className="flex items-center space-x-2">
                                    <Badge variant="default">Editor</Badge>
                                    <p className="text-sm text-muted-foreground">
                                        Pode editar e adicionar informações sobre a criança, eventos e despesas.
                                    </p>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <Badge variant="default">Visualizador</Badge>
                                    <p className="text-sm text-muted-foreground">
                                        Pode visualizar as informações da criança, mas não pode editar, adicionar ou excluir dados.
                                    </p>
                                </li>
                            </ul>

                            {selectedFriends.length > 0 ? (
                                <div className="mt-4 space-y-2">
                                    {selectedFriends.map(friend => (
                                        <div key={friend.uid} className="flex items-center justify-between p-2 border rounded-md">
                                            <div className="flex items-center space-x-2">
                                                <Avatar className="h-8 w-8">
                                                    {friend.photoURL ? (
                                                        <AvatarImage src={friend.photoURL} alt={friend.displayName} />
                                                    ) : (
                                                        <AvatarFallback>
                                                            {friend.displayName?.charAt(0) || friend.username.charAt(0)}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{friend.displayName || friend.username}</p>
                                                    <Badge variant={friend.accessLevel === 'editor' ? 'default' : 'default'}>
                                                        {friend.accessLevel === 'editor' ? 'Editor' : 'Visualizador'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1 gap-2">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className='bg-secondaryMain'
                                                    onClick={() => toggleFriendAccessLevel(friend.uid)}
                                                >
                                                    <UserCog className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className='bg-mainStrongRed'
                                                    onClick={() => removeFriend(friend.uid)}
                                                >
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div/>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-2 border-t p-6">
                        <Link href={`/${username}/criancas`}>
                            <Button variant="default" className='bg-mainStrongRed' disabled={isSaving || photoUploading}>Cancelar</Button>
                        </Link>
                        <Button
                            variant="default"
                            className='bg-secondaryMain'
                            onClick={saveChild}
                            disabled={isSaving || photoUploading}
                        >
                            {isSaving ? 'Salvando...' : 'Adicionar Criança'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Friend search dialog */}
            <Dialog open={showFriendSearch} onOpenChange={setShowFriendSearch}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Buscar Pessoas
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex items-start space-x-2 mt-2 ">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="friend-search" className="sr-only">Buscar</Label>
                            <Input
                                id="friend-search"
                                placeholder="Digite o nome ou username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            className="px-3"
                            disabled={isSearching || searchTerm.length < 3}
                            onClick={handleFriendSearch}
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="mt-4 max-h-[300px] overflow-y-auto">
                        {isSearching ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mainStrongGreen"></div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map(user => (
                                    <div key={user.uid} className="flex items-center justify-between p-2 border rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <Avatar className="h-8 w-8">
                                                {user.photoURL ? (
                                                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                                                ) : (
                                                    <AvatarFallback>
                                                        {user.displayName?.charAt(0) || user.username.charAt(0)}
                                                    </AvatarFallback>
                                                )}
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{user.displayName || user.username}</p>
                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-1 gap-2">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="bg-secondaryMain"
                                                onClick={() => addFriend(user, 'editor')}
                                            >
                                                Editor
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="bg-secondaryMain"
                                                onClick={() => addFriend(user, 'viewer')}
                                            >
                                                Visualizador
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : searchTerm.length >= 3 ? (
                            <div className="text-center p-4 text-muted-foreground">
                                Nenhum resultado encontrado
                            </div>
                        ) : (
                            <div className="text-center p-4 text-muted-foreground">
                                Digite pelo menos 3 caracteres para buscar
                            </div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-start">
                        <Button variant="default" onClick={() => setShowFriendSearch(false)}>
                            Concluído
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}