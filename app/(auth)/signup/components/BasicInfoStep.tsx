// components/BasicInfoStep.tsx
import { useSignupForm } from '../hooks/useSignupForm';

export const BasicInfoStep = () => {
    const { formData, updateFormData } = useSignupForm();

    return (
        <div className="space-y-4">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Email</span>
                </label>
                <input
                    type="email"
                    className="input input-bordered"
                    value={formData.email || ''}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                />
            </div>
            {/* Add other basic info fields */}
        </div>
    );
};