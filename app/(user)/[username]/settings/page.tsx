// app/settings/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
// import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useUser } from '@context/userContext';
// import { auth, db, storage } from '@lib/firebaseConfig';
// import { User, updateProfile } from 'firebase/auth';
// import Image from 'next/image';

export default function SettingsPage() {
    const { user, userData, loading } = useUser();
    const router = useRouter();

    const [username, setUsername] = useState(userData?.username || '');
    const [email] = useState(userData?.email || '');
    // const [photoURL, setPhotoURL] = useState(userData?.photoURL || '');
    // const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    // const [message, setMessage] = useState('');
    // const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        try {
            console.log('Saving profile...');
            e.preventDefault();
            setSaving(true);
            console.log('connecting to db');
            // const usernamesRef = collection(db, 'account_info');
            // const q = query(usernamesRef, where('username', '==', username));
            // const querySnapshot = await getDocs(q);
            console.log('done');

        //     if (!querySnapshot.empty && userData?.username !== username) {
        //         alert('Nome de usuário já está em uso. Por favor, escolha outro.');
        //         setSaving(false);
        //         return;
        //     }

        //     let updatedPhotoURL = photoURL;

        //     if (photoFile) {
        //         const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
        //         if (!photoFile.type.startsWith('image/')) {
        //             alert('Por favor, selecione um arquivo de imagem válido.');
        //             setSaving(false);
        //             return;
        //         }
        //         if (photoFile.size > MAX_FILE_SIZE) {
        //             alert('O arquivo é muito grande. O tamanho máximo é de 2MB.');
        //             setSaving(false);
        //             return;
        //         }

        //         const storageRef = ref(storage, `profile_photos/${user.uid}`);
        //         const uploadTask = uploadBytesResumable(storageRef, photoFile);
        //         await new Promise<void>((resolve, reject) => {
        //             uploadTask.on(
        //                 'state_changed',
        //                 (snapshot) => {
        //                     const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        //                     setUploadProgress(progress);
        //                 },
        //                 (error) => {
        //                     console.error('Upload error:', error);
        //                     reject(error);
        //                 },
        //                 async () => {
        //                     updatedPhotoURL = await getDownloadURL(uploadTask.snapshot.ref);
        //                     resolve();
        //                 }
        //             );
        //         });
        //     }

        //     // Update user data in Firestore
        //     const userDocRef = doc(db, 'account_info', user.uid);
        //     await updateDoc(userDocRef, {
        //         username,
        //         photoURL: updatedPhotoURL,
        //     });

        //     // Update the Firebase Auth display name and photoURL
        //     try {
        //         await user.updateProfile({
        //             displayName: username,
        //             photoURL: updatedPhotoURL,
        //         });
        //     } catch (error) {
        //         console.error('Error updating Firebase Auth profile:', error);
        //         // Handle error (e.g., prompt user to re-authenticate)
        //     }

        //     // Refresh user data in context
            // await refreshUserData();

        //     setMessage('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Ocorreu um erro ao atualizar o perfil.');
        } finally {
            setSaving(false);
            // setUploadProgress(null);
        }
    };

    return (
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
                        // onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
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
    );
}