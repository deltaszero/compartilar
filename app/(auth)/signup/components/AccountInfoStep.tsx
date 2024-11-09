// components/AccountInfoStep.tsx
import { useSignupForm } from '../hooks/useSignupForm';

export const AccountInfoStep = () => {
    const { formData, updateFormData } = useSignupForm();

    return (
        <div className="space-y-4 max-w-md">
            <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Nome</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered"
                        value={formData.firstName || ''}
                        onChange={(e) => updateFormData({ firstName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Sobrenome</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered"
                        value={formData.lastName || ''}
                        onChange={(e) => updateFormData({ lastName: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Telefone</span>
                </label>
                <input
                    type="tel"
                    className="input input-bordered"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                    required
                />
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Data de Nascimento</span>
                </label>
                <input
                    type="date"
                    className="input input-bordered"
                    value={formData.birthDate || ''}
                    onChange={(e) => updateFormData({ birthDate: e.target.value })}
                    required
                />
            </div>
        </div>
    );
};