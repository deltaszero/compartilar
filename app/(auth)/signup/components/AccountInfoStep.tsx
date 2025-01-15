// components/AccountInfoStep.tsx

// importing modules
import { useSignupForm } from '@auth/signup/hooks/useSignupForm';
// importing assets
// import InfoIcon from '@assets/icons/help_info.svg';


export const AccountInfoStep = () => {
    const { formData, updateFormData } = useSignupForm();

    return (
        <div className="space-y-4">
            <div className="form-control flex flex-col gap-6">
            {/* <div className="space-y-4 max-w-2xl mx-auto"> */}
                <div className="divider">
                    <p className="text-xs text-gray-500">
                        Quem é você e como poderemos entrar em contato
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {/* name */}
                    <div className="flex flex-col">
                        <label className="label">
                            <span className="label-text">Nome <span className="text-xs text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered rounded-md"
                            value={formData.firstName || ''}
                            onChange={(e) => updateFormData({ firstName: e.target.value })}
                            required
                        />
                    </div>
                    {/* last name */}
                    <div className="flex flex-col">
                        <label className="label">
                            <span className="label-text">Sobrenome <span className="text-xs text-red-500">*</span></span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered rounded-md"
                            value={formData.lastName || ''}
                            onChange={(e) => updateFormData({ lastName: e.target.value })}
                            required
                        />
                    </div>
                </div>
                {/* <div className="divider">
                    <p className="text-xs text-gray-500">
                        Além do seu e-mail, como podemos entrar em contato com você
                    </p>
                </div> */}
                <div className="grid grid-cols-3 gap-4">
                    {/* birth date */}
                    <div className="flex flex-col">
                        <label className="label">
                            <span className="label-text">Data de Nascimento <span className="text-xs text-red-500">*</span></span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered rounded-md"
                            value={formData.birthDate || ''}
                            onChange={(e) => updateFormData({ birthDate: e.target.value })}
                            required
                        />
                    </div>
                    {/* genre */}
                    <div className="flex flex-col">
                        <label className="label">
                            <span className="label-text">Gênero</span>
                        </label>
                        <select
                            className="select select-bordered rounded-md"
                            // value={formData.genre || ''}
                            // onChange={(e) => updateFormData({ genre: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    {/* phone number */}
                    <div className="flex flex-col">
                        <label className="label">
                            <span className="label-text">Telefone</span>
                        </label>
                        <input
                            type="tel"
                            className="input input-bordered rounded-md"
                            value={formData.phoneNumber || ''}
                            onChange={(e) => updateFormData({ phoneNumber: e.target.value })}
                            required
                        />
                        <div className="form-control">
                            <label className="label cursor-pointer">
                                <span className="text-xs text-gray-500">Também é meu número de WhatsApp</span>
                                <input type="checkbox" defaultChecked className={`checkbox checkbox-secondary rounded-md`} />
                            </label>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-end mt-12">
                        <p className="text-xs text-red-500">
                            * Campos obrigatórios
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};