export interface KidInfo {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "male" | "female" | "other" | null;
  relationship: "biological" | "adopted" | "guardian" | null;
  photoURL?: string | null;
  parentId: string;
  notes?: string;
  medicalInfo?: {
    allergies?: string[];
    conditions?: string[];
    medications?: string[];
    bloodType?: string;
    emergencyContact?: string;
  };
  education?: {
    schoolName?: string;
    grade?: string;
    teacherName?: string;
    schoolPhone?: string;
  };
}