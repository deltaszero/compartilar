// // utils/validation.ts
// export const validateBasicInfo = (data: Partial<SignupFormData>) => {
//     const errors: Record<string, string> = {};

//     if (!data.email) {
//         errors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(data.email)) {
//         errors.email = 'Invalid email format';
//     }

//     if (!data.password) {
//         errors.password = 'Password is required';
//     } else if (data.password.length < 6) {
//         errors.password = 'Password must be at least 6 characters';
//     }

//     if (!data.username) {
//         errors.username = 'Username is required';
//     } else if (data.username.length < 3) {
//         errors.username = 'Username must be at least 3 characters';
//     }

//     return errors;
// };

// export const validateAccountInfo = (data: Partial<SignupFormData>) => {
//     const errors: Record<string, string> = {};

//     if (!data.firstName) {
//         errors.firstName = 'First name is required';
//     }

//     if (!data.lastName) {
//         errors.lastName = 'Last name is required';
//     }

//     if (!data.phoneNumber) {
//         errors.phoneNumber = 'Phone number is required';
//     }

//     if (!data.birthDate) {
//         errors.birthDate = 'Birth date is required';
//     }

//     return errors;
// };