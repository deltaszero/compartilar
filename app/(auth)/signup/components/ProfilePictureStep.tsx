// components/ProfilePictureStep.tsx
// importing modules
import Image from 'next/image';
import { useState, useRef } from 'react';
// importing components
import { useSignupForm } from '@auth/signup/hooks/useSignupForm';
// importing assets
import CameraIcon from '@assets/icons/camera.svg';

export const ProfilePictureStep = () => {
    const { formData, updateFormData } = useSignupForm();
    const [previewUrl, setPreviewUrl] = useState<string>(formData.photoURL || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            updateFormData({ photoURL: url });
        }
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 relative rounded-full overflow-hidden border-2 border-gray-300">
                {previewUrl ? (
                    <Image
                        src={previewUrl}
                        alt="Profile preview"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <CameraIcon width={44} height={44} />
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-500">
                Você pode alterar sua foto de perfil a qualquer momento! Ela será visível <b>apenas</b> para sua rede de apoio 😊
            </p>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <button
                className="btn btn-primary rounded-md"
                onClick={() => fileInputRef.current?.click()}
            >
                {previewUrl ? 'Alterar Foto' : 'Escolher Foto'}
            </button>
        </div>
    );
};