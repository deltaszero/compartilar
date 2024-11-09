// components/ProfilePictureStep.tsx
import { useState, useRef } from 'react';
import { useSignupForm } from '../hooks/useSignupForm';
import Image from 'next/image';

export const ProfilePictureStep = () => {
    const { formData, updateFormData } = useSignupForm();
    const [previewUrl, setPreviewUrl] = useState<string>(formData.photoURL || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview URL
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
                        <svg className="w-12 h-12 text-gray-400" /* Add your placeholder icon SVG here */ />
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            <button
                className="btn btn-primary"
                onClick={() => fileInputRef.current?.click()}
            >
                {previewUrl ? 'Alterar Foto' : 'Escolher Foto'}
            </button>
        </div>
    );
};