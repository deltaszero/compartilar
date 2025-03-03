import { CalendarEvent } from '@/types/shared.types';
import { Child } from '@/types/user.types';
// import { Timestamp } from 'firebase/firestore';
import { Dayjs } from 'dayjs';

export interface CalendarDay {
  date: Dayjs;
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
  currentMonth: Dayjs;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
}

export interface CalendarGridProps {
  days: CalendarDay[];
  onSelectDate: (date: Dayjs) => void;
  onDoubleClick: (date: Dayjs) => void;
}

export interface DayEventsProps {
  selectedDate: Dayjs | null;
  events: CalendarEventWithChild[];
  onAddEvent: (date: Dayjs) => void;
  onEditEvent: (date: Dayjs, event: CalendarEventWithChild) => void;
  onDeleteEvent: (eventId: string) => void;
}

export interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEventWithChild;
  selectedDate?: Dayjs;
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

export interface EventDotProps {
  category: string;
  onClick: (e: React.MouseEvent) => void;
}