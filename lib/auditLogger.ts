import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

/**
 * Actions that can be logged in the audit system
 */
export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'permission_add' 
  | 'permission_remove' 
  | 'login' 
  | 'logout' 
  | 'access'
  | 'soft_delete'
  | 'restore';

/**
 * Resource types that can be tracked
 */
export type ResourceType = 
  | 'child' 
  | 'user' 
  | 'auth' 
  | 'system'
  | 'finance'
  | 'calendar'
  | 'chat';

/**
 * Core audit log entry structure
 */
export interface AuditLogEntry {
  timestamp: any; // Will be serverTimestamp()
  userId: string;
  userDisplayName?: string;
  userEmail?: string;
  clientInfo?: {
    ipAddress?: string;
    userAgent?: string;
    geoLocation?: string;
  };
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string;
  resourceName?: string;
  details: {
    operation: string;
    fields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    notes?: string;
  };
  path?: string; // Resource path in database
  isUnusualActivity?: boolean;
}

/**
 * Logs an event to the central audit log system
 * This is intentionally designed to never throw errors to avoid affecting main operations
 */
export async function logAuditEvent({
  userId,
  userDisplayName,
  userEmail,
  action,
  resourceType,
  resourceId,
  resourceName,
  details,
  path
}: Omit<AuditLogEntry, 'timestamp' | 'clientInfo' | 'isUnusualActivity'>) {
  try {
    // Collect client metadata where possible
    let clientInfo = {};
    
    if (typeof window !== 'undefined') {
      clientInfo = {
        userAgent: navigator.userAgent,
        // Note: IP address and geolocation require server-side 
        // implementation or a third-party service
      };
    }
    
    // Create the audit log entry
    const auditLogRef = collection(db, 'audit_logs');
    await addDoc(auditLogRef, {
      timestamp: serverTimestamp(),
      userId,
      userDisplayName,
      userEmail,
      clientInfo,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      path,
      isUnusualActivity: false // To be determined by Cloud Functions or admin review
    });
    
    console.log(`Audit log created for ${action} on ${resourceType} ${resourceId}`);
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Error creating audit log:', error);
  }
}

/**
 * Special utility function for logging child-related operations
 */
export async function logChildAudit({
  userId,
  userDisplayName,
  childId,
  childName,
  action,
  details
}: {
  userId: string;
  userDisplayName?: string;
  childId: string;
  childName?: string;
  action: AuditAction;
  details: AuditLogEntry['details'];
}) {
  return logAuditEvent({
    userId,
    userDisplayName,
    action,
    resourceType: 'child',
    resourceId: childId,
    resourceName: childName,
    details,
    path: `children/${childId}`
  });
}

/**
 * Utility function for logging permission changes
 */
export async function logPermissionChange({
  userId,
  userDisplayName,
  targetType,
  targetId,
  targetName,
  action,
  targetUserId,
  targetUserName,
  role
}: {
  userId: string;
  userDisplayName?: string;
  targetType: ResourceType;
  targetId: string;
  targetName?: string;
  action: 'permission_add' | 'permission_remove';
  targetUserId: string;
  targetUserName?: string;
  role: string;
}) {
  return logAuditEvent({
    userId,
    userDisplayName,
    action,
    resourceType: targetType,
    resourceId: targetId,
    resourceName: targetName,
    details: {
      operation: `${action === 'permission_add' ? 'Added' : 'Removed'} ${role} permission`,
      fields: [role],
      newValues: action === 'permission_add' ? { [role]: targetUserId } : undefined,
      oldValues: action === 'permission_remove' ? { [role]: targetUserId } : undefined,
      notes: `${action === 'permission_add' ? 'Granted' : 'Removed'} ${role} access for user ${targetUserName || targetUserId}`
    },
    path: `${targetType}/${targetId}`
  });
}