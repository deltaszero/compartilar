export interface KidInfo {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "male" | "female" | "other" | null;
  relationship: "biological" | "adopted" | "guardian" | null;
  photoURL?: string | null;
  parentId?: string; // Marked as optional since we're transitioning to viewers/editors model
  notes?: string;
  // Permission arrays for the new access model
  viewers?: string[];
  editors?: string[];
  // Optional access level for frontend use
  accessLevel?: 'viewer' | 'editor';
  // Creator and update tracking info
  createdBy?: string;
  createdAt?: string | any; // Using any to accommodate Firestore timestamp types
  updatedBy?: string;
  updatedAt?: string | any; // Using any to accommodate Firestore timestamp types
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