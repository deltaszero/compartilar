import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { addPermissionChangeHistory } from './HistoryUtils';
import { toast } from '@/hooks/use-toast';
import { logPermissionChange } from '@/lib/auditLogger';

// Add editor or viewer
export const addUserAccess = async (
  childData: any,
  userId: string,
  role: 'editor' | 'viewer',
  currentUser: any,
  userData: any,
  setEditorsList: (updater: any) => void,
  setViewersList: (updater: any) => void,
  setChildData: (data: any) => void,
  setShowEditorsDialog: (show: boolean) => void,
  setShowViewersDialog: (show: boolean) => void,
  setSearchTerm: (term: string) => void,
  setSearchResults: (results: any[]) => void,
  fetchChangeHistory: () => void
) => {
  if (!childData?.id || !currentUser?.uid) return;
  
  try {
    const childRef = doc(db, 'children', childData.id);
    
    // Get user details for better history logging and UI
    let userDisplayName = userId; // Default to userId if we can't fetch the username
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userDocData = userDoc.data();
        userDisplayName = userDocData.displayName || userDocData.username;
      }
    } catch (error) {
      console.error('Error fetching user details for history log:', error);
    }
    
    // First check if user is already in the correct role to avoid duplicates
    const childSnapshot = await getDoc(childRef);
    if (!childSnapshot.exists()) {
      throw new Error('Child document not found');
    }

    const childDocData = childSnapshot.data();
    const currentEditors = childDocData.editors || [];
    const currentViewers = childDocData.viewers || [];
    
    // Update Firestore with arrayUnion
    if (role === 'editor') {
      // Skip if already an editor
      if (currentEditors.includes(userId)) {
        console.log(`User ${userId} is already an editor, skipping database update`);
        return; // Exit early to avoid duplicate operations
      }
      
      // First update Firestore
      await updateDoc(childRef, {
        editors: arrayUnion(userId),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      
      // Log to change history
      await addPermissionChangeHistory(
        childData.id,
        currentUser.uid,
        userData?.displayName || userData?.username,
        'permission_add',
        'editors',
        userId,
        userDisplayName
      );
      
      // Log to global audit system
      await logPermissionChange({
        userId: currentUser.uid,
        userDisplayName: userData?.displayName || userData?.username,
        targetType: 'child',
        targetId: childData.id,
        targetName: `${childData.firstName} ${childData.lastName}`,
        action: 'permission_add',
        targetUserId: userId,
        targetUserName: userDisplayName,
        role: 'editor'
      });
      
      // Fetch the user info and add to editorsList if not already there
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setEditorsList(prev => {
          // Check if user already exists in list
          const userExists = prev.some(editor => editor.uid === userId);
          if (userExists) {
            return prev; // Don't add duplicates
          }
          return [...prev, {
            uid: userId,
            displayName: userData.displayName || userData.username,
            photoURL: userData.photoURL,
            username: userData.username
          }];
        });
      }
      
      toast({
        title: 'Editor adicionado',
        description: 'O usuário agora pode editar as informações desta criança.'
      });
    } else {
      // Skip if already a viewer
      if (currentViewers.includes(userId)) {
        console.log(`User ${userId} is already a viewer, skipping database update`);
        return; // Exit early to avoid duplicate operations
      }
      
      // First update Firestore
      await updateDoc(childRef, {
        viewers: arrayUnion(userId),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      
      // Log to change history
      await addPermissionChangeHistory(
        childData.id,
        currentUser.uid,
        userData?.displayName || userData?.username,
        'permission_add',
        'viewers',
        userId,
        userDisplayName
      );
      
      // Log to global audit system
      await logPermissionChange({
        userId: currentUser.uid,
        userDisplayName: userData?.displayName || userData?.username,
        targetType: 'child',
        targetId: childData.id,
        targetName: `${childData.firstName} ${childData.lastName}`,
        action: 'permission_add',
        targetUserId: userId,
        targetUserName: userDisplayName,
        role: 'viewer'
      });
      
      // Fetch the user info and add to viewersList if not already there
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setViewersList(prev => {
          // Check if user already exists in list
          const userExists = prev.some(viewer => viewer.uid === userId);
          if (userExists) {
            return prev; // Don't add duplicates
          }
          return [...prev, {
            uid: userId,
            displayName: userData.displayName || userData.username,
            photoURL: userData.photoURL,
            username: userData.username
          }];
        });
      }
      
      toast({
        title: 'Visualizador adicionado',
        description: 'O usuário agora pode visualizar as informações desta criança.'
      });
    }
    
    // Update local state
    if (childData) {
      const updatedChild = { ...childData };
      if (role === 'editor') {
        updatedChild.editors = [...(updatedChild.editors || []), userId];
      } else {
        updatedChild.viewers = [...(updatedChild.viewers || []), userId];
      }
      setChildData(updatedChild);
    }
    
    // Close dialog
    setShowEditorsDialog(false);
    setShowViewersDialog(false);
    setSearchTerm('');
    setSearchResults([]);
    
    // Refresh the history if needed
    if (document.querySelector('[data-state="active"][data-value="history"]')) {
      fetchChangeHistory();
    }
    
  } catch (error) {
    console.error(`Error adding ${role}:`, error);
    toast({
      variant: 'destructive',
      title: 'Erro',
      description: `Não foi possível adicionar o usuário como ${role === 'editor' ? 'editor' : 'visualizador'}.`
    });
  }
};

// Remove editor or viewer
export const removeUserAccess = async (
  childData: any,
  userId: string,
  role: 'editor' | 'viewer',
  currentUser: any,
  userData: any,
  editorsList: any[],
  viewersList: any[],
  setEditorsList: (updater: any) => void,
  setViewersList: (updater: any) => void,
  setChildData: (data: any) => void,
  setUserBeingRemoved: (userId: string | null) => void,
  fetchChangeHistory: () => void
) => {
  // Don't allow removing the creator/owner
  if (!childData?.id || !currentUser?.uid || userId === childData.createdBy) return;
  
  try {
    setUserBeingRemoved(userId);
    const childRef = doc(db, 'children', childData.id);
    
    console.log(`Removing user ${userId} as ${role} from child ${childData.id}`);
    
    // Get user details for better history logging
    let userDisplayName = userId; // Default to userId if we can't fetch the username
    try {
      const userToRemove = role === 'editor' 
        ? editorsList.find(editor => editor.uid === userId)
        : viewersList.find(viewer => viewer.uid === userId);
      
      if (userToRemove) {
        userDisplayName = userToRemove.displayName || userToRemove.username;
      } else {
        // Fetch from DB if not found in local state
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userDisplayName = userData.displayName || userData.username;
        }
      }
    } catch (error) {
      console.error('Error getting user details for history log:', error);
    }
    
    // Update Firestore with arrayRemove
    if (role === 'editor') {
      // First update Firestore
      await updateDoc(childRef, {
        editors: arrayRemove(userId),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      
      // Log to change history
      await addPermissionChangeHistory(
        childData.id,
        currentUser.uid,
        userData?.displayName || userData?.username,
        'permission_remove',
        'editors',
        userId,
        userDisplayName
      );
      
      // Log to global audit system
      await logPermissionChange({
        userId: currentUser.uid,
        userDisplayName: userData?.displayName || userData?.username,
        targetType: 'child',
        targetId: childData.id,
        targetName: `${childData.firstName} ${childData.lastName}`,
        action: 'permission_remove',
        targetUserId: userId,
        targetUserName: userDisplayName,
        role: 'editor'
      });
      
      // Update local state
      setEditorsList(prev => prev.filter(editor => editor.uid !== userId));
      
      toast({
        title: 'Editor removido',
        description: 'O usuário não pode mais editar as informações desta criança.'
      });
    } else {
      // First update Firestore
      await updateDoc(childRef, {
        viewers: arrayRemove(userId),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      });
      
      // Log to change history
      await addPermissionChangeHistory(
        childData.id,
        currentUser.uid,
        userData?.displayName || userData?.username,
        'permission_remove',
        'viewers',
        userId,
        userDisplayName
      );
      
      // Log to global audit system
      await logPermissionChange({
        userId: currentUser.uid,
        userDisplayName: userData?.displayName || userData?.username,
        targetType: 'child',
        targetId: childData.id,
        targetName: `${childData.firstName} ${childData.lastName}`,
        action: 'permission_remove',
        targetUserId: userId,
        targetUserName: userDisplayName,
        role: 'viewer'
      });
      
      // Update local state
      setViewersList(prev => prev.filter(viewer => viewer.uid !== userId));
      
      toast({
        title: 'Visualizador removido',
        description: 'O usuário não pode mais visualizar as informações desta criança.'
      });
    }
    
    // Update main child data state to ensure consistency
    if (childData) {
      const updatedChild = { ...childData };
      if (role === 'editor') {
        updatedChild.editors = (updatedChild.editors || []).filter(id => id !== userId);
      } else {
        updatedChild.viewers = (updatedChild.viewers || []).filter(id => id !== userId);
      }
      setChildData(updatedChild);
    }
    
    // Refresh the history if needed
    if (document.querySelector('[data-state="active"][data-value="history"]')) {
      fetchChangeHistory();
    }
    
  } catch (error) {
    console.error(`Error removing ${role}:`, error);
    toast({
      variant: 'destructive',
      title: 'Erro',
      description: `Não foi possível remover o usuário como ${role === 'editor' ? 'editor' : 'visualizador'}.`
    });
  } finally {
    setUserBeingRemoved(null);
  }
};