// app/(user)/[username]/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    doc,
    runTransaction,
} from 'firebase/firestore';
import {
    getDownloadURL,
    ref,
    uploadBytesResumable
} from 'firebase/storage';
import {
    useUser,
} from '@context/userContext';
import {
    db,
    storage
} from '@lib/firebaseConfig';
import {
    updateProfile 
} from 'firebase/auth';
import toast from 'react-hot-toast';

import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";

export default function SettingsPage() {
    // get vars
    const { user, userData, loading } = useUser();
    const router = useRouter();
    // set vars
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    
    // Update form state when userData changes
    useEffect(() => {
        if (userData) {
            setUsername(userData.username || '');
            setEmail(userData.email || '');
            setPhotoURL(userData.photoURL || '');
        }
    }, [userData]);
    // rendering loading
    if (loading) {
        return <div>Loading...</div>;
    }
    // redirect if not logged in
    if (!user) {
        router.push('/login');
        return null;
    }
    // handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // if no changes detected
            if (userData?.username === username && !photoFile) {
                setMessage('Nenhuma alteração detectada.');
                setSaving(false);
                return;
            }
            let updatedPhotoURL = photoURL;
            const updatedData: { username?: string; photoURL?: string } = {};
            // begin a transaction
            await runTransaction(db, async (transaction) => {
                // if username has changed
                if (userData?.username !== username) {
                    const newUsernameRef = doc(db, 'usernames', username);
                    const newUsernameDoc = await transaction.get(newUsernameRef);
                    if (newUsernameDoc.exists()) {
                        throw new Error('Nome de usuário já está em uso. Por favor, escolha outro.');
                    }
                    // delete old username
                    if (userData?.username) {
                        const oldUsernameRef = doc(db, 'usernames', userData.username);
                        transaction.delete(oldUsernameRef);
                    }
                    // reserve new username
                    transaction.set(newUsernameRef, { uid: user.uid });
                    updatedData.username = username;
                }
                // handle photo upload
                if (photoFile) {
                    // Check if we have access to storage (client-side only)
                    if (typeof window === 'undefined' || !storage) {
                        throw new Error('Upload de fotos só é possível no navegador.');
                    }
                    
                    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
                    if (!photoFile.type.startsWith('image/')) {
                        throw new Error('Por favor, selecione um arquivo de imagem válido.');
                    }
                    if (photoFile.size > MAX_FILE_SIZE) {
                        throw new Error('O arquivo é muito grande. O tamanho máximo é de 2MB.');
                    }
                    // upload photo to firebase storage
                    const storageRef = ref(storage, `profile_photos/${user.uid}`);
                    const uploadTask = uploadBytesResumable(storageRef, photoFile);
                    // wait for the upload to complete
                    await new Promise<void>((resolve, reject) => {
                        uploadTask.on(
                            'state_changed',
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                setUploadProgress(progress);
                            },
                            (error) => {
                                console.error('Upload error:', error);
                                reject(error);
                            },
                            async () => {
                                try {
                                    updatedPhotoURL = await getDownloadURL(uploadTask.snapshot.ref);
                                    updatedData.photoURL = updatedPhotoURL;
                                    resolve();
                                } catch (err) {
                                    console.error('Error getting download URL:', err);
                                    reject(err);
                                }
                            }
                        );
                    });
                }
                // update account_info document
                if (Object.keys(updatedData).length > 0) {
                    const userDocRef = doc(db, 'account_info', user.uid);
                    transaction.update(userDocRef, updatedData);
                }
            });
            // update Firebase auth profile
            if (user) {
                const profileUpdates: { displayName?: string; photoURL?: string } = {};
                if (userData?.username !== username) {
                    profileUpdates.displayName = username;
                }
                if (updatedData.photoURL) {
                    profileUpdates.photoURL = updatedData.photoURL;
                }
                if (Object.keys(profileUpdates).length > 0) {
                    await updateProfile(user, profileUpdates);
                }
            } else {
                throw new Error('Usuário não está autenticado');
            }
            // set success message
            setMessage('Perfil atualizado com sucesso!');
            toast.success('Perfil atualizado com sucesso!');
        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            toast.error(error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar o perfil.');
        } finally {
            setSaving(false);
            setUploadProgress(null);
        }
    };

    return (
        <div className="h-screen flex flex-col">
             <UserProfileBar pathname='Configurações' />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">Configurações da Conta</h1>
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 max-w-md">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium">
                            Nome de usuário
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input input-bordered w-full"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            disabled
                            className="input input-bordered w-full"
                        />
                    </div>
                    <div>
                        <label htmlFor="photo" className="block text-sm font-medium">
                            Foto de Perfil
                        </label>
                        <input
                            type="file"
                            id="photo"
                            accept="image/*"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            className="file-input w-full"
                        />
                            <Image src={photoURL} alt="Foto de Perfil" width={80} height={80} className="mt-2 rounded-full object-cover" />
                            {/* <img src={photoURL} alt="Foto de Perfil" className="mt-2 h-20 w-20 rounded-full object-cover" />
                        )} */}
                        {uploadProgress !== null && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div 
                                    className="bg-primary h-2.5 rounded-full" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                    {message && (
                        <div className="alert alert-success">
                            <span>{message}</span>
                        </div>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    );
}