// app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SettingsPage() {
    // get vars
    const { user, userData, loading } = useUser();
    const router = useRouter();
    // set vars
    const [username, setUsername] = useState(userData?.username || '');
    const [email] = useState(userData?.email || '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [photoURL, setPhotoURL] = useState(userData?.photoURL || '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [message, setMessage] = useState('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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
            console.log("if no changes detected")
            console.log(userData?.username, username, photoFile);
            if (userData?.username === username && !photoFile) {
                setMessage('Nenhuma alteração detectada.');
                setSaving(false);
                return;
            }
            let updatedPhotoURL = photoURL;
            const updatedData: { username?: string; photoURL?: string } = {};
            // begin a transaction
            console.log("begin a transaction")
            await runTransaction(db, async (transaction) => {
                // if username has changed
                console.log("if username has changed")
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
                console.log("handle photo upload")
                if (photoFile) {
                    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
                    if (!photoFile.type.startsWith('image/')) {
                        throw new Error('Por favor, selecione um arquivo de imagem válido.');
                    }
                    if (photoFile.size > MAX_FILE_SIZE) {
                        throw new Error('O arquivo é muito grande. O tamanho máximo é de 2MB.');
                    }
                    // upload photo to firebase storage
                    console.log("upload photo to firebase storage")
                    console.log(storage)
                    console.log(user)
                    console.log(user.uid)
                    const storageRef = ref(storage, `profile_photos/${user.uid}`);
                    const uploadTask = uploadBytesResumable(storageRef, photoFile);
                    // wait for the upload to complete
                    console.log("wait for the upload to complete")
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
                                updatedPhotoURL = await getDownloadURL(uploadTask.snapshot.ref);
                                updatedData.photoURL = updatedPhotoURL;
                                resolve();
                            }
                        );
                    });
                }
                // update account_info document
                console.log("update account_info document")
                if (Object.keys(updatedData).length > 0) {
                    const userDocRef = doc(db, 'account_info', user.uid);
                    transaction.update(userDocRef, updatedData);
                }
            });
            // update Firebase auth profile
            console.log("update Firebase Auth profile")
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
            // set success message
            setMessage('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error || 'Ocorreu um erro ao atualizar o perfil.');
        } finally {
            setSaving(false);
            setUploadProgress(null);
        }
    };

    return (
        <div className="h-screen flex flex-col">
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
                        {/* {photoURL && (
                            <img src={photoURL} alt="Foto de Perfil" className="mt-2 h-20 w-20 rounded-full" />
                        )} */}
                    </div>
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