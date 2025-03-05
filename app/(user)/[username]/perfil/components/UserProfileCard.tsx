'use client';
import { motion } from 'framer-motion';
import EditIcon from '@/app/assets/icons/edit.svg';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignupFormData } from '../types';
import { useRef, useState } from 'react';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export const AvatarSection = ({ 
    photoURL, 
    firstName, 
    lastName, 
    isEditing, 
    onPhotoUpdate 
}: { 
    photoURL?: string, 
    firstName?: string, 
    lastName?: string, 
    isEditing?: boolean,
    onPhotoUpdate?: (url: string) => void 
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const handlePhotoClick = () => {
        if (isEditing && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onPhotoUpdate) return;
        
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
        setUploading(true);
        setProgress(0);
        
        try {
            // Create a reference with a timestamp to avoid caching issues
            const timestamp = new Date().getTime();
            if (!storage) {
                throw new Error("Storage is not initialized");
            }
            const storageRef = ref(storage, `profile_photos/${timestamp}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            // Listen for upload progress
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progressValue = Math.round(
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    );
                    setProgress(progressValue);
                },
                (error) => {
                    console.error('Error uploading photo:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Erro ao enviar foto',
                        description: 'Não foi possível enviar a foto. Tente novamente.'
                    });
                    setUploading(false);
                },
                async () => {
                    // Upload completed
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    onPhotoUpdate(downloadURL);
                    setUploading(false);
                }
            );
        } catch (error) {
            console.error('Error in photo upload:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao iniciar upload',
                description: 'Não foi possível iniciar o envio da foto.'
            });
            setUploading(false);
        }
    };
    
    return (
        <motion.div
            className="flex items-center justify-center"
            whileHover={{ scale: isEditing ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className="relative">
                <Avatar 
                    className={`h-52 w-52 rounded-2xl border-4 ${isEditing ? 'border-secondary cursor-pointer' : 'border-primary/40'} shadow-lg`}
                    onClick={handlePhotoClick}
                >
                    {photoURL ? (
                        <AvatarImage src={photoURL} alt={`${firstName || 'User'}'s avatar`} />
                    ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-4xl font-bold">
                            {firstName?.charAt(0)}{lastName?.charAt(0)}
                        </AvatarFallback>
                    )}
                </Avatar>
                
                {isEditing && (
                    <>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                        <div className="absolute bottom-2 right-2 bg-secondary text-white p-2 rounded-full shadow-md">
                            <EditIcon className="w-4 h-4" />
                        </div>
                        
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                                <div className="text-center text-white">
                                    <div className="mb-2 font-medium">Enviando...</div>
                                    <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="mt-1 text-xs">{progress}%</div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};

export const UserProfileCard = ({ 
    userData, 
    isOwnProfile,
    isEditing,
    formData,
    isSaving,
    onToggleEdit,
    onSave,
    onChange
}: { 
    userData: Partial<SignupFormData>, 
    isOwnProfile: boolean,
    isEditing?: boolean,
    formData?: Partial<SignupFormData>,
    isSaving?: boolean,
    onToggleEdit?: () => void,
    onSave?: () => void,
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
    const displayData = isEditing ? formData : userData;
    
    const handlePhotoUpdate = (url: string) => {
        if (onChange) {
            const event = {
                target: {
                    name: 'photoURL',
                    value: url
                }
            } as React.ChangeEvent<HTMLInputElement>;
            
            onChange(event);
        }
    };
    
    return (
        <Card className="mx-auto w-full max-w-md bg-card shadow-xl rounded-2xl border-2 border-border overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/30"></div>
            <CardHeader className="flex flex-col items-center pb-2 -mt-16">
                <AvatarSection 
                    photoURL={displayData?.photoURL} 
                    firstName={displayData?.firstName} 
                    lastName={displayData?.lastName}
                    isEditing={isEditing}
                    onPhotoUpdate={handlePhotoUpdate}
                />
            </CardHeader>
            
            <CardContent className="flex flex-col items-center text-center pt-4 pb-6">
                {isEditing ? (
                    <div className="w-full space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nome</Label>
                                <Input 
                                    id="firstName" 
                                    name="firstName" 
                                    value={displayData?.firstName || ''} 
                                    onChange={onChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Sobrenome</Label>
                                <Input 
                                    id="lastName" 
                                    name="lastName" 
                                    value={displayData?.lastName || ''} 
                                    onChange={onChange}
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="username">Nome de usuário</Label>
                            <Input 
                                id="username" 
                                name="username" 
                                value={displayData?.username || ''} 
                                onChange={onChange}
                                disabled
                                className="opacity-70"
                            />
                            <p className="text-xs text-muted-foreground">O nome de usuário não pode ser alterado</p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                                id="email" 
                                name="email" 
                                type="email"
                                value={displayData?.email || ''} 
                                onChange={onChange}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                            {capitalizeFirstLetter(displayData?.firstName || '')} {capitalizeFirstLetter(displayData?.lastName || '')}
                        </h2>
                        <p className="text-muted-foreground text-lg mb-3">
                            @{displayData?.username}
                        </p>
                        {!isOwnProfile && (
                            <Badge variant="default" className="mt-3 px-4 py-1 text-sm">
                                Perfil Visitante
                            </Badge>
                        )}
                    </>
                )}
                
                {isOwnProfile && !isEditing && (
                    <Button 
                        className="mt-4 gap-2 rounded-full px-6 font-medium" 
                        variant="default"
                        onClick={onToggleEdit}
                    >
                        <EditIcon className="w-4 h-4" />
                        Editar Perfil
                    </Button>
                )}
            </CardContent>
            
            {isEditing && (
                <CardFooter className="flex justify-between pb-6">
                    <Button 
                        variant="default" 
                        onClick={onToggleEdit}
                        disabled={isSaving}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={onSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default UserProfileCard;