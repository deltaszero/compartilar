// app/(user)/[username]/home/page.tsx
"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import React from "react";
// import { motion } from 'framer-motion';
import dayjs, { Dayjs } from "dayjs";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    runTransaction,
    Timestamp,
    addDoc,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
//
import { db, storage } from "@/app/lib/firebaseConfig";
//
import { useUser } from "@context/userContext";
// import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
// import CameraIcon from '@assets/icons/camera.svg';
import EditIcon from "@assets/icons/edit.svg";
import CurrentWeekPage from "@/app/components/logged-area/calendar/CurrentWeek";
import CalendarPage from "@/app/components/logged-area/calendar/Calendar";
import Link from "next/link";
// import NavLink from '@components/ui/NavLink';
import FriendSearch from "@/app/components/logged-area/friendship/FriendSearch";
import FriendRequests from "@/app/components/logged-area/friendship/FriendRequests";
import FriendList from "@/app/components/logged-area/friendship/FriendList";
import LoadingPage from "@/app/components/LoadingPage";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

// import background_img from "@assets/images/970e47d6-0592-4edb-adea-e73211796eac_1.png";
import support_img from "@assets/images/support-icon.png";
import calendar_img from "@assets/images/calendar-icon.png";
import family_img from "@assets/images/family-icon.png";

// Removed unused import

import IconBell from "@assets/icons/icon_meu_lar_bell.svg";

import "dayjs/locale/pt-br";

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

// const UserNotFound = () => (
//     <div className="flex flex-1 items-center justify-center">
//         <p className="text-xl text-error uppercase">
//             User not found
//         </p>
//     </div>
// );

const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

// const AvatarSection = ({ photoURL }: { photoURL?: string }) => (
//     <motion.div
//         className="mask mask-squircle bg-gray-100 flex items-center justify-center"
//         whileHover={{ scale: 1.1 }}
//     >
//         {photoURL ? (
//             <Image
//                 src={photoURL}
//                 width={72}
//                 height={72}
//                 alt="User avatar"
//                 className="object-cover"
//                 priority
//             />
//         ) : (
//             <CameraIcon className="w-12 h-12 text-gray-400" />
//         )}
//     </motion.div>
// );

const UserProfileCard = ({
    userData,
}: {
    userData: Partial<SignupFormData>;
}) => (
    <div className="flex justify-between items-start p-4">
        <div className="flex flex-col items-start gap-0">
            <div className="text-6xl font-semibold font-playfair">
                Olá,
                <br />
                {capitalizeFirstLetter(userData.firstName || "")}!
            </div>
            <div className="text-sm font-semibold">@{userData.username}</div>
        </div>
        <div className="flex flex-col">
            <button className="relative flex items-center justify-center w-10 h-10 transition-colors duration-150 rounded-full focus:outline-none focus:ring-2 focus:ring-ring hover:bg-muted">
                <IconBell width={32} height={32} />
                <span className="absolute -top-0 -left-1 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    9+
                </span>
            </button>
            <div>&nbsp;</div>
        </div>
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

    console.log(photoFile);

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
                toast.error("Upload de fotos só é possível no navegador.");
                setIsUploading(false);
                setUploadProgress(null);
                return;
            }

            const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
            if (!file.type.startsWith("image/")) {
                toast.error("Por favor, selecione um arquivo de imagem válido.");
                throw new Error("Por favor, selecione um arquivo de imagem válido.");
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error("O arquivo é muito grande. O tamanho máximo é de 2MB.");
                throw new Error("O arquivo é muito grande. O tamanho máximo é de 2MB.");
            }

            console.log("Kid ID for upload:", kid.id);

            // Upload photo to firebase storage
            const storageRef = ref(storage, `children_photos/${kid.id}/profile.jpg`);
            console.log(
                "Uploading to path:",
                `children_photos/${kid.id}/profile.jpg`
            );
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Handle upload state
            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("Upload error:", error);
                    setIsUploading(false);
                    setUploadProgress(null);
                    toast.error("Erro no upload: " + error.message);
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

                        toast.success("Foto de perfil atualizada com sucesso!");
                    } catch (err) {
                        console.error("Error updating child photo:", err);
                        toast.error("Erro ao atualizar a foto de perfil. Tente novamente.");
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
            toast.error("Erro ao iniciar upload. Tente novamente mais tarde.");
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
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            neutral
                        </span>
                        <span className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            primary
                        </span>
                    </div>

                    {/* CARD ACTIONS */}
                    <div className="flex justify-end mt-auto">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 text-xs">
                            Detalhes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KidsGrid = ({ parentId }: { parentId: string }) => {
    const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
    // const [currentIndex, setCurrentIndex] = useState(0);
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
            {/* Slides */}
            {kidsArray.map((kid) => (
                <div key={kid.id}>
                    <ChildCard kid={kid} />
                </div>
            ))}
        </div>
    );
};

const ChildCardMobile = ({ kid }: { kid: KidInfo }) => {
    // const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(null);
    // const [isUploading, setIsUploading] = useState(false);
    // const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    // const { user } = useUser();

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

    // const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0] || null;
    //     if (file) {
    //         setPhotoFile(file);
    //         uploadChildPhoto(file);
    //     }
    // };

    // const uploadChildPhoto = async (file: File) => {
    //     if (!user || !kid.id) return;

    //     setIsUploading(true);
    //     setUploadProgress(0);

    //     try {
    //         const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
    //         if (!file.type.startsWith('image/')) {
    //             toast.error('Por favor, selecione um arquivo de imagem válido.');
    //             throw new Error('Por favor, selecione um arquivo de imagem válido.');
    //         }
    //         if (file.size > MAX_FILE_SIZE) {
    //             toast.error('O arquivo é muito grande. O tamanho máximo é de 2MB.');
    //             throw new Error('O arquivo é muito grande. O tamanho máximo é de 2MB.');
    //         }

    //         console.log('Kid ID for upload:', kid.id);

    //         // Upload photo to firebase storage
    //         const storageRef = ref(storage, `children_photos/${kid.id}/profile.jpg`);
    //         console.log('Uploading to path:', `children_photos/${kid.id}/profile.jpg`);
    //         const uploadTask = uploadBytesResumable(storageRef, file);

    //         // Handle upload state
    //         uploadTask.on(
    //             'state_changed',
    //             (snapshot) => {
    //                 const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    //                 setUploadProgress(progress);
    //             },
    //             (error) => {
    //                 console.error('Upload error:', error);
    //                 setIsUploading(false);
    //                 setUploadProgress(null);
    //             },
    //             async () => {
    //                 try {
    //                     // Get download URL
    //                     const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    //                     setPhotoURL(downloadURL);

    //                     // Update child document with new photo URL
    //                     await runTransaction(db, async (transaction) => {
    //                         const childRef = doc(db, 'children', kid.id);
    //                         transaction.update(childRef, {
    //                             photoURL: downloadURL,
    //                             updatedAt: new Date()
    //                         });
    //                     });

    //                     toast.success('Foto de perfil atualizada com sucesso!');

    //                 } catch (err) {
    //                     console.error('Error updating child photo:', err);
    //                     toast.error('Erro ao atualizar a foto de perfil. Tente novamente.');
    //                 } finally {
    //                     setIsUploading(false);
    //                     setUploadProgress(null);
    //                 }
    //             }
    //         );
    //     } catch (error) {
    //         console.error('Error uploading child photo:', error);
    //         setIsUploading(false);
    //         setUploadProgress(null);
    //     }
    // };

    return (
        <figure>
            <div
                className="flex items-center justify-center cursor-pointer"
                onClick={handlePhotoClick}
            >
                {photoURL ? (
                    <div className="w-full relative">
                        <Image
                            src={photoURL}
                            alt={`${kid.firstName}'s photo`}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover rounded-xl shadow-xl"
                        />
                        <p className="absolute inset-0 text-white text-center flex items-end justify-start p-2 font-playfair font-semibold text-xl">
                            {kid.firstName}
                        </p>
                    </div>
                ) : (
                    <span className="text-4xl text-neutral-content w-[128px] h-[128px] flex items-center justify-center font-playfair font-semibold">
                        {kid.firstName[0].toUpperCase()}
                        {kid.lastName[0].toUpperCase()}
                    </span>
                )}

                {/* <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                />

                <div className="absolute bottom-1 left-1 p-[5px] bg-accent text-accent-content rounded-full">
                    <EditIcon width={12} height={12} />
                </div>

                {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="loading loading-spinner loading-sm text-primary"></div>
                    </div>
                )} */}
            </div>

            {/* {uploadProgress !== null && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                        className="h-full bg-primary"
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
            )} */}
        </figure>
    );
};

const KidsGridMobile = ({ parentId }: { parentId: string }) => {
    const [kidsArray, setKidsArray] = useState<KidInfo[]>([]);
    // const [currentIndex, setCurrentIndex] = useState(0);
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
        <div className="grid grid-cols-2 gap-4">
            {kidsArray.map((kid) => (
                <div
                    key={kid.id}
                    className="bg-neutral flex flex-col justify-center rounded-xl shadow-xl"
                >
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

const InvitationDialog = ({ 
    isOpen, 
    onClose, 
    userData 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    userData: any 
}) => {
    const [invitationType, setInvitationType] = useState<string>("coparent");
    const [message, setMessage] = useState<string>("");
    const [generatedLink, setGeneratedLink] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const pathname = usePathname();
    
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
            toast.error("Por favor, adicione uma mensagem personalizada");
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
            toast.error("Erro ao gerar link de convite. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setIsCopied(true);
            toast.success("Link copiado para a área de transferência!");
            
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
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
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
                            
                            <button
                                onClick={generateLink}
                                disabled={isGenerating}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md flex items-center justify-center"
                            >
                                {isGenerating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Gerando link...
                                    </>
                                ) : "Gerar link de convite"}
                            </button>
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
                                <button
                                    onClick={copyToClipboard}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md flex items-center justify-center"
                                >
                                    {isCopied ? "Copiado!" : "Copiar link"}
                                </button>
                                
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function HomePage() {
    const { userData } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);

    // Sample events - converting to proper CalendarEventWithChild format
    const createTimestamp = (date: string) => {
        return Timestamp.fromDate(new Date(date));
    };

    const events = [
        {
            id: "1",
            coParentingId: "sample1",
            title: "Evento 1",
            description: "Descrição do evento 1",
            startTime: createTimestamp(dayjs().format("YYYY-MM-DD")),
            endTime: createTimestamp(dayjs().add(1, "hour").format("YYYY-MM-DD")),
            category: "school" as const,
            responsibleParentId: "parent1",
            checkInRequired: false,
            createdBy: "user1",
            createdAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
            updatedAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
        },
        {
            id: "2",
            coParentingId: "sample2",
            title: "Evento 2",
            description: "Descrição do evento 2",
            startTime: createTimestamp(dayjs().format("YYYY-MM-DD")),
            endTime: createTimestamp(dayjs().add(2, "hour").format("YYYY-MM-DD")),
            category: "medical" as const,
            responsibleParentId: "parent1",
            checkInRequired: false,
            createdBy: "user1",
            createdAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
            updatedAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
        },
        {
            id: "3",
            coParentingId: "sample3",
            title: "Evento 3",
            description: "Descrição do evento 3",
            startTime: createTimestamp(dayjs().add(1, "day").format("YYYY-MM-DD")),
            endTime: createTimestamp(
                dayjs().add(1, "day").add(1, "hour").format("YYYY-MM-DD")
            ),
            category: "activity" as const,
            responsibleParentId: "parent2",
            checkInRequired: true,
            createdBy: "user1",
            createdAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
            updatedAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
        },
        {
            id: "4",
            coParentingId: "sample4",
            title: "Evento 4",
            description: "Descrição do evento 4",
            startTime: createTimestamp(dayjs().add(1, "day").format("YYYY-MM-DD")),
            endTime: createTimestamp(
                dayjs().add(1, "day").add(3, "hour").format("YYYY-MM-DD")
            ),
            category: "visitation" as const,
            responsibleParentId: "parent2",
            checkInRequired: true,
            createdBy: "user2",
            createdAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
            updatedAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
        },
        {
            id: "5",
            coParentingId: "sample5",
            title: "Evento 5",
            description: "Descrição do evento 5",
            startTime: createTimestamp(dayjs().add(3, "day").format("YYYY-MM-DD")),
            endTime: createTimestamp(
                dayjs().add(3, "day").add(2, "hour").format("YYYY-MM-DD")
            ),
            category: "other" as const,
            responsibleParentId: "parent1",
            checkInRequired: false,
            createdBy: "user2",
            createdAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
            updatedAt: createTimestamp(dayjs().format("YYYY-MM-DD")),
        },
    ];

    const handleDateSelect = (date: Dayjs) => {
        setSelectedDate(date);
        console.log("Selected date:", date.format("YYYY-MM-DD"));
    };

    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener("resize", checkMobileScreen);
        return () => window.removeEventListener("resize", checkMobileScreen);
    }, []);
    console.log(isMobile);

    useEffect(() => {
        const timer = setTimeout(() => {
            setInitialLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    console.log(initialLoading);
    if (!userData) return <LoadingPage />;

    return (
        <div className="flex flex-col mb-[10em] sm:mb-0 sm:p-6 sm:gap-6 bg-muted">
            {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                BACKGROUND IMAGE 
             - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
            <div className="flex flex-col relative bg-background sm:rounded-3xl shadow-xl">
                {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    PROFILE BAR 
                - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
                <section className="flex flex-col sm:mb-[2em]">
                    <UserProfileCard userData={userData} />
                </section>
            </div>
            {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                CONTENT BAR 
             - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
            <article className="flex flex-col bg-background sm:rounded-3xl z-[10]">
                <div className="flex flex-col gap-0 sm:gap-4 sm:flex-row ">
                    {/* - - - - - - - - - - - - CALENDAR - - - - - - - - - - - - */}
                    <section className="container mx-auto p-4">
                        {isMobile ? (
                            <div className="flex flex-col">
                                {/* <p className='text-4xl text-gray-700 font-raleway'>
                                    Planeje-se para a semana
                                </p> */}
                                <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-4xl font-playfair text-secondaryGreen font-semibold">
                                            Planeje-se para a semana
                                        </h2>
                                        <p className="text-xs text-gray-700 font-raleway">
                                            Consulte dias de convivência e agende eventos de forma
                                            compartilhada.
                                        </p>
                                    </div>
                                    {/* <Image
                                        src={feature_img}
                                        alt="Background"
                                        priority
                                        quality={75}
                                        className="object-contain"
                                        width={96}
                                    /> */}
                                </div>

                                <CurrentWeekPage
                                    events={events}
                                    selectedDate={selectedDate}
                                    onDateSelect={handleDateSelect}
                                />
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between px-2 rounded-lg bg-secondaryGreen relative mx-auto shadow-xl h-[8em]">
                                    <div className="flex flex-col gap-2 ">
                                        <h2 className="text-3xl font-bold z-10 font-playfair max-w-[66%]">
                                            Calendário
                                        </h2>
                                        <p className="text-xs text-gray-700 font-raleway">
                                            Consulte dias de convivência e agende eventos de forma
                                            compartilhada.
                                        </p>
                                    </div>
                                    <Image
                                        src={calendar_img}
                                        alt="Background"
                                        priority
                                        quality={75}
                                        className="object-contain"
                                        width={128}
                                    />
                                </div>
                                <div className="hidden sm:block bg-base-100 rounded-xl py-4">
                                    <CalendarPage />
                                </div>
                            </div>
                        )}
                    </section>
                    {/* - - - - - - - - - - - - KIDS - - - - - - - - - - - - */}
                    <section className="container mx-auto p-4">
                        {isMobile ? (
                            <div>
                                <div className="flex flex-col gap-2 pb-2">
                                    {/* <h2 className="text-4xl font-bold z-10 font-playfair max-w-[66%]">
                                        Petiz
                                    </h2> */}
                                    {/* <p className='text-4xl text-gray-700 font-raleway'>
                                        Cuide dos seus amores
                                    </p> */}
                                    <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
                                        <div className="flex flex-col gap-2">
                                            <h2 className="text-4xl font-playfair text-warning font-semibold">
                                                Cuide dos seus pequenos
                                            </h2>
                                            <p className="text-xs text-gray-700 font-raleway">
                                                Adicione, edite e acompanhe as principais informações
                                                sobre seus filhos.
                                            </p>
                                        </div>
                                        {/* <Image
                                        src={feature_img}
                                        alt="Background"
                                        priority
                                        quality={75}
                                        className="object-contain"
                                        width={128}
                                    /> */}
                                    </div>
                                </div>
                                <KidsGridMobile parentId={userData.uid} />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-2 rounded-lg bg-warning relative mx-auto h-[8em]">
                                    <div className="flex flex-col gap-2">
                                        <h2 className="text-3xl font-bold z-10 font-playfair max-w-[66%]">
                                            Petiz
                                        </h2>
                                        <p className="text-xs text-gray-700 font-raleway">
                                            Educação, Saúde, Hobbies e outras informações essenciais
                                            sobre seus filhos.
                                        </p>
                                    </div>
                                    <Image
                                        src={family_img}
                                        alt="Background"
                                        priority
                                        quality={75}
                                        className="object-contain"
                                        width={128}
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
                </div>
                {/* - - - - - - - - - - - - SUPPORT NETWORK - - - - - - - - - - - - */}
                <section className="container mx-auto p-4">
                    {/* Banner/Header */}
                    <div className="flex items-center justify-between px-4 rounded-lg bg-purpleShade01 relative mx-auto shadow-xl h-[8em] mb-4 overflow-hidden">
                        <div className="flex flex-col gap-2 z-10">
                            <h2 className="text-2xl sm:text-3xl font-bold font-playfair text-white">
                                Rede de Apoio
                            </h2>
                            <p className="text-xs text-white font-raleway max-w-[90%] sm:max-w-[70%]">
                                Pessoas queridas que provam que juntos somos mais fortes!
                            </p>
                        </div>
                        <Image
                            src={support_img}
                            alt="Support Network"
                            priority
                            quality={75}
                            className="object-contain absolute right-0 bottom-0"
                            height={isMobile ? 96 : 128}
                        />
                    </div>

                    {/* Content Area */}
                    <div className="bg-base-100 rounded-xl shadow-xl overflow-hidden">
                        {/* Friend List - always visible */}
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Amigos e Família</h3>
                                <button 
                                    onClick={() => setIsInvitationDialogOpen(true)}
                                    className="btn btn-primary btn-sm gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Convidar
                                </button>
                            </div>
                            <FriendList userId={userData.uid} />
                        </div>

                        {/* Mobile view */}
                        {isMobile && (
                            <div className="flex justify-center pb-4">
                                <Link
                                    href={`/${userData.username}/rede`}
                                    className="btn btn-primary btn-sm"
                                >
                                    Ver página completa da rede
                                </Link>
                            </div>
                        )}
                        
                        {/* Desktop view - additional components */}
                        {!isMobile && (
                            <>
                                <div className="border-t border-gray-100">
                                    <div className="p-4">
                                        <FriendSearch />
                                    </div>
                                </div>
                                <div className="border-t border-gray-100">
                                    <div className="p-4">
                                        <FriendRequests />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>
                
                {/* Invitation Dialog */}
                <InvitationDialog 
                    isOpen={isInvitationDialogOpen} 
                    onClose={() => setIsInvitationDialogOpen(false)} 
                    userData={userData} 
                />
            </article>
        </div>
    );
}
