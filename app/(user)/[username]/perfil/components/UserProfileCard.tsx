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
import { SignupFormData, KidInfo } from '../types';
import { useRef, useState, useEffect } from 'react';
import { storage, getUserChildren } from '@/lib/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from '@/hooks/use-toast';
import { Smartphone, Cake, Quote, Users, User, Baby } from "lucide-react";
import IconCamera from '@/app/assets/icons/camera.svg';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
                            {/* {firstName?.charAt(0)}{lastName?.charAt(0)} */}
                            <IconCamera width={64} height={64} />
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
                                    <div className="w-32 h-2 bg-gray-400 rounded-full overflow-hidden">
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
    const { username } = useParams<{ username: string }>();
    const displayData = isEditing ? formData : userData;
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [missingFields, setMissingFields] = useState<string[]>([]);
    const [children, setChildren] = useState<KidInfo[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(true);

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

    // Fetch children data
    useEffect(() => {
        if (!userData?.uid || !isOwnProfile) {
            setLoadingChildren(false);
            return;
        }

        const fetchChildren = async () => {
            try {
                // Ensure uid is defined before fetching
                if (userData.uid) {
                    const childrenData = await getUserChildren(userData.uid);
                    setChildren(childrenData);
                }
            } catch (error) {
                console.error("Error fetching children:", error);
                setChildren([]);
            } finally {
                setLoadingChildren(false);
            }
        };

        fetchChildren();
    }, [userData?.uid, isOwnProfile]);

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

    // Calculate statistics for children
    const childStats = {
        total: children.length,
        asEditor: children.filter(child => child.accessLevel === "editor").length,
        asViewer: children.filter(child => child.accessLevel === "viewer").length
    };

    return (
        <Card className="mx-auto w-full max-w-md bg-bw rounded-2xl border-2 border-border overflow-hidden">
            <div className="h-24"></div>
            <CardHeader className="flex flex-col items-center pb-2 -mt-16">
                <AvatarSection
                    photoURL={displayData?.photoURL}
                    firstName={displayData?.firstName}
                    lastName={displayData?.lastName}
                    isEditing={isEditing}
                    onPhotoUpdate={handlePhotoUpdate}
                />
            </CardHeader>

            <CardContent className="flex flex-col items-center pt-4 pb-6">
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
                            <p className="text-xs text-gray-400">O nome de usuário não pode ser alterado</p>
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
                        <h2 className="text-3xl font-black">
                            {capitalizeFirstLetter(displayData?.firstName || '')} {capitalizeFirstLetter(displayData?.lastName || '')}
                        </h2>
                        <p className="text-gray-400 text-md mb-4">
                            @{displayData?.username}
                        </p>

                        {displayData?.about && (
                            <div className="flex flex-row gap-1 items-start mb-8 text-sm text-left">
                                <Quote className='text-main w-1/5' />
                                <p className="italic">
                                    {displayData.about}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {/* {displayData?.gender && (
                                <Badge variant={null} className="mb-1">
                                    {displayData.gender === 'male' ? 'Masculino' :
                                        displayData.gender === 'female' ? 'Feminino' : 'Outro'}
                                </Badge>
                            )} */}

                            {displayData?.birthDate && (
                                <Badge className='flex flex-row items-center gap-1 rounded-xl bg-mainStrongGreen bg-blank text-bw text-sm' variant="default" >
                                    <Cake className='h-4 w-4' />  {new Date(displayData.birthDate).toLocaleDateString('pt-BR')}
                                </Badge>
                            )}

                            {displayData?.phoneNumber && (//{displayData?.phoneNumber && isOwnProfile && (
                                <Badge className='flex flex-row items-center gap-1 rounded-xl bg-mainStrongGreen bg-blank text-bw text-sm' variant="default" >
                                    <Smartphone className='h-4 w-4' /> {displayData.phoneNumber}
                                </Badge>
                            )}
                        </div>


                        {/* Children section - only show for own profile */}
                        {/* {isOwnProfile && loadingChildren ? (
                            <div className="w-full mt-3 pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Baby className="text-main w-5 h-5" />
                                    <h3 className="font-semibold text-sm">Crianças</h3>
                                </div>
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                                </div>
                            </div>
                        ) : isOwnProfile && (
                            <div className="w-full my-3 p-5 border border-border border-gray-400 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Baby className="text-main w-5 h-5" />
                                        <h3 className="font-semibold text-sm">Crianças</h3>
                                    </div>
                                    
                                    <Link href={`/${username}/criancas`}>
                                        <Button variant="default" size="sm" className="text-xs bg-mainStrongGreen">
                                            {children.length > 0 ? 'Ver todas' : 'Adicionar'}
                                        </Button>
                                    </Link>
                                </div>
                                
                                {children.length > 0 ? (
                                    <div className="mt-2">
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            {children.slice(0, 4).map((child) => (
                                                <Link 
                                                    key={child.id} 
                                                    href={`/${username}/criancas/${child.id}`}
                                                    className="block"
                                                >
                                                    <div className="flex items-center gap-2 p-2 border rounded-md hover:bg-muted/20 transition-colors">
                                                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-bold">
                                                                {child.firstName[0]}{child.lastName[0]}
                                                            </span>
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-xs font-medium truncate">{child.firstName}</p>
                                                            <p className="text-xs text-gray-400">{child.accessLevel === 'editor' ? 'Editor' : 'Visualizador'}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                        
                                        {children.length > 4 && (
                                            <p className="text-xs text-center mt-2 text-gray-400">
                                                + {children.length - 4} mais
                                            </p>
                                        )}
                                        
                                        <div className="flex gap-2 justify-center mt-3">
                                            {childStats.asEditor > 0 && (
                                                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                                    <User className="w-3 h-3 mr-1" /> {childStats.asEditor} como editor
                                                </Badge>
                                            )}
                                            
                                            {childStats.asViewer > 0 && (
                                                <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                                                    <User className="w-3 h-3 mr-1" /> {childStats.asViewer} como visualizador
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 bg-muted/20 rounded-md">
                                        <p className="text-sm text-gray-400">
                                            Nenhuma criança cadastrada
                                        </p>
                                    </div>
                                )}
                            </div>
                        )} */}

                        {/* {!isOwnProfile && (
                            <Badge variant="default" className="mt-1 px-4 py-1 text-sm">
                                Perfil Visitante
                            </Badge>
                        )} */}
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
                                        <span className="text-xs text-gray-400">
                                            {missingFields.length} {missingFields.length === 1 ? 'campo' : 'campos'} faltante{missingFields.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>

                                <Progress value={completionPercentage} className="h-2" />

                                {missingFields.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-400">
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