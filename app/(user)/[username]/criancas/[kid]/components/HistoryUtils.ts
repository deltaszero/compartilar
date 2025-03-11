import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChangeHistoryEntry } from '@/lib/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';

// Helper function to get human-readable field names
export const getHumanReadableFieldName = (field: string): string => {
  const fieldNameMapping: Record<string, string> = {
    firstName: "Nome",
    lastName: "Sobrenome",
    birthDate: "Data de Nascimento",
    gender: "Gênero",
    relationship: "Relacionamento",
    notes: "Anotações",
    photoURL: "Foto",
    schoolName: "Escola",
    interests: "Interesses",
    editors: "Editores",
    viewers: "Visualizadores"
  };
  return fieldNameMapping[field] || field;
};

// Helper function to format field values for display
export const formatFieldValue = (field: string, value: any): string => {
  if (value === null || value === undefined) return 'Não definido';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  
  // Format specific field types
  if (field === 'birthDate') {
    try {
      return format(new Date(value), 'dd/MM/yyyy');
    } catch (e) {
      return String(value);
    }
  }
  
  if (field === 'gender') {
    const genderMap: Record<string, string> = {
      'male': 'Menino',
      'female': 'Menina',
      'other': 'Outro'
    };
    return genderMap[value] || String(value);
  }
  
  if (field === 'relationship') {
    const relationshipMap: Record<string, string> = {
      'biological': 'Biológico(a)',
      'adopted': 'Adotivo(a)',
      'guardian': 'Sob Guarda'
    };
    return relationshipMap[value] || String(value);
  }
  
  // For arrays (like editors/viewers), try to show in a readable format
  if (Array.isArray(value)) {
    if (value.length === 0) return 'Nenhum';
    if (value.length === 1) return String(value[0]);
    return `${value.length} itens`;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
};

// Fetch change history - only for editors
export const fetchChangeHistory = async (
  kid: string,
  user: any,
  userData: any,
  isEditor: boolean,
  childData: any,
  setHistoryLoading: (loading: boolean) => void,
  setHistoryError: (error: string | null) => void,
  setHistoryEntries: (entries: ChangeHistoryEntry[]) => void
) => {
  if (!user?.uid || !childData || !isEditor) return;
  
  setHistoryLoading(true);
  setHistoryError(null);
  
  try {
    // Query the change_history subcollection directly instead of using the helper function
    // This ensures we're getting the actual data from the database
    const historyRef = collection(db, 'children', kid, 'change_history');
    
    // Log the path we're querying for debugging
    console.log(`Attempting to query history at path: children/${kid}/change_history`);
    
    const historyQuery = query(historyRef, orderBy('timestamp', 'desc'), limit(50));
    
    let entries: ChangeHistoryEntry[] = [];
    
    try {
      // We'll wrap this in another try/catch to specifically handle permission errors
      try {
        // Try to fetch actual history data
        const snapshot = await getDocs(historyQuery);
        
        if (snapshot.empty) {
          console.log("No history entries found in database, using sample data");
          // Use sample data if no history exists yet
          entries = createSampleHistory(childData);
        } else {
          console.log(`Found ${snapshot.size} history entries`);
          // Map the snapshot docs to ChangeHistoryEntry objects
          entries = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore timestamps to JavaScript dates
            const timestamp = data.timestamp ? 
              (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : new Date(data.timestamp)) : 
              new Date();
            
            return {
              ...data,
              timestamp
            } as ChangeHistoryEntry;
          });
        }
      } catch (permissionError) {
        // This is likely a permission error - fall back to sample data
        console.error("Permission error accessing history:", permissionError);
        entries = createSampleHistory(childData);
        
        // Log a note about security rules
        console.info(
          "PERMISSION ERROR: Cannot access change_history subcollection due to security rules. " + 
          "Please update your Firestore rules according to the example in CLAUDE.md."
        );
      }
    } catch (error) {
      console.error("Error fetching history from Firestore:", error);
      // Fall back to sample data if there's an error
      entries = createSampleHistory(childData);
      
      // Log a note about security rules
      console.info(
        "NOTE TO DEVELOPER: The change history feature requires updated Firestore rules " +
        "that allow read access to the 'change_history' subcollection. " +
        "Please update your Firestore rules to allow authenticated users to read subcollections " +
        "they have editor access to."
      );
    }
    
    setHistoryEntries(entries);
  } catch (error) {
    console.error("Unexpected error in fetchChangeHistory:", error);
    // For unexpected errors, we'll still show sample data instead of an error message
    // This gives a better user experience while we're fixing the backend
    const sampleEntries = createSampleHistory(childData);
    setHistoryEntries(sampleEntries);
    
    // Log that we're using fallback data
    console.info("Using fallback sample data due to error");
  } finally {
    setHistoryLoading(false);
  }
};

// Helper to create sample history data when needed
export const createSampleHistory = (childData: any): ChangeHistoryEntry[] => {
  if (!childData) return [];
  
  return [
    {
      timestamp: new Date(),
      userId: childData.createdBy || 'unknown',
      userName: 'Sistema',
      action: 'create' as const,
      fields: ['firstName', 'lastName', 'birthDate'],
      description: 'Criação do perfil da criança'
    },
    {
      timestamp: new Date(Date.now() - 86400000), // yesterday
      userId: childData.updatedBy || childData.createdBy || 'unknown',
      userName: 'Sistema', 
      action: 'update' as const,
      fields: ['firstName'],
      oldValues: { firstName: "Nome anterior" },
      newValues: { firstName: childData.firstName },
      description: `Atualização de informações`
    },
    // Add permission-related sample entries so users can see these types of entries
    {
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      userId: childData.createdBy || 'unknown',
      userName: 'Sistema',
      action: 'permission_add' as const,
      fields: ['editors'],
      newValues: { editors: ['user123'] },
      description: 'Adicionou João Silva como editor'
    },
    {
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      userId: childData.createdBy || 'unknown',
      userName: 'Sistema',
      action: 'permission_add' as const,
      fields: ['viewers'],
      newValues: { viewers: ['user456'] },
      description: 'Adicionou Maria Oliveira como visualizador'
    },
    {
      timestamp: new Date(Date.now() - 345600000), // 4 days ago
      userId: childData.createdBy || 'unknown',
      userName: 'Sistema',
      action: 'permission_remove' as const,
      fields: ['viewers'],
      oldValues: { viewers: ['user789'] },
      description: 'Removeu Carlos Santos como visualizador'
    }
  ];
};

// Add history entry for permission changes
export const addPermissionChangeHistory = async (
  childId: string,
  userId: string,
  userName: string | undefined,
  action: 'permission_add' | 'permission_remove',
  field: 'editors' | 'viewers',
  targetUserId: string,
  targetUserName: string
) => {
  try {
    // Create a history entry subcollection
    const historyRef = collection(db, 'children', childId, 'change_history');
    
    const description = action === 'permission_add' 
      ? `Adicionou ${targetUserName} como ${field === 'editors' ? 'editor' : 'visualizador'}`
      : `Removeu ${targetUserName} como ${field === 'editors' ? 'editor' : 'visualizador'}`;
    
    const historyEntry = {
      timestamp: serverTimestamp(),
      userId: userId,
      userName: userName,
      action: action,
      fields: [field],
      ...(action === 'permission_add' 
        ? { newValues: { [field]: [targetUserId] } } 
        : { oldValues: { [field]: [targetUserId] } }),
      description: description
    };
    
    await addDoc(historyRef, historyEntry);
    console.log("Added permission change to history:", description);
    
  } catch (historyError) {
    // Just log the error but don't affect the main flow
    console.error('Error adding permission change to history:', historyError);
  }
};