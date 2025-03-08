'use client';
import { motion } from 'framer-motion';
import EditIcon from '@/app/assets/icons/edit.svg';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { SignupFormData } from '../types';
import { useRef, useState, useEffect } from 'react';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { ChevronRight } from "lucide-react";

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
            // Use a simpler path structure that matches our updated storage rules
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
                        <div className="absolute bottom-2 right-2 bg-mainStrongGreen p-2 rounded-full shadow-md">
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
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { name: string, value: string }) => void
}) => {
    const displayData = isEditing ? formData : userData;
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    
    // Calculate profile completion
    useEffect(() => {
        if (!userData) {
            setCompletionPercentage(0);
            return;
        }

        // Define fields to check for completion - same as in ProfileCompletion
        const fields = [
            { name: 'firstName', label: 'Nome' },
            { name: 'lastName', label: 'Sobrenome' },
            { name: 'email', label: 'Email' },
            { name: 'photoURL', label: 'Foto de perfil' },
            { name: 'about', label: 'Sobre' },
            { name: 'gender', label: 'Gênero' },
            { name: 'phoneNumber', label: 'Telefone' },
            { name: 'birthDate', label: 'Data de nascimento' }
        ];

        // Count completed fields
        const completedFields = fields.filter(field => {
            const value = userData[field.name as keyof typeof userData];
            return value !== undefined && value !== null && value !== '';
        }).length;

        // Calculate percentage
        const percentage = Math.round((completedFields / fields.length) * 100);
        setCompletionPercentage(percentage);

        // Get missing fields
        const missing = fields
            .filter(field => {
                const value = userData[field.name as keyof typeof userData];
                return value === undefined || value === null || value === '';
            })
            .map(field => field.label);
        
        setMissingFields(missing);
    }, [userData]);
    
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
    
    const handleSelectChange = (name: string, value: string) => {
        if (onChange) {
            onChange({ name, value });
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
                        
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gênero</Label>
                            <Select
                                value={displayData?.gender || ''}
                                onValueChange={(value) => handleSelectChange('gender', value)}
                            >
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Selecione seu gênero" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Masculino</SelectItem>
                                    <SelectItem value="female">Feminino</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber">Telefone</Label>
                            <Input 
                                id="phoneNumber" 
                                name="phoneNumber" 
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={displayData?.phoneNumber || ''} 
                                onChange={onChange}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Data de nascimento</Label>
                            <Input 
                                id="birthDate" 
                                name="birthDate" 
                                type="date"
                                value={displayData?.birthDate || ''} 
                                onChange={onChange}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="about">Sobre mim</Label>
                            <textarea 
                                id="about" 
                                name="about"
                                className="w-full min-h-[100px] p-2 border rounded-md"
                                placeholder="Escreva um pouco sobre você..."
                                value={displayData?.about || ''} 
                                onChange={onChange}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-3xl font-black mb-1">
                            {capitalizeFirstLetter(displayData?.firstName || '')} {capitalizeFirstLetter(displayData?.lastName || '')}
                        </h2>
                        <p className="text-muted-foreground text-lg mb-3">
                            @{displayData?.username}
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-2 mb-3">
                            {displayData?.gender && (
                                <Badge variant={null} className="mb-1">
                                    {displayData.gender === 'male' ? 'Masculino' : 
                                    displayData.gender === 'female' ? 'Feminino' : 'Outro'}
                                </Badge>
                            )}
                            
                            {displayData?.birthDate && (
                                <Badge variant={null} className="mb-1 bg-blue-100 text-blue-800">
                                    {new Date(displayData.birthDate).toLocaleDateString('pt-BR')}
                                </Badge>
                            )}
                        </div>
                        
                        {displayData?.phoneNumber && isOwnProfile && (
                            <p className="text-sm text-muted-foreground mb-3">
                                📱 {displayData.phoneNumber}
                            </p>
                        )}
                        
                        {displayData?.about && (
                            <div className="mt-3 mb-4 p-3 bg-slate-50 rounded-md text-sm text-muted-foreground text-left">
                                "{displayData.about}"
                            </div>
                        )}
                        
                        {!isOwnProfile && (
                            <Badge variant="default" className="mt-1 px-4 py-1 text-sm">
                                Perfil Visitante
                            </Badge>
                        )}
                    </>
                )}
                
                {isOwnProfile && !isEditing && (
                    <>
                        {/* Profile completion section */}
                        {completionPercentage < 100 && (
                            <div className="w-full mt-4 mb-2 p-3 border rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold">Complete seu perfil - {completionPercentage}%</h3>
                                    {missingFields.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {missingFields.length} {missingFields.length === 1 ? 'campo' : 'campos'} faltante{missingFields.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                
                                <Progress value={completionPercentage} className="h-2" />
                                
                                {missingFields.length > 0 && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {missingFields.slice(0, 3).join(', ')}
                                        {missingFields.length > 3 && ` e mais ${missingFields.length - 3}...`}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button 
                            className="mt-2 gap-2 rounded-md px-6 font-medium bg-secondaryMain" 
                            variant="default"
                            onClick={onToggleEdit}
                        >
                            <EditIcon className="w-4 h-4" />
                            {completionPercentage < 100 ? 'Completar Perfil' : 'Editar Perfil'}
                        </Button>
                    </>
                )}
            </CardContent>
            
            {isEditing && (
                <CardFooter className="flex justify-between pb-6">
                    <Button 
                        variant="default" 
                        onClick={onToggleEdit}
                        disabled={isSaving}
                        className="bg-mainStrongRed"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={onSave}
                        disabled={isSaving}
                        variant="default"
                        className="bg-secondaryMain"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default UserProfileCard;