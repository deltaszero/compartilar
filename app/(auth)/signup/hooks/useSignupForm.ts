// // app/(auth)/signup/hooks/useSignupForm.tsx
// import { useState } from 'react';
// import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore';
// import { SignupFormData, SignupStep, KidInfo } from '@/types/signup.types';
// import { auth, db } from '@/app/lib/firebaseConfig';

// export const useSignupForm = () => {
//     const [formData, setFormData] = useState<SignupFormData>({
//         email: '',
//         password: '',
//         confirmPassword: '',
//         username: '',
//         uid: '',
//         photoURL: '',
//         firstName: '',
//         lastName: '',
//         phoneNumber: '',
//         birthDate: '',
//         kids: {},
//     });

//     const [currentStep, setCurrentStep] = useState<SignupStep>('basic-info');
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const updateFormData = (newData: Partial<SignupFormData>) => {
//         setFormData((prevData) => ({
//             ...prevData,
//             ...newData,
//         }));
//     };

//     const addKid = (kid: KidInfo) => {
//         setFormData((prevData) => ({
//             ...prevData,
//             kids: {
//                 ...prevData.kids,
//                 [kid.id]: kid,
//             },
//         }));
//     };

//     const updateKid = (kidId: string, updatedKid: Partial<KidInfo>) => {
//         setFormData((prevData) => ({
//             ...prevData,
//             kids: {
//                 ...prevData.kids,
//                 [kidId]: {
//                     ...prevData.kids[kidId],
//                     ...updatedKid,
//                 },
//             },
//         }));
//     };

//     const removeKid = (kidId: string) => {
//         setFormData((prevData) => {
//             const updatedKids = { ...prevData.kids };
//             delete updatedKids[kidId];
//             return {
//                 ...prevData,
//                 kids: updatedKids,
//             };
//         });
//     };

//     const submitForm = async () => {
//         setIsSubmitting(true);
//         setError(null);

//         try {
//             // Create user with email and password
//             const userCredential = await createUserWithEmailAndPassword(
//                 auth,
//                 formData.email,
//                 formData.password
//             );

//             const user = userCredential.user;

//             // Update user profile with additional information
//             await updateProfile(user, {
//                 displayName: formData.username,
//                 photoURL: formData.photoURL,
//             });

//             // Save user data to Firestore
//             const userDocRef = doc(db, 'users', user.uid);
//             await setDoc(userDocRef, {
//                 uid: user.uid,
//                 email: formData.email,
//                 username: formData.username,
//                 photoURL: formData.photoURL,
//                 firstName: formData.firstName,
//                 lastName: formData.lastName,
//                 phoneNumber: formData.phoneNumber,
//                 birthDate: formData.birthDate,
//                 kids: formData.kids,
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//             });

//             // Redirect to home page after successful signup
//             window.location.href = '/';
//         } catch (err) {
//             if (err instanceof Error) {
//                 setError(err.message);
//             } else {
//                 setError('An error occurred. Please try again later.');
//             }
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     return {
//         formData,
//         updateFormData,
//         addKid,
//         updateKid,
//         removeKid,
//         currentStep,
//         setCurrentStep,
//         submitForm,
//         isSubmitting,
//         error,
//         setFormData
//     };
// };