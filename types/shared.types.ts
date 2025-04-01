// types/shared.types.ts
import { Timestamp } from 'firebase/firestore';

// Geolocation check-in types
export interface GeoLocation {
  id: string;
  userId: string;
  username: string;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: Timestamp;
  address?: string;
  deviceInfo?: {
    browser: string;
    platform: string;
    mobile: boolean;
  };
  sharedWith?: string[]; // Array of user IDs this location is shared with
  eventId?: string; // Optional reference to a calendar event
  note?: string; // Optional user note
}

// Notification system types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: Timestamp;
  metadata?: NotificationMetadata;
  actionUrl?: string;
}

export type NotificationType = 
  | 'friend_request' 
  | 'event_reminder' 
  | 'message' 
  | 'expense' 
  | 'task' 
  | 'decision'
  | 'system';

export type NotificationMetadata = 
  | FriendRequestMetadata
  | EventReminderMetadata
  | MessageMetadata
  | ExpenseMetadata
  | TaskMetadata
  | DecisionMetadata
  | SystemMetadata;

export interface FriendRequestMetadata {
  senderId: string;
  senderUsername: string;
  senderPhotoURL?: string;
  requestId: string;
  relationshipType: string;
}

export interface EventReminderMetadata {
  eventId: string;
  eventTitle: string;
  startTime: Timestamp;
  category: string;
  childId?: string;
}

export interface MessageMetadata {
  conversationId: string;
  senderId: string;
  senderName: string;
  messagePreview: string;
}

export interface ExpenseMetadata {
  expenseId: string;
  amount: number;
  category: string;
  paidBy: string;
}

export interface TaskMetadata {
  taskId: string;
  dueDate: Timestamp;
  priority: string;
  assignedTo: string;
}

export interface DecisionMetadata {
  decisionId: string;
  category: string;
  dueDate?: Timestamp;
}

export interface SystemMetadata {
  category: 'update' | 'security' | 'account' | 'other';
  severity: 'info' | 'warning' | 'critical';
}

// Form state type for window augmentation
interface FormState {
  [key: string]: string | number | boolean | null | undefined | FormState;
}

// Extend Window with formState for conditional form display
declare global {
  interface Window {
    formState?: Record<string, FormState>;
  }
}

// Parental Plan types
export interface ParentalPlan {
    id: string;
    userId: string; // Creator ID
    title: string;
    description?: string;
    children: string[]; // Array of child IDs
    referenceHome: 'Mãe' | 'Pai' | 'Outro' | 'Alternado';
    guardType: 'Unilateral' | 'Compartilhada';
    // Alimony when employed
    employedAlimony: {
        inMoney: boolean;
        moneyMethod?: 'Deposito' | 'Desconto';
        obligations: boolean;
        paymentServices: boolean;
        reimbursement: boolean;
    };
    // Alimony when unemployed
    unemployedAlimony: {
        inMoney: boolean;
        moneyMethod?: 'Deposito' | 'Desconto';
        obligations: boolean;
        paymentServices: boolean;
        reimbursement: boolean;
    };
    status: 'draft' | 'active' | 'inactive' | 'archived';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Calendar-related types
export interface CalendarEvent {
    id: string;
    childId: string;
    title: string;
    description?: string;
    startDate: Timestamp;
    endDate?: Timestamp;
    location?: {
        address: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    category?: 'school' | 'medical' | 'activity' | 'visitation' | 'other';
    isPrivate: boolean;
    checkInRequired?: boolean;
    checkInStatus?: 'pending' | 'completed' | 'missed';
    responsibleParentId?: string; // Added this property
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    updatedBy?: string;
}

// New subcollection events schema
export interface ChildEvent extends CalendarEvent {
    // This extends CalendarEvent with child-specific fields
    attendees?: string[]; // Optional list of people attending
    reminder?: {
        enabled: boolean;
        reminderTime: number; // minutes before event
    };
    recurrence?: {
        type: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number; // Every X days/weeks/months/years
        endDate?: Timestamp;
        occurrences?: number;
    };
}

// Task-related types
export interface SharedTask {
    id: string;
    coParentingId: string;
    childId?: string;
    title: string;
    description?: string;
    dueDate: Timestamp;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
    category: 'school' | 'medical' | 'activity' | 'household' | 'other';
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Expense-related types
export interface SharedExpense {
    id: string;
    coParentingId: string;
    childId?: string;
    description: string;
    amount: number;
    currency: string;
    category: 'education' | 'medical' | 'activities' | 'clothing' | 'other';
    paidBy: string;
    splitRatio: {
        [parentId: string]: number; // Percentage of expense
    };
    receipt?: {
        url: string;
        uploadedAt: Timestamp;
    };
    status: 'pending' | 'settled' | 'disputed';
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Message-related types
export interface SharedMessage {
    id: string;
    coParentingId: string;
    senderId: string;
    content: string;
    attachments?: {
        type: 'image' | 'document' | 'audio';
        url: string;
        name: string;
    }[];
    readBy: {
        [userId: string]: Timestamp;
    };
    createdAt: Timestamp;
}

// Decision-related types
export interface SharedDecision {
    id: string;
    coParentingId: string;
    childId?: string;
    title: string;
    description: string;
    category: 'education' | 'medical' | 'activities' | 'lifestyle' | 'other';
    status: 'pending' | 'approved' | 'rejected' | 'modified';
    responses: {
        [parentId: string]: {
            response: 'approve' | 'reject' | 'modify';
            comment?: string;
            timestamp: Timestamp;
        };
    };
    dueDate?: Timestamp;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
