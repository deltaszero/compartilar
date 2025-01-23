// // app/(auth)/signup/components/KidsInfoStep.tsx
// import React, { useState } from 'react';
// import { useSignupForm } from '../hooks/useSignupForm';
// import { KidInfo } from '@/types/signup.types';

// const KidsInfoStep: React.FC = () => {
//     const { formData, addKid, updateKid, removeKid } = useSignupForm();
//     const [newKid, setNewKid] = useState<KidInfo>({
//         id: '',
//         firstName: '',
//         lastName: '',
//         birthDate: '',
//         gender: null,
//         relationship: null,
//     });

//     const handleAddKid = () => {
//         if (newKid.firstName && newKid.lastName && newKid.birthDate) {
//             addKid({ ...newKid, id: Date.now().toString() });
//             setNewKid({
//                 id: '',
//                 firstName: '',
//                 lastName: '',
//                 birthDate: '',
//                 gender: null,
//                 relationship: null,
//             });
//         }
//     };

//     const handleUpdateKid = (kidId: string, updatedKid: Partial<KidInfo>) => {
//         updateKid(kidId, updatedKid);
//     };

//     const handleRemoveKid = (kidId: string) => {
//         removeKid(kidId);
//     };

//     return (
//         <div>
//             <h2>Kids Information</h2>
//             <div>
//                 <input
//                     type="text"
//                     placeholder="First Name"
//                     value={newKid.firstName}
//                     onChange={(e) => setNewKid({ ...newKid, firstName: e.target.value })}
//                 />
//                 <input
//                     type="text"
//                     placeholder="Last Name"
//                     value={newKid.lastName}
//                     onChange={(e) => setNewKid({ ...newKid, lastName: e.target.value })}
//                 />
//                 <input
//                     type="date"
//                     placeholder="Birth Date"
//                     value={newKid.birthDate}
//                     onChange={(e) => setNewKid({ ...newKid, birthDate: e.target.value })}
//                 />
//                 <button onClick={handleAddKid}>Add Kid</button>
//             </div>
//             <div>
//                 {Object.values(formData.kids).map((kid) => (
//                     <div key={kid.id}>
//                         <input
//                             type="text"
//                             value={kid.firstName}
//                             onChange={(e) => handleUpdateKid(kid.id, { firstName: e.target.value })}
//                         />
//                         <input
//                             type="text"
//                             value={kid.lastName}
//                             onChange={(e) => handleUpdateKid(kid.id, { lastName: e.target.value })}
//                         />
//                         <input
//                             type="date"
//                             value={kid.birthDate}
//                             onChange={(e) => handleUpdateKid(kid.id, { birthDate: e.target.value })}
//                         />
//                         <button onClick={() => handleRemoveKid(kid.id)}>Remove</button>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default KidsInfoStep;