// // src/components/GenericCRUD.tsx
// 'use client';

// import React, { useEffect, useState } from 'react';
// import { DocumentData, QueryConstraint } from 'firebase/firestore';
// import { useFirestore } from '@components/crud/useFirestore';

// interface GenericCRUDProps<T extends DocumentData> {
//   collectionName: string;
//   initialData?: T;
//   renderItem: (item: { id: string; data: T }, handlers: CRUDHandlers<T>) => React.ReactNode;
//   renderForm: (
//     formData: T,
//     setFormData: React.Dispatch<React.SetStateAction<T>>,
//     handlers: CRUDHandlers<T>,
//     isEditing: boolean
//   ) => React.ReactNode;
//   defaultFormData: T;
//   queryConstraints?: QueryConstraint[];
// }

// interface CRUDHandlers<T extends DocumentData> {
//   handleCreate: (data: T) => Promise<{ id: string; data: T }>;
//   handleUpdate: (id: string, data: Partial<T>) => Promise<void>;
//   handleDelete: (id: string) => Promise<void>;
//   handleEdit: (item: { id: string; data: T }) => void;
//   handleCancel: () => void;
// }

// export function GenericCRUD<T extends DocumentData>({
//   collectionName,
//   // initialData,
//   renderItem,
//   renderForm,
//   defaultFormData,
//   queryConstraints = []
// }: GenericCRUDProps<T>) {
//   const [formData, setFormData] = useState<T>(defaultFormData);
//   const [editingId, setEditingId] = useState<string | null>(null);
  
//   const {
//     data,
//     error,
//     isLoading,
//     createDocument,
//     updateDocument,
//     deleteDocument,
//     getAllDocuments
//   } = useFirestore<T>(collectionName);

//   useEffect(() => {
//     // Load all documents when component mounts
//     getAllDocuments(queryConstraints);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [collectionName]);

//   const resetForm = () => {
//     setFormData(defaultFormData);
//     setEditingId(null);
//   };

//   const handleCreate = async (data: T) => {
//     const result = await createDocument(data);
//     resetForm();
//     return result;
//   };

//   const handleUpdate = async (id: string, data: Partial<T>) => {
//     await updateDocument(id, data);
//     resetForm();
//     getAllDocuments(queryConstraints);
//   };

//   const handleDelete = async (id: string) => {
//     if (confirm('Are you sure you want to delete this item?')) {
//       await deleteDocument(id);
//       getAllDocuments(queryConstraints);
//     }
//   };

//   const handleEdit = (item: { id: string; data: T }) => {
//     setFormData(item.data);
//     setEditingId(item.id);
//   };

//   const handleCancel = () => {
//     resetForm();
//   };

//   const handlers: CRUDHandlers<T> = {
//     handleCreate,
//     handleUpdate,
//     handleDelete,
//     handleEdit,
//     handleCancel
//   };

//   if (error) {
//     return <div className="error-message">Error: {error.message}</div>;
//   }

//   return (
//     <div className="generic-crud">
//       <div className="crud-form">
//         {renderForm(formData, setFormData, handlers, !!editingId)}
//       </div>
      
//       {isLoading && <div className="loading">Loading...</div>}
      
//       <div className="items-list">
//         {data?.map(item => (
//           <div key={item.id} className="item">
//             {renderItem(item, handlers)}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }