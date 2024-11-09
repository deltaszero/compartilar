// components/BasicInfoStep.tsx
import { useSignupForm } from '../hooks/useSignupForm';

export const BasicInfoStep = () => {
    const { formData, updateFormData } = useSignupForm();

    return (
        <div className="space-y-4">
            <div className="form-control">
                {/* e-mail */}
                <label className="label">
                    <span className="label-text">Email</span>
                </label>
                <input
                    type="email"
                    className="input input-bordered"
                    value={formData.email || ''}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                />
                {/* password */}
                <label className="label">
                    <span className="label-text">Senha</span>
                </label>
                <input
                    type="password"
                    className="input input-bordered"
                    value={formData.password || ''}
                    onChange={(e) => updateFormData({ password: e.target.value })}
                />
                {/* username */}
                <label className="label">
                    <span className="label-text">Nome de Usuário</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered"
                    value={formData.username || ''}
                    onChange={(e) => updateFormData({ username: e.target.value })}
                />
            </div>
        </div>
    );
};