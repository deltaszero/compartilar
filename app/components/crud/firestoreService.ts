// // src/lib/firebase/firestoreService.ts
// import { 
//     collection,
//     doc,
//     getDoc,
//     getDocs,
//     addDoc,
//     updateDoc,
//     deleteDoc,
//     query,
//     where,
//     orderBy,
//     limit,
//     QueryConstraint,
//     DocumentData,
//     // FirestoreError
//   } from 'firebase/firestore';
//   import { db } from '@/app/lib/firebaseConfig'; // Your Firebase config file
  
//   interface FirestoreServiceOptions {
//     collectionName: string;
//   }
  
//   /**
//    * Generic Firestore CRUD service that can be used for any collection
//    */
//   export class FirestoreService<T extends DocumentData> {
//     private collectionName: string;
  
//     constructor(options: FirestoreServiceOptions) {
//       this.collectionName = options.collectionName;
//     }
  
//     // Create a new document
//     async create(data: T): Promise<{ id: string; data: T }> {
//       try {
//         const collectionRef = collection(db, this.collectionName);
//         const docRef = await addDoc(collectionRef, data);
//         return { id: docRef.id, data };
//       } catch (error) {
//         console.error(`Error creating document in ${this.collectionName}:`, error);
//         throw error;
//       }
//     }
  
//     // Get a document by ID
//     async getById(id: string): Promise<{ id: string; data: T } | null> {
//       try {
//         const docRef = doc(db, this.collectionName, id);
//         const docSnap = await getDoc(docRef);
        
//         if (docSnap.exists()) {
//           return { id: docSnap.id, data: docSnap.data() as T };
//         } else {
//           return null;
//         }
//       } catch (error) {
//         console.error(`Error getting document from ${this.collectionName}:`, error);
//         throw error;
//       }
//     }
  
//     // Get all documents from a collection with optional query constraints
//     async getAll(constraints?: QueryConstraint[]): Promise<Array<{ id: string; data: T }>> {
//       try {
//         let q = collection(db, this.collectionName);
        
//         if (constraints && constraints.length > 0) {
//           q = query(q, ...constraints);
//         }
        
//         const querySnapshot = await getDocs(query(q));
        
//         return querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           data: doc.data() as T
//         }));
//       } catch (error) {
//         console.error(`Error getting documents from ${this.collectionName}:`, error);
//         throw error;
//       }
//     }
  
//     // Update a document
//     async update(id: string, data: Partial<T>): Promise<void> {
//       try {
//         const docRef = doc(db, this.collectionName, id);
//         await updateDoc(docRef, data);
//       } catch (error) {
//         console.error(`Error updating document in ${this.collectionName}:`, error);
//         throw error;
//       }
//     }
  
//     // Delete a document
//     async delete(id: string): Promise<void> {
//       try {
//         const docRef = doc(db, this.collectionName, id);
//         await deleteDoc(docRef);
//       } catch (error) {
//         console.error(`Error deleting document from ${this.collectionName}:`, error);
//         throw error;
//       }
//     }
  
//     // Helper method to create query constraints
//     createWhereConstraint(field: string, operator: string, value: any): QueryConstraint {
//       return where(field, operator as any, value);
//     }
  
//     createOrderByConstraint(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
//       return orderBy(field, direction);
//     }
  
//     createLimitConstraint(limitCount: number): QueryConstraint {
//       return limit(limitCount);
//     }
//   }