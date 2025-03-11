import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { logAuditEvent } from './auditLogger';

/**
 * Soft deletes a document instead of permanently removing it
 * @param collectionName The collection containing the document
 * @param documentId The ID of the document to soft delete
 * @param userId The ID of the user performing the deletion
 * @param userDisplayName Optional display name of the user
 * @param reason Optional reason for deletion
 * @param resourceName Optional human-readable name of the resource 
 * @returns Promise resolving to success/failure
 */
export async function softDeleteDocument(
  collectionName: string,
  documentId: string,
  userId: string,
  userDisplayName?: string,
  reason?: string,
  resourceName?: string
): Promise<boolean> {
  try {
    // First, get the current document to preserve its data
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error(`Document ${documentId} not found in ${collectionName}`);
      return false;
    }
    
    const currentData = docSnap.data();
    
    // Update the document to mark it as deleted
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      deletionReason: reason || 'No reason provided',
      // Preserve original data if not present
      _originalData: currentData._originalData || currentData,
    });
    
    // Log to audit system
    await logAuditEvent({
      userId,
      userDisplayName,
      action: 'soft_delete',
      resourceType: collectionName as any, // Cast to satisfy TypeScript
      resourceId: documentId,
      resourceName,
      details: {
        operation: 'soft_delete',
        oldValues: {
          isDeleted: false
        },
        newValues: {
          isDeleted: true,
          deletedAt: 'serverTimestamp()',
          deletedBy: userId
        },
        notes: reason || 'Document marked as deleted'
      },
      path: `${collectionName}/${documentId}`
    });
    
    return true;
  } catch (error) {
    console.error(`Error soft deleting document ${documentId}:`, error);
    return false;
  }
}

/**
 * Permanently deletes a document - should only be used by admins or for regulatory compliance
 * @param collectionName The collection containing the document
 * @param documentId The ID of the document to delete permanently
 * @param userId The ID of the user performing the deletion
 * @param userDisplayName Optional display name of the user
 * @param reason Required reason for permanent deletion
 * @param resourceName Optional human-readable name of the resource
 * @returns Promise resolving to success/failure
 */
export async function permanentlyDeleteDocument(
  collectionName: string,
  documentId: string,
  userId: string,
  userDisplayName?: string,
  reason?: string,
  resourceName?: string
): Promise<boolean> {
  if (!reason) {
    console.error('Permanent deletion requires a reason');
    return false;
  }
  
  try {
    // First, get the current document to log its metadata
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error(`Document ${documentId} not found in ${collectionName}`);
      return false;
    }
    
    // Log to audit system BEFORE deletion to ensure it's recorded
    await logAuditEvent({
      userId,
      userDisplayName,
      action: 'delete',
      resourceType: collectionName as any, // Cast to satisfy TypeScript
      resourceId: documentId,
      resourceName,
      details: {
        operation: 'permanent_delete',
        notes: `PERMANENT DELETION: ${reason}`
      },
      path: `${collectionName}/${documentId}`
    });
    
    // Now permanently delete the document
    await deleteDoc(docRef);
    
    return true;
  } catch (error) {
    console.error(`Error permanently deleting document ${documentId}:`, error);
    return false;
  }
}

/**
 * Restores a soft-deleted document
 * @param collectionName The collection containing the document
 * @param documentId The ID of the document to restore
 * @param userId The ID of the user performing the restoration
 * @param userDisplayName Optional display name of the user
 * @param resourceName Optional human-readable name of the resource
 * @returns Promise resolving to success/failure
 */
export async function restoreDocument(
  collectionName: string,
  documentId: string,
  userId: string,
  userDisplayName?: string,
  resourceName?: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error(`Document ${documentId} not found in ${collectionName}`);
      return false;
    }
    
    const data = docSnap.data();
    
    // Check if it's actually deleted
    if (!data.isDeleted) {
      console.log(`Document ${documentId} is not deleted, nothing to restore`);
      return true;
    }
    
    // Restore document by unsetting deletion flags
    const updateData: Record<string, any> = {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
      restoredAt: serverTimestamp(),
      restoredBy: userId
    };
    
    await updateDoc(docRef, updateData);
    
    // Log to audit system
    await logAuditEvent({
      userId,
      userDisplayName,
      action: 'restore',
      resourceType: collectionName as any,
      resourceId: documentId,
      resourceName,
      details: {
        operation: 'restore_deleted_document',
        oldValues: {
          isDeleted: true,
          deletedBy: data.deletedBy,
          deletionReason: data.deletionReason
        },
        newValues: {
          isDeleted: false,
          restoredAt: 'serverTimestamp()',
          restoredBy: userId
        },
        notes: `Document restored by ${userDisplayName || userId}`
      },
      path: `${collectionName}/${documentId}`
    });
    
    return true;
  } catch (error) {
    console.error(`Error restoring document ${documentId}:`, error);
    return false;
  }
}