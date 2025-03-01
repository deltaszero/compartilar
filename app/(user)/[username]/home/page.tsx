// app/(user)/[username]/home/page.tsx
'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import React from 'react';
// import { motion } from 'framer-motion';
import dayjs, { Dayjs } from 'dayjs';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    runTransaction
} from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';
//
import { db, storage } from '@/app/lib/firebaseConfig';
//
import { useUser } from '@context/userContext';
// import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
// import CameraIcon from '@assets/icons/camera.svg';
import EditIcon from '@assets/icons/edit.svg';
import CurrentWeekPage from "@/app/components/logged-area/calendar/CurrentWeek";
import CalendarPage from "@/app/components/logged-area/calendar/Calendar";
// import NavLink from '@components/ui/NavLink';
import FriendSearch from '@/app/components/logged-area/friendship/FriendSearch';
import FriendRequests from '@/app/components/logged-area/friendship/FriendRequests';
import FriendList from '@/app/components/logged-area/friendship/FriendList';
import LoadingPage from '@/app/components/LoadingPage';
import toast from 'react-hot-toast';

// import background_img from "@assets/images/970e47d6-0592-4edb-adea-e73211796eac_1.png";
import support_img from "@assets/images/support-icon.png";
import calendar_img from "@assets/images/calendar-icon.png";
import family_img from "@assets/images/family-icon.png";

import feature_img from "@assets/images/compartilar-anthropic-img-01.png";

import IconBell from '@assets/icons/icon_meu_lar_bell.svg';

import 'dayjs/locale/pt-br';

dayjs.locale('pt-br')


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
    gender: 'male' | 'female' | 'other' | null;
    relationship: 'biological' | 'adopted' | 'guardian' | null;
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
}

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

const UserProfileCard = ({ userData }: { userData: Partial<SignupFormData> }) => (
    <div className="navbar p-4 items-start">
        <div className="navbar-start">
            <div className="flex flex-col items-start gap-0">
                <div className="text-6xl font-semibold font-playfair">
                    Olá,<br />{capitalizeFirstLetter(userData.firstName || '')}!
                </div>
                <div className="text-sm font-semibold">
                    @{userData.username}
                </div>
            </div>
        </div>
        <div className="navbar-end h-full">
            <div className="flex flex-col">
                <button className="relative flex items-center justify-center w-10 h-10 transition-colors duration-150 rounded-full text-neutral focus:shadow-outline hover:bg-primary-content hover:text-primary">
                    <IconBell width={32} height={32} />
                    <div className="badge badge-sm bg-purpleShade04 text-white absolute -top-0 -left-1 sm:badge-sm">9+</div>
                </button>
                <div>
                    &nbsp;
                </div>
            </div>

        </div>
    </div>
);

const fetchChildren = async (parentId: string): Promise<KidInfo[]> => {
    const q = query(
        collection(db, 'children'),
        where('parentId', '==', parentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            birthDate: data.birthDate,
            gender: data.gender,
            relationship: data.relationship,
            photoURL: data.photoURL || null
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
                console.error('Error fetching child photo:', error);
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
            const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor, selecione um arquivo de imagem válido.');
                throw new Error('Por favor, selecione um arquivo de imagem válido.');
            }
            if (file.size > MAX_FILE_SIZE) {
                toast.error('O arquivo é muito grande. O tamanho máximo é de 2MB.');
                throw new Error('O arquivo é muito grande. O tamanho máximo é de 2MB.');
            }

            console.log('Kid ID for upload:', kid.id);

            // Upload photo to firebase storage
            const storageRef = ref(storage, `children_photos/${kid.id}/profile.jpg`);
            console.log('Uploading to path:', `children_photos/${kid.id}/profile.jpg`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Handle upload state
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    setIsUploading(false);
                    setUploadProgress(null);
                },
                async () => {
                    try {
                        // Get download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        setPhotoURL(downloadURL);

                        // Update child document with new photo URL
                        await runTransaction(db, async (transaction) => {
                            const childRef = doc(db, 'children', kid.id);
                            transaction.update(childRef, {
                                photoURL: downloadURL,
                                updatedAt: new Date()
                            });
                        });

                        toast.success('Foto de perfil atualizada com sucesso!');

                    } catch (err) {
                        console.error('Error updating child photo:', err);
                        toast.error('Erro ao atualizar a foto de perfil. Tente novamente.');
                    } finally {
                        setIsUploading(false);
                        setUploadProgress(null);
                    }
                }
            );
        } catch (error) {
            console.error('Error uploading child photo:', error);
            setIsUploading(false);
            setUploadProgress(null);
        }
    };

    return (
        <div className="flex items-center">
            {/* CARD */}
            <article className="card card-side bg-base-100 shadow-xl w-full rounded-xl p-0">
                {/* AVATAR */}
                <figure className="bg-neutral">
                    <div className="flex items-center justify-center cursor-pointer" onClick={handlePhotoClick}>
                        {photoURL ? (
                            <Image
                                src={photoURL}
                                alt={`${kid.firstName}'s photo`}
                                width={128}
                                height={128}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl text-neutral-content w-[128px] h-[128px] flex items-center justify-center">
                                {kid.firstName[0].toUpperCase()}{kid.lastName[0].toUpperCase()}
                            </span>
                        )}

                        <input
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
                        )}
                    </div>

                    {uploadProgress !== null && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}
                </figure>
                {/* BODY */}
                <div className="card-body p-0 mx-2 mt-2">
                    {/* CARD TITLE */}
                    <h2 className="card-title">
                        {kid.firstName} {kid.lastName}
                    </h2>
                    <div className='flex flex-row gap-1 text-wrap py-1'>
                        <div className="badge badge-sm badge-neutral">neutral</div>
                        <div className="badge badge-sm badge-primary">primary</div>
                    </div>

                    {/* CARD ACTIONS */}
                    <div className="card-actions justify-end">
                        <button className="btn btn-xs btn-outline btn-primary">
                            Detalhes
                        </button>
                    </div>
                </div>
            </article>
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
                console.error('Error fetching children:', error);
            } finally {
                setLoading(false);
            }
        };
        loadChildren();
    }, [parentId]);

    if (loading) return <div className="w-full h-48 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
    </div>;

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
                console.error('Error fetching child photo:', error);
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
            <div className="flex items-center justify-center cursor-pointer" onClick={handlePhotoClick}>
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
                        {kid.firstName[0].toUpperCase()}{kid.lastName[0].toUpperCase()}
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
                console.error('Error fetching children:', error);
            } finally {
                setLoading(false);
            }
        };
        loadChildren();
    }, [parentId]);

    if (loading) return <div className="w-full h-48 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
    </div>;

    if (!kidsArray.length) return null;

    return (
        <div className="grid grid-cols-2 gap-4">
            {kidsArray.map((kid) => (
                <div key={kid.id} className="bg-neutral flex flex-col justify-center rounded-xl shadow-xl">
                    <ChildCardMobile kid={kid} />
                </div>
            ))}
        </div>
    );
};

export default function HomePage() {
    const { userData } = useUser();
    const [isMobile, setIsMobile] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

    // Sample events
    const events = [
        {
            id: '1',
            date: dayjs().format('YYYY-MM-DD'),
            color: '#6366F1' // indigo
        },
        {
            id: '2',
            date: dayjs().format('YYYY-MM-DD'),
            color: '#EC4899' // pink
        },
        {
            id: '3',
            date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            color: '#8B5CF6' // purple
        },
        {
            id: '4',
            date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
            color: '#10B981' // emerald
        },
        {
            id: '5',
            date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
            color: '#F59E0B' // amber
        },
        {
            id: '6',
            date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
            color: '#F59E0B' // amber
        },
        {
            id: '7',
            date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
            color: '#F59E0B' // amber
        },
        {
            id: '8',
            date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
            color: '#F59E0B' // amber
        }
    ];

    const handleDateSelect = (date: Dayjs) => {
        setSelectedDate(date);
        console.log('Selected date:', date.format('YYYY-MM-DD'));
    };

    useEffect(() => {
        const checkMobileScreen = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobileScreen();
        window.addEventListener('resize', checkMobileScreen);
        return () => window.removeEventListener('resize', checkMobileScreen);
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
        <div className='flex flex-col mb-[10em] sm:mb-0 sm:p-6 sm:gap-6 bg-base-300'>
            {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                BACKGROUND IMAGE 
             - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
            <div className="flex flex-col relative bg-base-100 sm:rounded-3xl shadow-xl">
                {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                    PROFILE BAR 
                - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
                <section className="flex flex-col sm:mb-[2em]">
                    {/* <div className=" z-[10]">
                        <UserProfileBar pathname="Meu Lar" />
                    </div> */}
                    <UserProfileCard userData={userData} />
                </section>
            </div>
            {/* - - - - - - - - - - - - - - - - - - - - - - - - - - -
                CONTENT BAR 
             - - - - - - - - - - - - - - - - - - - - - - - - - - - */}
            <article className="flex flex-col bg-base-100 sm:rounded-3xl z-[10]">
                <div className="flex flex-col gap-0 sm:gap-4 sm:flex-row ">
                    {/* - - - - - - - - - - - - CALENDAR - - - - - - - - - - - - */}
                    <section className="container mx-auto p-4">
                        {isMobile ? (
                            <div className='flex flex-col'>
                                {/* <p className='text-4xl text-gray-700 font-raleway'>
                                    Planeje-se para a semana
                                </p> */}
                                <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
                                    <div className='flex flex-col gap-2'>
                                        <h2 className='text-4xl font-raleway text-secondaryGreen font-semibold'>
                                            Planeje-se para a semana
                                        </h2>
                                        <p className="text-xs text-gray-700 font-raleway">
                                            Consulte dias de convivência e agende eventos de forma compartilhada.
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
                                    <div className='flex flex-col gap-2 '>
                                        <h2 className="text-3xl font-bold z-10 font-playfair max-w-[66%]">
                                            Calendário
                                        </h2>
                                        <p className="text-xs text-gray-700 font-raleway">
                                            Consulte dias de convivência e agende eventos de forma compartilhada.
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
                                <div className='flex flex-col gap-2 pb-2'>
                                    {/* <h2 className="text-4xl font-bold z-10 font-playfair max-w-[66%]">
                                        Petiz
                                    </h2> */}
                                    {/* <p className='text-4xl text-gray-700 font-raleway'>
                                        Cuide dos seus amores
                                    </p> */}
                                    <div className="flex items-center justify-between px-2 rounded-lg relative mx-auto h-[8em]">
                                    <div className='flex flex-col gap-2'>
                                        <h2 className='text-4xl font-raleway text-warning font-semibold'>
                                            Cuide dos seus pequenos
                                        </h2>
                                        <p className="text-xs text-gray-700 font-raleway">
                                            Adicione, edite e acompanhe as principais informações sobre seus filhos.
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
                                    <div className='flex flex-col gap-2'>
                                        <h2 className="text-3xl font-bold z-10 font-playfair max-w-[66%]">
                                            Petiz
                                        </h2>
                                        <p className="text-xs text-gray-700 font-raleway">
                                            Educação, Saúde, Hobbies e outras informações essenciais sobre seus filhos.
                                        </p>
                                    </div>
                                    <Image
                                        src={family_img}
                                        alt="Background"
                                        priority
                                        quality={75}
                                        className="object-contain"
                                        width={128} />
                                </div>
                                <div className="bg-base-100 rounded-xl">
                                    <div className='py-4'>
                                        <KidsGrid parentId={userData.uid} />
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>
                {/* - - - - - - - - - - - - SUPPORT NETWORK - - - - - - - - - - - - */}
                <section className="container mx-auto p-4">
                    <div className="flex items-center justify-between px-2 rounded-lg bg-purpleShade01 relative mx-auto shadow-xl h-[8em]">
                        <div className='flex flex-col gap-2'>
                            <h2 className="text-2xl font-bold z-10 font-playfair max-w-[75%] text-white">
                                Rede de Apoio
                            </h2>
                            <p className="text-xs text-gray-700 font-raleway z-10 max-w-[66%] text-white">
                                Pessoas queridas que provam que juntos somos mais fortes!
                            </p>
                        </div>
                        <Image
                            src={support_img}
                            alt="Background"
                            priority
                            quality={75}
                            className="object-contain absolute right-0 bottom-0"
                            height={isMobile ? 96 : 128}
                        />
                    </div>
                    <div className="hidden sm:block bg-base-100 rounded-xl shadow-xl">
                        <FriendList userId={userData.uid} />
                        <FriendSearch />
                        <FriendRequests />
                    </div>
                </section>
            </article>
        </div>
    );
}