# CompartiLar Observability and Audit Trail Improvements

## Overview
This document outlines recommendations to improve the auditability and observability of the CompartiLar application, with special focus on preventing malicious activity and ensuring data integrity for sensitive information related to children.

## High-Priority Improvements

### 1. System-wide Activity Logging

#### Implement a central audit log collection:
- Create a dedicated `audit_logs` collection in Firestore
- Log all critical operations, not just changes to children's records
- Each log should contain:
  - Timestamp (server timestamp to prevent tampering)
  - User ID and associated metadata (name, IP address)
  - Action type (create, update, delete, permission change)
  - Resource type and ID (child, user, etc.)
  - Before/after state for important fields
  - Request metadata (device, browser, geographic location)

#### Sample audit log structure:
```typescript
interface AuditLog {
  id: string;
  timestamp: Timestamp;
  userId: string;
  userDisplayName: string;
  ipAddress: string;
  geoLocation?: string;
  userAgent?: string;
  action: 'create' | 'update' | 'delete' | 'permission_add' | 'permission_remove' | 'login' | 'logout' | 'access';
  resourceType: 'child' | 'user' | 'auth' | 'system';
  resourceId: string;
  resourceName?: string;
  details: {
    operation: string;
    fields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    notes?: string;
  };
  isUnusualActivity?: boolean;
}
```

### 2. Soft Delete Implementation

Instead of permanently deleting records, implement a soft delete pattern:

1. Add `isDeleted` and `deletedAt` fields to all important records
2. Instead of using `deleteDoc()`, update the document with these fields:
   ```typescript
   await updateDoc(childRef, {
     isDeleted: true,
     deletedAt: serverTimestamp(),
     deletedBy: user.uid,
     deletionReason: reason // Optional field for accountability
   });
   ```
3. Modify queries to filter out deleted records by default
4. Create an admin view to see and potentially restore deleted records
5. Implement permanent deletion only as an admin function with special authorization

### 3. Data Integrity Verification

#### Document Hash Tracking
For critical documents like children's records:

1. Generate a cryptographic hash of critical fields when documents are created or updated
2. Store this hash in a separate, higher-security collection
3. Periodically verify document integrity by recomputing hashes

```typescript
// When updating a child record
const criticalFields = {
  firstName: childData.firstName,
  lastName: childData.lastName,
  birthDate: childData.birthDate,
  // Other critical fields
};

// Create a stable JSON representation (sorted keys)
const stableJson = JSON.stringify(criticalFields, Object.keys(criticalFields).sort());
const documentHash = sha256(stableJson);

// Store in a separate integrity collection
await setDoc(doc(db, 'document_integrity', childData.id), {
  documentType: 'child',
  lastHash: documentHash,
  lastVerified: serverTimestamp(),
  verifiedBy: 'system'
});
```

### 4. Comprehensive Authentication Logs

Enhance authentication logging:

1. Log all authentication events (login, logout, password changes)
2. Include device information, IP addresses, and geographic location
3. Implement alerts for unusual login patterns (new devices, locations)
4. Track failed login attempts and account lockouts

### 5. Real-time Monitoring and Alerts

Implement real-time monitoring and alerting:

1. Set up Firebase Security Rules to reject suspicious operations
2. Create Firebase Cloud Functions to monitor for unusual activity patterns
3. Implement alerts for:
   - Mass deletion or modification of records
   - Unusual permission changes
   - Login attempts from new locations
   - Rapid sequence of operations

## Medium-Priority Improvements

### 6. Admin Audit Dashboard

Create an admin dashboard that shows:

- Recent system activity logs
- Unusual activity alerts
- User session information
- Permission changes history
- Ability to compare document versions

### 7. Document Version History

For critical documents, maintain full version history:

1. Create a subcollection `versions` for important documents
2. On each update, copy the previous state to the version history
3. Allow administrators to view and compare document versions

### 8. Secure Backup Strategy

Implement a comprehensive backup strategy:

1. Schedule regular exports of Firestore data to secure cloud storage
2. Ensure backups are encrypted and access-controlled
3. Implement point-in-time recovery capability
4. Test restoration procedures regularly

## Implementation Plan

### Phase 1: Core Audit Infrastructure
1. Implement the central audit logging system
2. Modify CRUD operations to log to the audit system
3. Implement soft delete pattern for critical collections

### Phase 2: Integrity and Monitoring
1. Implement document hash verification system
2. Set up real-time monitoring and alerting
3. Enhance authentication logging

### Phase 3: Admin Tools and Compliance
1. Create the admin audit dashboard
2. Implement document version comparison
3. Document audit procedures for compliance purposes

## Example Implementation: Central Audit Logger

```typescript
// In a new file: lib/auditLogger.ts
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { getIpAddress, getGeoLocation } from '@/lib/geoUtils';

export async function logAuditEvent({
  userId,
  userDisplayName,
  action,
  resourceType,
  resourceId,
  resourceName,
  details
}: {
  userId: string;
  userDisplayName?: string;
  action: 'create' | 'update' | 'delete' | 'permission_add' | 'permission_remove' | 'login' | 'logout' | 'access';
  resourceType: 'child' | 'user' | 'auth' | 'system';
  resourceId: string;
  resourceName?: string;
  details: {
    operation: string;
    fields?: string[];
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    notes?: string;
  };
}) {
  try {
    // Get client metadata
    const ipAddress = await getIpAddress();
    const geoLocation = await getGeoLocation(ipAddress);
    const userAgent = navigator.userAgent;
    
    // Create the audit log entry
    const auditLogRef = collection(db, 'audit_logs');
    await addDoc(auditLogRef, {
      timestamp: serverTimestamp(),
      userId,
      userDisplayName,
      ipAddress,
      geoLocation,
      userAgent,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      isUnusualActivity: false // To be determined by Cloud Functions later
    });
    
    console.log(`Audit log created for ${action} on ${resourceType} ${resourceId}`);
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Error creating audit log:', error);
  }
}
```

## Legal and Compliance Considerations

For applications handling children's data with potential legal implications:

1. Consult legal counsel about data retention requirements in your jurisdiction
2. Implement appropriate data retention policies
3. Ensure audit logs are stored in compliance with relevant regulations
4. Consider implementing WORM (Write Once Read Many) storage for audit logs
5. Document all security measures and audit procedures

## Next Steps

1. Review and prioritize these recommendations
2. Create a detailed implementation plan
3. Begin with the highest priority items (central audit logging and soft delete)
4. Regularly review and improve the security and observability measures