// components/BasicInfoStep.tsx
import { useSignupForm } from '@auth/signup/hooks/useSignupForm';

export const BasicInfoStep = () => {
    const { formData, updateFormData } = useSignupForm();

    return (
        <div className="space-y-4">
            <div className="form-control flex flex-col gap-6">
                {/* e-mail */}
                <div className="flex flex-col w-full">
                    <label className="label">
                        <span className="label-text">Email</span>
                    </label>
                    <input
                        type="email"
                        className="input input-bordered rounded-md"
                        value={formData.email || ''}
                        onChange={(e) => updateFormData({ email: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                        Seu email será usado para fazer login, recuperar senha e receber notificações importantes 😊
                    </p>
                </div>
                {/* password */}
                <div className="flex flex-col w-full">
                    <label className="label">
                        <span className="label-text">Senha</span>
                    </label>
                    <input
                        type="password"
                        className="input input-bordered rounded-md"
                        value={formData.password || ''}
                        onChange={(e) => updateFormData({ password: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                        A senha deve ter no mínimo 8 caracteres.
                    </p>
                </div>
                {/* username */}
                <div className="flex flex-col w-full">
                    <label className="label">
                        <span className="label-text">Nome de Usuário</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered rounded-md"
                        value={formData.username || ''}
                        onChange={(e) => updateFormData({ username: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                        Por favor, evite escolher nomes contendo caracteres especiais e espaços.
                    </p>
                </div>
            </div>
        </div>
    );
};