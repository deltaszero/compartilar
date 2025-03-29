import { CalendarEvent, ChildEvent } from '@/types/shared.types';
import { Child } from '@/types/user.types';

// User permission levels for calendar
export type UserPermission = 'editor' | 'viewer';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEventWithChild[];
}

export interface CalendarEventWithChild extends CalendarEvent {
  childName?: string;
  childPhotoURL?: string;
  responsibleParentId?: string;
  canEdit?: boolean; // Whether the current user can edit this event
}

export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  category: 'school' | 'medical' | 'activity' | 'visitation' | 'other';
  childId: string;
  responsibleParentId: string;
  checkInRequired: boolean;
  isPrivate?: boolean; // Whether event is private to editors only
  
  // Recurrence fields
  recurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  recurrenceOccurrences?: number;
  
  // Reminder fields
  reminderEnabled?: boolean;
  reminderTime?: number; // minutes before event
  
  // Additional attendees
  attendees?: string[]; // Optional list of people attending
}

export interface CalendarProps {
  initialMonth?: Date;
  userId?: string;
  view?: 'month' | 'week' | 'day' | 'agenda'; // Added support for different views
  childFilter?: string[]; // Filter events by child
  categoryFilter?: string[]; // Filter events by category
}

export interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
  view: 'month' | 'week' | 'day' | 'agenda';
  onViewChange: (view: 'month' | 'week' | 'day' | 'agenda') => void;
}

export interface CalendarGridProps {
  days: CalendarDay[];
  onSelectDate: (date: Date) => void;
  onDoubleClick: (date: Date) => void;
  isLoading?: boolean;
}

export interface DayEventsProps {
  selectedDate: Date | null;
  events: CalendarEventWithChild[];
  onAddEvent: (date: Date) => void;
  onEditEvent: (date: Date, event: CalendarEventWithChild) => void;
  onDeleteEvent: (eventId: string) => void;
  isLoading?: boolean;
}

export interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEventWithChild;
  selectedDate?: Date;
  children?: React.ReactNode;
  onSave: (eventData: EventFormData) => Promise<void>;
  userId: string;
  childrenData?: Child[];
  isSubmitting?: boolean;
}

export interface EventItemProps {
  event: CalendarEventWithChild;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean; // Whether the current user can edit this event
}

export interface EventHistoryProps {
  eventId: string;
  onClose: () => void;
}

// New interfaces for calendar filtering
export interface CalendarFiltersProps {
  children: Child[];
  selectedChildren: string[];
  onChildFilterChange: (childIds: string[]) => void;
  selectedCategories: string[];
  onCategoryFilterChange: (categories: string[]) => void;
}

// Interface for event recurrence settings
export interface RecurrenceSettingsProps {
  value: {
    enabled: boolean;
    type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: string;
    occurrences?: number;
  };
  onChange: (value: any) => void;
}