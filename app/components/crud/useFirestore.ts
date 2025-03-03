// // src/hooks/useFirestore.ts
// import { useState } from 'react';
// import { QueryConstraint, DocumentData, WhereFilterOp } from 'firebase/firestore';
// import { FirestoreService } from '@components/crud/firestoreService';

// type FirestoreStatus = 'idle' | 'loading' | 'success' | 'error';

// export function useFirestore<T extends DocumentData>(collectionName: string) {
//   const [status, setStatus] = useState<FirestoreStatus>('idle');
//   const [error, setError] = useState<Error | null>(null);
//   const [data, setData] = useState<Array<{ id: string; data: T }> | null>(null);
//   const [document, setDocument] = useState<{ id: string; data: T } | null>(null);
  
//   const service = new FirestoreService<T>({ collectionName });

//   const resetState = () => {
//     setStatus('idle');
//     setError(null);
//   };

//   // Create a document
//   const createDocument = async (documentData: T) => {
//     try {
//       setStatus('loading');
//       setError(null);
      
//       const result = await service.create(documentData);
      
//       setDocument(result);
//       setStatus('success');
      
//       return result;
//     } catch (err) {
//       setError(err as Error);
//       setStatus('error');
//       throw err;
//     }
//   };

//   // Get a document by ID
//   const getDocument = async (id: string) => {
//     try {
//       setStatus('loading');
//       setError(null);
      
//       const result = await service.getById(id);
      
//       setDocument(result);
//       setStatus('success');
      
//       return result;
//     } catch (err) {
//       setError(err as Error);
//       setStatus('error');
//       throw err;
//     }
//   };

//   // Get all documents
//   const getAllDocuments = async (constraints?: QueryConstraint[]) => {
//     try {
//       setStatus('loading');
//       setError(null);
      
//       const results = await service.getAll(constraints);
      
//       setData(results);
//       setStatus('success');
      
//       return results;
//     } catch (err) {
//       setError(err as Error);
//       setStatus('error');
//       throw err;
//     }
//   };

//   // Update a document
//   const updateDocument = async (id: string, documentData: Partial<T>) => {
//     try {
//       setStatus('loading');
//       setError(null);
      
//       await service.update(id, documentData);
      
//       // If we already have the document in state, update it
//       if (document && document.id === id) {
//         setDocument({
//           id,
//           data: { ...document.data, ...documentData } as T
//         });
//       }
      
//       setStatus('success');
//     } catch (err) {
//       setError(err as Error);
//       setStatus('error');
//       throw err;
//     }
//   };

//   // Delete a document
//   const deleteDocument = async (id: string) => {
//     try {
//       setStatus('loading');
//       setError(null);
      
//       await service.delete(id);
      
//       // If we have the document in state, clear it
//       if (document && document.id === id) {
//         setDocument(null);
//       }
      
//       // If we have data in state, remove the deleted document
//       if (data) {
//         setData(data.filter(item => item.id !== id));
//       }
      
//       setStatus('success');
//     } catch (err) {
//       setError(err as Error);
//       setStatus('error');
//       throw err;
//     }
//   };

//   // Helper methods for creating query constraints
//   const whereConstraint = (field: string, operator: WhereFilterOp, value: unknown) => {
//     return service.createWhereConstraint(field, operator, value);
//   };

//   const orderByConstraint = (field: string, direction: 'asc' | 'desc' = 'asc') => {
//     return service.createOrderByConstraint(field, direction);
//   };

//   const limitConstraint = (limitCount: number) => {
//     return service.createLimitConstraint(limitCount);
//   };

//   return {
//     // State
//     status,
//     error,
//     data,
//     document,
//     isLoading: status === 'loading',
//     isSuccess: status === 'success',
//     isError: status === 'error',
    
//     // CRUD operations
//     createDocument,
//     getDocument,
//     getAllDocuments,
//     updateDocument,
//     deleteDocument,
    
//     // Query constraint helpers
//     whereConstraint,
//     orderByConstraint,
//     limitConstraint,
    
//     // Utilities
//     resetState
//   };
// }