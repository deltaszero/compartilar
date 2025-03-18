import { Dayjs } from "dayjs";

export interface SignupFormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  photoURL?: string;
}

export interface KidInfo {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender?: "male" | "female" | "other" | null;
  relationship?: "biological" | "adopted" | "guardian" | null;
  photoURL?: string | null;
  accessLevel?: "viewer" | "editor";
  isDeleted?: boolean;
}

export interface UserDialogData {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface InvitationData {
  inviterId: string;
  inviterName: string;
  inviterUsername: string;
  invitationType: string;
  message: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'used' | 'expired';
}

export interface WeekDay {
  date: Dayjs;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  eventCount?: number;
}