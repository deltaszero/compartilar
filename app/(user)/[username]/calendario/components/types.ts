import { CalendarEvent } from '@/types/shared.types';
import { Child } from '@/types/user.types';

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
}

export interface CalendarProps {
  initialMonth?: Date;
  userId?: string;
}

export interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
}

export interface CalendarGridProps {
  days: CalendarDay[];
  onSelectDate: (date: Date) => void;
  onDoubleClick: (date: Date) => void;
}

export interface DayEventsProps {
  selectedDate: Date | null;
  events: CalendarEventWithChild[];
  onAddEvent: (date: Date) => void;
  onEditEvent: (date: Date, event: CalendarEventWithChild) => void;
  onDeleteEvent: (eventId: string) => void;
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
}

export interface EventItemProps {
  event: CalendarEventWithChild;
  onEdit: () => void;
  onDelete: () => void;
}