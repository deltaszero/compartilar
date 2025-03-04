// app/(user)/[username]/home/page.tsx
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import React from "react";
import dayjs, { Dayjs } from "dayjs";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    runTransaction,
    addDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { db, storage } from "@/app/lib/firebaseConfig";
import { useUser } from "@/context/userContext";
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import EditIcon from "@/app/assets/icons/edit.svg";
import Calendar from "../calendario/components/Calendar";
import Link from "next/link";

import supportImg from "@/app/assets/images/support-icon.png";
import calendarImg from "@/app/assets/images/calendar-icon.png";
import familyImg from "@/app/assets/images/family-icon.png";
import IconBell from "@/app/assets/icons/icon_meu_lar_bell.svg";

import "dayjs/locale/pt-br";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { AspectRatio } from "@/components/ui/aspect-ratio";

import LoadingPage from '@/app/components/LoadingPage'

dayjs.locale("pt-br");

export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
}

interface KidInfo {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: "male" | "female" | "other" | null;
    relationship: "biological" | "adopted" | "guardian" | null;
    photoURL?: string | null;
}

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const UserProfileCard = ({
    userData,
}: {
    userData: Partial<SignupFormData>;
}) => (
    <div className="flex justify-between items-start p-4">
        <div className="flex flex-col items-start gap-0">
            <div className="text-6xl font-semibold">
                Olá,
                <br />
                {capitalizeFirstLetter(userData.firstName || "")}!
            </div>
            <div className="text-sm font-semibold">@{userData.username}</div>
        </div>
        {/* <div className="flex flex-col">
      <button className="relative flex items-center justify-center w-10 h-10 transition-colors duration-150 rounded-full focus:outline-none focus:ring-2 focus:ring-ring hover:bg-muted">
        <IconBell width={32} height={32} />
        <span className="absolute -top-0 -left-1 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          9+
        </span>
      </button>
      <div>&nbsp;</div>
    </div> */}
    </div>
);

const fetchChildren = async (parentId: string): Promise<KidInfo[]> => {
    const q = query(
        collection(db, "children"),
        where("parentId", "==", parentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            birthDate: data.birthDate,
            gender: data.gender,
            relationship: data.relationship,
            photoURL: data.photoURL || null,
        };
    });
};

const ChildCard = ({ kid }: { kid: KidInfo }) => {
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { user } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        // Fetch the child's photo URL if exists
        const fetchChildPhotoURL = async () => {
            try {
                if (kid.photoURL) {
                    setPhotoURL(kid.photoURL);
                }
            } catch (error) {
                console.error("Error fetching child photo:", error);
            }
        };
        fetchChildPhotoURL();
    }, [kid]);

    const handlePhotoClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setPhotoFile(file);
            uploadChildPhoto(file);
        }
    };

    const uploadChildPhoto = async (file: File) => {
        if (!user || !kid.id) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Check if we have access to storage (client-side only)
            if (typeof window === "undefined" || !storage) {
                toast({
                    variant: "destructive",
                    title: "Erro de Upload",
                    description: "Upload de fotos só é possível no navegador."
                });
                setIsUploading(false);
                setUploadProgress(null);
                return;
            }

            const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
            if (!file.type.startsWith("image/")) {
                toast({
                    variant: "destructive",
                    title: "Tipo de arquivo inválido",
                    description: "Por favor, selecione um arquivo de imagem válido."
                });
                throw new Error("Por favor, selecione um arquivo de imagem válido.");
            }
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "Arquivo muito grande",
                    description: "O arquivo é muito grande. O tamanho máximo é de 2MB."
                });
                throw new Error("O arquivo é muito grande. O tamanho máximo é de 2MB.");
            }

            // Upload photo to firebase storage
            const storageRef = ref(storage, `children_photos/${kid.id}/profile.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Handle upload state
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload error:", error);
                    setIsUploading(false);
                    setUploadProgress(null);
                    toast({
                        variant: "destructive",
                        title: "Erro no upload",
                        description: error.message
                    });
                },
                async () => {
                    try {
                        // Get download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        setPhotoURL(downloadURL);

                        // Update child document with new photo URL
                        await runTransaction(db, async (transaction) => {
                            const childRef = doc(db, "children", kid.id);
                            transaction.update(childRef, {
                                photoURL: downloadURL,
                                updatedAt: new Date(),
                            });
                        });

                        toast({
                            title: "Upload concluído",
                            description: "Foto de perfil atualizada com sucesso!"
                        });
                    } catch (err) {
                        console.error("Error updating child photo:", err);
                        toast({
                            variant: "destructive",
                            title: "Falha na atualização",
                            description: "Erro ao atualizar a foto de perfil. Tente novamente."
                        });
                    } finally {
                        setIsUploading(false);
                        setUploadProgress(null);
                    }
                }
            );
        } catch (error) {
            console.error("Error uploading child photo:", error);
            setIsUploading(false);
            setUploadProgress(null);
            toast({
                variant: "destructive",
                title: "Erro de inicialização",
                description: "Erro ao iniciar upload. Tente novamente mais tarde."
            });
        }
    };

    return (
        <div className="flex items-center">
            {/* CARD */}
            <div className="flex bg-card text-card-foreground shadow-xl w-full rounded-xl overflow-hidden">
                {/* AVATAR */}
                <div className="bg-primary relative">
                    <div
                        className="flex items-center justify-center cursor-pointer w-[128px] h-[128px]"
                        onClick={handlePhotoClick}
                    >
                        {photoURL ? (
                            <Image
                                src={photoURL}
                                alt={`${kid.firstName}'s photo`}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl text-primary-foreground w-full h-full flex items-center justify-center">
                                {kid.firstName[0].toUpperCase()}
                                {kid.lastName[0].toUpperCase()}
                            </span>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />

                        <button className="absolute bottom-1 left-1 p-1.5 bg-accent text-accent-foreground rounded-full">
                            <EditIcon width={12} height={12} />
                        </button>

                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {uploadProgress !== null && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}
                </div>
                {/* BODY */}
                <div className="flex flex-col p-4">
                    {/* CARD TITLE */}
                    <h2 className="text-xl font-semibold">
                        {kid.firstName} {kid.lastName}
                    </h2>
                    <div className="flex flex-row gap-1 text-wrap py-1">
                        <Badge variant="secondary">
                            {kid.gender === 'male' ? 'Masculino' :
                                kid.gender === 'female' ? 'Feminino' : 'Outro'}
                        </Badge>
                        <Badge variant="outline">
                            {kid.relationship === 'biological' ? 'Biológico' :
                                kid.relationship === 'adopted' ? 'Adotado' : 'Guardião'}
                        </Badge>
                    </div>

                    {/* CARD ACTIONS */}
                    <div className="flex justify-end mt-auto">
                        <Button variant="outline" size="sm">
                            Detalhes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KidsGrid = ({ parentId }: { parentId: string }) => {
    const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChildren = async () => {
            try {
                const data = await fetchChildren(parentId);
                setKidsArray(data);
            } catch (error) {
                console.error("Error fetching children:", error);
            } finally {
                setLoading(false);
            }
        };
        loadChildren();
    }, [parentId]);

    if (loading)
        return (
            <div className="w-full h-48 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );

    if (!kidsArray.length) return null;

    return (
        <div className="flex flex-col gap-4">
            {kidsArray.map((kid) => (
                <div key={kid.id}>
                    <ChildCard kid={kid} />
                </div>
            ))}
        </div>
    );
};

const ChildCardMobile = ({ kid }: { kid: KidInfo }) => {
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Fetch the child's photo URL if exists
        const fetchChildPhotoURL = async () => {
            try {
                if (kid.photoURL) {
                    setPhotoURL(kid.photoURL);
                }
            } catch (error) {
                console.error("Error fetching child photo:", error);
            }
        };
        fetchChildPhotoURL();
    }, [kid]);

    const handlePhotoClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            toast({
                title: "Upload iniciado",
                description: "Iniciando upload da foto..."
            });
        }
    };

    return (
        <Card className="overflow-hidden border-0 shadow-lg">
            <div onClick={handlePhotoClick} className="cursor-pointer">
                <AspectRatio ratio={1}>
                    {photoURL ? (
                        <div className="relative w-full h-full">
                            <Image
                                src={photoURL}
                                alt={`${kid.firstName}'s photo`}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-white font-medium text-xl">
                                        {kid.firstName}
                                    </h3>
                                    <p className="text-white/80 text-xs">
                                        {kid.relationship === 'biological' ? 'Biológico' :
                                            kid.relationship === 'adopted' ? 'Adotado' : 'Guardião'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-primary flex flex-col items-center justify-center">
                            <div className="text-4xl text-primary-foreground font-medium">
                                {kid.firstName[0].toUpperCase()}
                                {kid.lastName[0].toUpperCase()}
                            </div>
                            <div className="text-primary-foreground/80 text-xs mt-2">
                                Adicionar foto
                            </div>
                        </div>
                    )}
                </AspectRatio>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
            />
        </Card>
    );
};

const KidsGridMobile = ({ parentId }: { parentId: string }) => {
    const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadChildren = async () => {
            try {
                const data = await fetchChildren(parentId);
                setKidsArray(data);
            } catch (error) {
                console.error("Error fetching children:", error);
            } finally {
                setLoading(false);
            }
        };
        loadChildren();
    }, [parentId]);

    if (loading)
        return (
            <div className="w-full h-48 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );

    if (!kidsArray.length) {
        return (
            <Card className="p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">👶</span>
                    </div>
                    <div>
                        <h3 className="font-medium mb-1">Nenhuma criança cadastrada</h3>
                        <p className="text-sm text-muted-foreground">
                            Adicione informações sobre seus filhos para acompanhar seu desenvolvimento
                        </p>
                    </div>
                    <Button className="mt-2">Adicionar criança</Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {kidsArray.map((kid) => (
                <div key={kid.id}>
                    <ChildCardMobile kid={kid} />
                </div>
            ))}
        </div>
    );
};

interface InvitationData {
    inviterId: string;
    inviterName: string;
    inviterUsername: string;
    invitationType: string;
    message: string;
    createdAt: Date;
    expiresAt: Date;
    status: 'active' | 'used' | 'expired';
}

interface UserDialogData {
    uid: string;
    firstName: string;
    lastName: string;
    username: string;
}

const InvitationDialog = ({
    isOpen,
    onClose,
    userData
}: {
    isOpen: boolean;
    onClose: () => void;
    userData: UserDialogData
}) => {
    const [invitationType, setInvitationType] = useState<string>("coparent");
    const [message, setMessage] = useState<string>("");
    const [generatedLink, setGeneratedLink] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const { toast } = useToast();

    // Reset states when dialog opens
    useEffect(() => {
        if (isOpen) {
            setInvitationType("coparent");
            setMessage("");
            setGeneratedLink("");
            setIsGenerating(false);
            setIsCopied(false);
        }
    }, [isOpen]);

    const generateLink = async () => {
        if (!message) {
            toast({
                variant: "destructive",
                title: "Mensagem necessária",
                description: "Por favor, adicione uma mensagem personalizada"
            });
            return;
        }

        setIsGenerating(true);

        try {
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7); // Expires in 7 days

            const invitationData: InvitationData = {
                inviterId: userData.uid,
                inviterName: `${userData.firstName} ${userData.lastName}`,
                inviterUsername: userData.username,
                invitationType,
                message,
                createdAt: new Date(),
                expiresAt: expirationDate,
                status: 'active'
            };

            // Store invitation in Firestore
            const invitationRef = await addDoc(collection(db, "invitations"), invitationData);

            // Generate the invitation link with the invitation ID
            const baseURL = typeof window !== 'undefined' ? `${window.location.origin}/convite` : 'https://compartilar.com/convite';
            const invitationLink = `${baseURL}/${invitationRef.id}`;

            setGeneratedLink(invitationLink);
        } catch (error) {
            console.error("Error generating invitation link:", error);
            toast({
                variant: "destructive",
                title: "Erro ao gerar convite",
                description: "Erro ao gerar link de convite. Tente novamente."
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setIsCopied(true);
            toast({
                title: "Link copiado",
                description: "Link copiado para a área de transferência!"
            });

            // Reset copy confirmation after 3 seconds
            setTimeout(() => {
                setIsCopied(false);
            }, 3000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Convide alguém para o CompartiLar</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    {!generatedLink ? (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de convite
                                </label>
                                <select
                                    value={invitationType}
                                    onChange={(e) => setInvitationType(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="coparent">Co-parentalidade</option>
                                    <option value="support">Rede de Apoio</option>
                                    <option value="family">Família</option>
                                    <option value="friend">Amigo</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mensagem personalizada
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Exemplo: Olá! Vamos utilizar o CompartiLar para facilitar nossa comunicação e organização."
                                    className="w-full p-2 border border-gray-300 rounded-md h-32"
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={generateLink}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Skeleton className="h-4 w-4 rounded-full mr-2" />
                                        Gerando link...
                                    </>
                                ) : "Gerar link de convite"}
                            </Button>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="mb-4">
                                <div className="flex items-center justify-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">Link de convite gerado!</h3>
                                <p className="text-sm text-gray-500 mt-1">Compartilhe este link com a pessoa que você quer convidar.</p>
                            </div>

                            <div className="p-2 bg-gray-100 rounded-md mb-4">
                                <p className="text-sm font-mono break-all">{generatedLink}</p>
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    className="flex-1"
                                    onClick={copyToClipboard}
                                >
                                    {isCopied ? "Copiado!" : "Copiar link"}
                                </Button>

                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    Fechar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// CurrentWeek component as simplified version of the original
const CurrentWeek = ({
    selectedDate,
    onDateSelect
}: {
    selectedDate: Dayjs,
    onDateSelect: (date: Dayjs) => void
}) => {
    const [weekDays, setWeekDays] = useState<Array<{
        date: Dayjs;
        dayName: string;
        dayNumber: number;
        isToday: boolean;
        isSelected: boolean;
    }>>([]);

    useEffect(() => {
        const weekStart = selectedDate.startOf('week');
        const days = [];

        for (let i = 0; i < 7; i++) {
            const currentDay = weekStart.add(i, 'day');
            days.push({
                date: currentDay,
                dayName: currentDay.format('ddd'),
                dayNumber: currentDay.date(),
                isToday: currentDay.isSame(dayjs(), 'day'),
                isSelected: currentDay.isSame(selectedDate, 'day')
            });
        }

        setWeekDays(days);
    }, [selectedDate]);

    // Navigate to previous week
    const prevWeek = () => {
        const newDate = selectedDate.subtract(1, 'week');
        onDateSelect(newDate);
    };

    // Navigate to next week
    const nextWeek = () => {
        const newDate = selectedDate.add(1, 'week');
        onDateSelect(newDate);
    };

    // Handle day selection
    const handleDaySelect = (day: { date: Dayjs }) => {
        onDateSelect(day.date);
    };

    return (
        <div className="font-sans w-full max-w-2xl mx-auto">
            {/* Week Navigation */}
            <div className="flex justify-between items-center mb-6">
                <Button
                    onClick={prevWeek}
                    variant="ghost"
                    size="icon"
                    aria-label="Previous week"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <div className="text-center">
                    <h2 className="text-lg font-medium">
                        {weekDays.length > 0 ? `${weekDays[0].date.format('MMM D')} - ${weekDays[6].date.format('MMM D, YYYY')}` : ''}
                    </h2>
                </div>

                <Button
                    onClick={nextWeek}
                    variant="ghost"
                    size="icon"
                    aria-label="Next week"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Week Days */}
            <div className="grid grid-cols-7 gap-1 mb-6">
                {weekDays.map((day, index) => (
                    <Button
                        key={index}
                        onClick={() => handleDaySelect(day)}
                        variant="ghost"
                        className={`
              h-auto flex flex-col items-center py-3 px-1 rounded-lg
              ${day.isToday ? 'bg-primary/10 hover:bg-primary/15' :
                                day.isSelected ? 'bg-primary/20 hover:bg-primary/25' : ''}
            `}
                    >
                        {/* Day Name */}
                        <span className="text-xs text-muted-foreground font-medium mb-1">
                            {day.dayName[0].toUpperCase()}
                        </span>

                        {/* Day Number */}
                        <span className={`
              flex items-center justify-center w-8 h-8 rounded-full mb-1 font-medium
              ${day.isToday
                                ? 'bg-primary text-primary-foreground'
                                : day.isSelected && !day.isToday
                                    ? 'bg-primary/50 text-primary-foreground'
                                    : ''
                            }
            `}>
                            {day.dayNumber}
                        </span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

// Simple FriendList component
const FriendList = ({ userId }: { userId: string }) => {
    const [friends, setFriends] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchFriends = async () => {
            setIsLoading(true);
            try {
                // Query the nested friendsList collection
                const friendsRef = collection(db, 'friends', userId, 'friendsList');
                const snapshot = await getDocs(friendsRef);

                const friendsData: any[] = [];
                snapshot.forEach((doc) => {
                    friendsData.push({
                        ...doc.data(),
                        id: doc.id
                    });
                });

                setFriends(friendsData);
            } catch (err) {
                console.error('Error fetching friends:', err);
                toast({
                    variant: "destructive",
                    title: "Erro ao carregar amigos",
                    description: "Não foi possível carregar sua lista de amigos"
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchFriends();
        }
    }, [userId, toast]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (friends.length === 0) {
        return (
            <div className="text-center py-6 flex flex-col items-center gap-2 text-gray-500">
                <span className="text-4xl">👥</span>
                <p>Você ainda não tem amigos adicionados</p>
            </div>
        );
    }

    // Group friends by relationship type
    const supportFriends = friends.filter(friend => friend.relationshipType === 'support');
    const coparentFriends = friends.filter(friend => friend.relationshipType === 'coparent');
    const otherFriends = friends.filter(friend => friend.relationshipType === 'other' || !friend.relationshipType);

    const renderFriendItem = (friend: any) => (
        <Link
            href={`/${friend.username}/perfil`}
            key={friend.username}
            className="block transition-all hover:scale-[1.02]"
        >
            <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-muted rounded-lg hover:bg-accent hover:text-accent-foreground">
                {friend.photoURL ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full overflow-hidden">
                        <Image
                            src={friend.photoURL}
                            alt={friend.username}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <span className="text-sm sm:text-xl">
                            {friend.username?.[0]?.toUpperCase() || "?"}
                        </span>
                    </div>
                )}
                <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium">
                            {friend.firstName} {friend.lastName}
                        </h3>
                        {friend.relationshipType && (
                            <Badge variant={
                                friend.relationshipType === 'coparent' ? 'secondary' :
                                    friend.relationshipType === 'support' ? 'default' : 'outline'
                            }>
                                {friend.relationshipType === 'coparent' ? 'Co-Parent' :
                                    friend.relationshipType === 'support' ? 'Apoio' : 'Outro'}
                            </Badge>
                        )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                        {friend.addedAt && `Adicionado em ${friend.addedAt.toDate().toLocaleDateString()}`}
                    </span>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="space-y-4">
            {coparentFriends.length > 0 && (
                <div>
                    <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
                        <span className="mr-2 text-secondary">👨‍👩‍👧‍👦</span>
                        Co-Pais
                    </h2>
                    <div className="grid gap-2">
                        {coparentFriends.map(renderFriendItem)}
                    </div>
                </div>
            )}

            {supportFriends.length > 0 && (
                <div>
                    <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
                        <span className="mr-2 text-primary">💜</span>
                        Rede de Apoio
                    </h2>
                    <div className="grid gap-2">
                        {supportFriends.map(renderFriendItem)}
                    </div>
                </div>
            )}

            {otherFriends.length > 0 && (
                <div>
                    <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
                        <span className="mr-2">👤</span>
                        Outros Contatos
                    </h2>
                    <div className="grid gap-2">
                        {otherFriends.map(renderFriendItem)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function HomePage() {
    const { userData } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);

    const handleDateSelect = (date: Dayjs) => {
        setSelectedDate(date);
    };

    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    if (initialLoading || !userData) {
        return (
            //   <div className="flex flex-col min-h-screen items-center justify-center">
            //     <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
            //     <p className="mt-4 text-lg text-muted-foreground">Carregando...</p>
            //   </div>
            <LoadingPage />
        );
    }

    return (
        <div>
            <UserProfileBar pathname="Home" />
            <div className="flex flex-col mb-[10em] sm:mb-0 sm:p-6 sm:gap-6 bg-muted">
                <div className="flex flex-col relative bg-background sm:rounded-3xl shadow-xl">
                    <section className="flex flex-col sm:mb-[2em]">
                        <UserProfileCard userData={userData} />
                    </section>
                </div>

                <article className="flex flex-col bg-background sm:rounded-3xl z-[10]">
                    <div className="flex flex-col gap-0 sm:gap-4 sm:flex-row">

                        <div className="flex flex-col">
                            {/* KIDS SECTION */}
                            <section className="container mx-auto p-4">
                                {isMobile ? (
                                    <div>
                                        <div className="flex flex-col gap-2 pb-2">
                                            <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
                                                <div className="flex flex-col gap-2">
                                                    <h2 className="text-4xl text-warning font-semibold">
                                                        Cuide dos seus pequenos
                                                    </h2>
                                                    <p className="text-xs text-gray-700 ">
                                                        Adicione, edite e acompanhe as principais informações
                                                        sobre seus filhos.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <KidsGridMobile parentId={userData.uid} />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between px-2 rounded-md bg-warning relative mx-auto h-[8em] bg-mainStrongOrange border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                                            <div className="flex flex-col gap-2">
                                                <h2 className="text-3xl font-bold z-10 max-w-[66%]">
                                                    Petiz
                                                </h2>
                                                <p className="text-xs text-gray-700 ">
                                                    Educação, Saúde, Hobbies e outras informações essenciais
                                                    sobre seus filhos.
                                                </p>
                                            </div>
                                            <Image
                                                src={familyImg}
                                                alt="Family"
                                                priority
                                                quality={75}
                                                className="object-contain"
                                                width={128}
                                                height={128}
                                            />
                                        </div>
                                        <div className="bg-base-100 rounded-xl">
                                            <div className="py-4">
                                                <KidsGrid parentId={userData.uid} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>

                            {/* SUPPORT NETWORK SECTION */}
                            <section className="container mx-auto p-4">
                                {/* Banner/Header */}
                                <div className="flex items-center justify-between px-4 rounded-md relative mx-auto h-[8em] mb-4 bg-mainStrongYellow border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                                    <div className="flex flex-col gap-2 z-10">
                                        <h2 className="text-2xl sm:text-3xl font-bold">
                                            Rede de Apoio
                                        </h2>
                                        <p className="text-xs">
                                            Pessoas queridas que provam que juntos somos mais fortes!
                                        </p>
                                    </div>
                                    <Image
                                        src={supportImg}
                                        alt="Support Network"
                                        priority
                                        quality={75}
                                        className="object-contain absolute right-0 bottom-0"
                                        width={isMobile ? 96 : 128}
                                        height={isMobile ? 96 : 128}
                                    />
                                </div>

                                {/* Content Area */}
                                <div className="bg-base-100 rounded-xl shadow-xl overflow-hidden">
                                    {/* Friend List - always visible */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Amigos e Família</h3>
                                            <Button
                                                onClick={() => setIsInvitationDialogOpen(true)}
                                                className="gap-1"
                                                size="sm"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Convidar
                                            </Button>
                                        </div>
                                        <FriendList userId={userData.uid} />
                                    </div>

                                    {/* Mobile view */}
                                    {isMobile && (
                                        <div className="flex justify-center pb-4">
                                            <Link
                                                href={`/${userData.username}/rede`}
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                                            >
                                                Ver página completa da rede
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* CALENDAR SECTION */}
                        <section className="container mx-auto p-4">
                            {isMobile ? (
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-4xl text-secondaryGreen font-semibold">
                                                Planeje-se para a semana
                                            </h2>
                                            <p className="text-xs text-gray-700 ">
                                                Consulte dias de convivência e agende eventos de forma
                                                compartilhada.
                                            </p>
                                        </div>
                                    </div>

                                    <CurrentWeek
                                        selectedDate={selectedDate}
                                        onDateSelect={handleDateSelect}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between px-2 rounded-md relative mx-auto h-[8em] bg-mainStrongBlue border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
                                        <div className="flex flex-col gap-2 ">
                                            <h2 className="text-3xl font-bold z-10 max-w-[66%]">
                                                Calendário
                                            </h2>
                                            <p className="text-xs text-gray-700 ">
                                                Consulte dias de convivência e agende eventos de forma
                                                compartilhada.
                                            </p>
                                        </div>
                                        <Image
                                            src={calendarImg}
                                            alt="Calendar"
                                            priority
                                            quality={75}
                                            className="object-contain"
                                            width={128}
                                            height={128}
                                        />
                                    </div>
                                    <div className="hidden sm:block bg-base-100 rounded-xl py-4">
                                        <Calendar />
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>


                    {/* Invitation Dialog */}
                    <InvitationDialog
                        isOpen={isInvitationDialogOpen}
                        onClose={() => setIsInvitationDialogOpen(false)}
                        userData={{
                            uid: userData.uid,
                            firstName: userData.firstName || '',
                            lastName: userData.lastName || '',
                            username: userData.username
                        }}
                    />
                </article>
            </div>
            <Toaster />
        </div>
    );
}