// // app/(auth)/signup/components/BasicInfoStep.tsx

// import React from 'react';
// import { SignupFormData } from '@/types/signup.types';

// interface BasicInfoStepProps {
//     formData: Partial<SignupFormData>;
//     setFormData: React.Dispatch<React.SetStateAction<Partial<SignupFormData>>>;
// }

// const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ formData, setFormData }) => {
//     const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         setFormData((prevData: Partial<SignupFormData>) => ({
//             ...prevData,
//             [name]: value,
//         }));
//     };

//     // Initialize formData with default values to avoid undefined issues
//     const defaultFormData: Partial<SignupFormData> = {
//         email: '',
//         password: '',
//         username: '',
//     };

//     const currentFormData = { ...defaultFormData, ...formData };

//     return (
//         <div className="space-y-4">
//             <input
//                 type="email"
//                 name="email"
//                 value={currentFormData.email}
//                 onChange={handleInputChange}
//                 placeholder="Email"
//                 className="input input-bordered w-full"
//             />
//             <input
//                 type="password"
//                 name="password"
//                 value={currentFormData.password}
//                 onChange={handleInputChange}
//                 placeholder="Password"
//                 className="input input-bordered w-full"
//             />
//             <input
//                 type="text"
//                 name="username"
//                 value={currentFormData.username}
//                 onChange={handleInputChange}
//                 placeholder="Username"
//                 className="input input-bordered w-full"
//             />
//         </div>
//     );
// };

// export default BasicInfoStep;