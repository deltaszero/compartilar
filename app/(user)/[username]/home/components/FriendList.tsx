"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useUser } from "@/context/userContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { RelationshipType } from "@/types/friendship.types";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Users, Heart, UserCog, UserCheck, Edit, Eye, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Friend {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  relationshipType?: string;
  gender?: 'male' | 'female' | 'other' | null;
  addedAt?: any;
  displayName?: string;
}

interface FriendshipRequest {
  id: string;
  senderId: string;
  senderUsername: string;
  senderPhotoURL?: string;
  senderFirstName?: string;
  senderLastName?: string;
  receiverId: string;
  receiverUsername: string;
  receiverPhotoURL?: string;
  receiverFirstName?: string;
  receiverLastName?: string;
  status: string;
  relationshipType: string;
  createdAt: any;
  updatedAt?: any;
  sharedChildren?: string[];
  accessLevel?: 'viewer' | 'editor';
}

export const FriendList = ({ userId }: { userId: string }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingRequest, setIsProcessingRequest] = useState<{ [key: string]: boolean }>({});
  const [isUpdatingRelationship, setIsUpdatingRelationship] = useState<{ [key: string]: boolean }>({});
  // Child permissions state
  const [isManagingChildAccess, setIsManagingChildAccess] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [userChildren, setUserChildren] = useState<any[]>([]);
  const [isUpdatingChildAccess, setIsUpdatingChildAccess] = useState<{[key: string]: boolean}>({});
  
  // Hooks
  const { userData } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch confirmed friends from user's friends subcollection
        const userFriendsRef = collection(db, 'users', userId, 'friends');
        const friendsSnapshot = await getDocs(userFriendsRef);

        const friendsData: Friend[] = [];
        const friendPromises = friendsSnapshot.docs.map(async (docSnap) => {
          const friendData = docSnap.data();
          const friendId = docSnap.id;
          
          // Get the full user profile of each friend
          try {
            const friendUserRef = doc(db, 'users', friendId);
            const friendUserSnap = await getDoc(friendUserRef);
            
            if (friendUserSnap.exists()) {
              const userData = friendUserSnap.data();
              
              friendsData.push({
                id: friendId,
                username: userData.username || friendData.username || '',
                firstName: userData.firstName || friendData.firstName || '',
                lastName: userData.lastName || friendData.lastName || '',
                displayName: userData.displayName || friendData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
                photoURL: userData.photoURL || friendData.photoURL,
                gender: (userData.gender === 'male' || userData.gender === 'female' || userData.gender === 'other') 
                      ? userData.gender as 'male' | 'female' | 'other'
                      : null,
                relationshipType: friendData.relationshipType || 'other',
                addedAt: friendData.addedAt || null
              });
            } else {
              // If the user doesn't exist, still add with available data
              friendsData.push({
                id: friendId,
                ...friendData,
                username: friendData.username || '',
                firstName: friendData.firstName || '',
                lastName: friendData.lastName || '',
                relationshipType: friendData.relationshipType || 'other'
              });
            }
          } catch (err) {
            console.error(`Error fetching friend data for ${friendId}:`, err);
            // Add with minimal data
            friendsData.push({
              id: friendId,
              ...friendData,
              username: friendData.username || '',
              firstName: friendData.firstName || '',
              lastName: friendData.lastName || '',
              relationshipType: friendData.relationshipType || 'other'
            });
          }
        });
        
        // Wait for all friend data to be fetched
        await Promise.all(friendPromises);

        setFriends(friendsData);

        // Fetch pending friend requests from user's friendship_requests subcollection
        const requestsRef = collection(db, 'users', userId, 'friendship_requests');
        const requestsQuery = query(
          requestsRef,
          where('status', '==', 'pending')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData: FriendshipRequest[] = [];

        requestsSnapshot.forEach((docSnap) => {
          requestsData.push({
            id: docSnap.id,
            ...docSnap.data() as Omit<FriendshipRequest, 'id'>
          });
        });

        setPendingRequests(requestsData);
      } catch (err) {
        console.error('Error fetching friend data:', err);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar sua lista de amigos"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId, toast]);

  const handleRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!userData) return;

    setIsProcessingRequest(prev => ({ ...prev, [requestId]: true }));

    try {
      const requestRef = doc(db, 'users', userId, 'friendship_requests', requestId);
      const requestSnapshot = await getDoc(requestRef);
      
      if (!requestSnapshot.exists()) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Solicitação não encontrada"
        });
        setIsProcessingRequest(prev => ({ ...prev, [requestId]: false }));
        return;
      }
      
      const request = requestSnapshot.data() as FriendshipRequest;
      const timestamp = Timestamp.now();

      // Update the request status
      await updateDoc(requestRef, {
        status,
        updatedAt: timestamp
      });

      // If accepted, add to both users' friends subcollections
      if (status === 'accepted') {
        // Add sender to current user's friends
        await setDoc(doc(db, 'users', userData.uid, 'friends', request.senderId), {
          username: request.senderUsername,
          photoURL: request.senderPhotoURL,
          addedAt: timestamp,
          firstName: request.senderFirstName || '',
          lastName: request.senderLastName || '',
          relationshipType: request.relationshipType || 'support',
          ...(request.sharedChildren && { sharedChildren: request.sharedChildren })
        });

        // Add current user to sender's friends
        await setDoc(doc(db, 'users', request.senderId, 'friends', userData.uid), {
          username: userData.username,
          photoURL: userData.photoURL,
          addedAt: timestamp,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          relationshipType: request.relationshipType || 'support',
          ...(request.sharedChildren && { sharedChildren: request.sharedChildren })
        });
        
        // Add a notification for the request sender
        await addDoc(collection(db, 'users', request.senderId, 'notifications'), {
          type: 'friendship_accepted',
          title: 'Solicitação de amizade aceita',
          message: `${userData.firstName || userData.username} aceitou sua solicitação de amizade`,
          status: 'unread',
          createdAt: serverTimestamp(),
          metadata: {
            userId: userData.uid,
            username: userData.username,
            relationshipType: request.relationshipType
          }
        });

        // Add to friends list immediately in UI
        setFriends(prev => [...prev, {
          id: request.senderId,
          username: request.senderUsername,
          firstName: request.senderFirstName || '',
          lastName: request.senderLastName || '',
          photoURL: request.senderPhotoURL,
          relationshipType: request.relationshipType,
          addedAt: timestamp
        }]);

        toast({
          title: "Solicitação aceita",
          description: `Você e ${request.senderUsername} agora são amigos!`
        });
      } else {
        // Send notification of declined request
        await addDoc(collection(db, 'users', request.senderId, 'notifications'), {
          type: 'friendship_declined',
          title: 'Solicitação de amizade recusada',
          message: `${userData.firstName || userData.username} recusou sua solicitação de amizade`,
          status: 'unread',
          createdAt: serverTimestamp(),
          metadata: {
            userId: userData.uid,
            username: userData.username
          }
        });
        
        toast({
          title: "Solicitação recusada",
          description: "A solicitação de amizade foi recusada"
        });
      }

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error(`Error ${status} friend request:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Falha ao ${status === 'accepted' ? 'aceitar' : 'recusar'} a solicitação`
      });
    } finally {
      setIsProcessingRequest(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Render the pending requests section
  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) return null;

    return (
      <div className="mb-6 border-2 border-black bg-secondary/10 p-4 rounded-lg">
        <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center">
          {/* <span className="mr-2">🔔</span> */}
          Solicitações Pendentes ({pendingRequests.length})
        </h2>
        <div className="grid gap-3">
          {pendingRequests.map((request) => (
            <div key={request.id} className="flex flex-col sm:flex-row items-center sm:justify-between p-3 bg-white border border-gray-200 rounded-lg gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-300">
                  {request.senderPhotoURL ? (
                    <AvatarImage src={request.senderPhotoURL} alt={request.senderUsername} />
                  ) : (
                    <AvatarFallback className="bg-gray-100 text-gray-800">
                      {request.senderUsername?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{request.senderUsername}</p>
                  {request.senderFirstName && request.senderLastName && (
                    <p className="text-xs text-gray-500">
                      {request.senderFirstName} {request.senderLastName}
                    </p>
                  )}
                  {/* {request.relationshipType && (
                    <Badge variant="default" className="mt-1">
                      {request.relationshipType === 'coparent' ? 'Co-Parent' :
                        request.relationshipType === 'support' ? 'Apoio' : 'Outro'}
                    </Badge>
                  )} */}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRequest(request.id, 'accepted')}
                  disabled={isProcessingRequest[request.id]}
                  className="bg-mainStrongGreen"
                >
                  {isProcessingRequest[request.id] ? (
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                  ) : 'Aceitar'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRequest(request.id, 'declined')}
                  disabled={isProcessingRequest[request.id]}
                  className="bg-mainStrongRed"
                >
                  Recusar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (friends.length === 0 && pendingRequests.length === 0) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-2 text-gray-500">
        <p>Você ainda não tem amigos adicionados</p>
      </div>
    );
  }

  // Group friends by relationship type
  const supportFriends = friends.filter(friend => friend.relationshipType === 'support');
  const coparentFriends = friends.filter(friend => friend.relationshipType === 'coparent');
  const otherFriends = friends.filter(friend => friend.relationshipType === 'other' || !friend.relationshipType);

  // Add function to change relationship
  const changeRelationship = async (friendId: string, newRelationship: RelationshipType) => {
    if (!userData?.uid) return;
    
    // Don't allow changes if already updating
    if (isUpdatingRelationship[friendId]) return;
    
    setIsUpdatingRelationship(prev => ({ ...prev, [friendId]: true }));
    
    try {
      // Get the friend data
      const friend = friends.find(f => f.id === friendId);
      if (!friend) throw new Error("Friend not found");
      
      // Update in both users' friends subcollections
      const userFriendRef = doc(db, 'users', userData.uid, 'friends', friendId);
      const friendUserRef = doc(db, 'users', friendId, 'friends', userData.uid);
      
      // Update in current user's friends list
      await updateDoc(userFriendRef, {
        relationshipType: newRelationship,
        updatedAt: serverTimestamp()
      });
      
      // Update in friend's friends list too (for consistency)
      await updateDoc(friendUserRef, {
        relationshipType: newRelationship,
        updatedAt: serverTimestamp()
      });
      
      // Send notification to the friend about relationship change
      await addDoc(collection(db, 'users', friendId, 'notifications'), {
        type: 'relationship_change',
        title: 'Relacionamento atualizado',
        message: `${userData.firstName || userData.username} alterou o tipo de relacionamento com você`,
        status: 'unread',
        createdAt: serverTimestamp(),
        metadata: {
          userId: userData.uid,
          username: userData.username,
          relationshipType: newRelationship
        }
      });
      
      // Update local state
      setFriends(prev => 
        prev.map(f => 
          f.id === friendId ? { ...f, relationshipType: newRelationship } : f
        )
      );
      
      // Get relationship display name for toast
      const relationshipDisplay = 
        newRelationship === 'coparent' ? 
          (friend.gender === 'male' ? 'Pai' : 
           friend.gender === 'female' ? 'Mãe' : 'Co-Parent') : 
        newRelationship === 'support' ? 'Apoio' : 'Outro';
      
      toast({
        title: "Relacionamento atualizado",
        description: `${friend.firstName} agora é ${relationshipDisplay} na sua rede!`
      });
    } catch (error) {
      console.error('Error updating relationship:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o relacionamento"
      });
    } finally {
      setIsUpdatingRelationship(prev => ({ ...prev, [friendId]: false }));
    }
  };

  // Add function to get user's children
  const getUserChildren = async () => {
    if (!userData?.uid) return [];
    
    try {
      const childrenRef = collection(db, 'children');
      const editorQuery = query(
        childrenRef,
        where('editors', 'array-contains', userData.uid)
      );
      
      const snapshot = await getDocs(editorQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: `${doc.data().firstName} ${doc.data().lastName}`.trim(),
        photoURL: doc.data().photoURL,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        // Permissions data
        editors: doc.data().editors || [],
        viewers: doc.data().viewers || []
      }));
    } catch (error) {
      console.error('Error getting user children:', error);
      return [];
    }
  };
  
  // Get a user's access level to a specific child
  const getChildAccessLevel = (childData: any, userId: string) => {
    if (childData.editors && childData.editors.includes(userId)) return 'editor';
    if (childData.viewers && childData.viewers.includes(userId)) return 'viewer';
    return null;
  };
  
  // Functions for managing child permissions
  
  // Function to open child permission management modal
  const openChildPermissionManager = async (friend: Friend) => {
    setSelectedFriend(friend);
    setIsManagingChildAccess(true);
    
    try {
      const children = await getUserChildren();
      setUserChildren(children);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar suas crianças"
      });
    }
  };
  
  // Function to update child permissions for a friend
  const updateChildAccess = async (childId: string, accessLevel: 'editor' | 'viewer' | 'none') => {
    if (!userData?.uid || !selectedFriend) return;
    
    // Mark this child as updating
    setIsUpdatingChildAccess(prev => ({ ...prev, [childId]: true }));
    
    try {
      const childRef = doc(db, 'children', childId);
      const childDoc = await getDoc(childRef);
      
      if (!childDoc.exists()) {
        throw new Error('Criança não encontrada');
      }
      
      const childData = childDoc.data();
      
      // First remove from both arrays to ensure clean state
      let editors = [...(childData.editors || [])].filter(id => id !== selectedFriend.id);
      let viewers = [...(childData.viewers || [])].filter(id => id !== selectedFriend.id);
      
      // Then add to the appropriate array based on new access level
      if (accessLevel === 'editor') {
        editors.push(selectedFriend.id);
      } else if (accessLevel === 'viewer') {
        viewers.push(selectedFriend.id);
      }
      // If 'none', they've already been removed from both arrays
      
      // Update the child document
      await updateDoc(childRef, {
        editors,
        viewers,
        updatedAt: serverTimestamp()
      });
      
      // Send notification to the friend
      if (accessLevel !== 'none') {
        await addDoc(collection(db, 'users', selectedFriend.id, 'notifications'), {
          type: 'child_access',
          title: 'Acesso a criança atualizado',
          message: `${userData.firstName || userData.username} adicionou você como ${accessLevel === 'editor' ? 'editor' : 'visualizador'} de ${childData.firstName}`,
          status: 'unread',
          createdAt: serverTimestamp(),
          metadata: {
            childId: childId,
            childName: `${childData.firstName} ${childData.lastName}`.trim(),
            accessLevel: accessLevel,
            grantedBy: userData.uid
          }
        });
      } else {
        // Notify about removal of access
        await addDoc(collection(db, 'users', selectedFriend.id, 'notifications'), {
          type: 'child_access_removed',
          title: 'Acesso a criança removido',
          message: `${userData.firstName || userData.username} removeu seu acesso a ${childData.firstName}`,
          status: 'unread',
          createdAt: serverTimestamp(),
          metadata: {
            childId: childId,
            childName: `${childData.firstName} ${childData.lastName}`.trim(),
            removedBy: userData.uid
          }
        });
      }
      
      // Update the local state
      setUserChildren(prev =>
        prev.map(child => {
          if (child.id === childId) {
            return {
              ...child,
              editors: editors,
              viewers: viewers
            };
          }
          return child;
        })
      );
      
      // Display success message
      toast({
        title: accessLevel === 'none' ? 'Acesso removido' : 'Acesso atualizado',
        description: accessLevel === 'none' 
          ? `${selectedFriend.displayName || selectedFriend.username} não tem mais acesso` 
          : `${selectedFriend.displayName || selectedFriend.username} agora é ${accessLevel === 'editor' ? 'editor' : 'visualizador'}`
      });
    } catch (error) {
      console.error('Error updating child access:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o acesso à criança"
      });
    } finally {
      setIsUpdatingChildAccess(prev => ({ ...prev, [childId]: false }));
    }
  };

  const renderFriendItem = (friend: Friend) => {
    const isUpdating = isUpdatingRelationship[friend.id];
    
    // Get relationship display text based on type and gender
    const getRelationshipDisplay = (type?: string, gender?: 'male' | 'female' | 'other' | null) => {
      if (!type) return 'Outro';
      
      if (type === 'coparent') {
        // Use gender to determine if it's "Pai" or "Mãe"
        if (gender === 'male') return 'Pai';
        if (gender === 'female') return 'Mãe';
        return 'Co-Parent'; // Default if gender is 'other' or null
      }
      
      return type === 'support' ? 'Apoio' : 'Outro';
    };
    
    // Get relationship badge color
    const getRelationshipBadgeColor = (type?: string) => {
      return "default"; // You can customize badge colors if needed
    };
    
    // Define relationship options with labels based on friend's gender
    const getCoparentLabel = () => {
      if (friend.gender === 'male') return 'Pai';
      if (friend.gender === 'female') return 'Mãe';
      return 'Co-Parent';
    };
    
    const relationshipOptions = [
      { value: 'coparent', label: getCoparentLabel(), icon: Users },
      { value: 'support', label: 'Apoio', icon: Heart },
      { value: 'other', label: 'Outro', icon: UserCog }
    ];
    
    return (
      <div key={friend.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-muted rounded-lg">
        <Link
          href={`/${friend.username}/perfil`}
          className="flex items-center flex-1 space-x-2 sm:space-x-3 hover:text-accent-foreground transition-colors"
        >
          {friend.photoURL ? (
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full overflow-hidden">
              <Image
                src={friend.photoURL}
                alt={friend.displayName || friend.username}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <span className="text-sm sm:text-xl">
                {(friend.displayName || friend.username)?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="flex flex-col flex-1">
            <h3 className="font-medium">
              {friend.displayName || `${friend.firstName} ${friend.lastName}`.trim() || friend.username}
            </h3>
            <span className="text-sm text-muted-foreground">
              {friend.username ? `@${friend.username}` : ''}
              {friend.addedAt && friend.addedAt.toDate ? ` • Adicionado em ${friend.addedAt.toDate().toLocaleDateString()}` : ''}
            </span>
          </div>
        </Link>
        
        {/* Actions for the friend (only shown to the owner) */}
        {userData?.uid === userId && (
          <div className="flex items-center gap-2">
            {/* Child permissions button */}
            <Button
              variant="default"
              size="sm"
              className="h-8 px-2"
              onClick={() => openChildPermissionManager(friend)}
            >
              <UserCheck className="h-4 w-4" />
            </Button>
            
            {/* Relationship indicator and dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-8 gap-1 hover:bg-accent"
                  disabled={isUpdating}
                >
                  <Badge 
                    variant={getRelationshipBadgeColor(friend.relationshipType) as any}
                    className="flex items-center gap-1"
                  >
                    {isUpdating ? (
                      <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      getRelationshipDisplay(friend.relationshipType, friend.gender)
                    )}
                    <ChevronDown className="h-3 w-3" />
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {relationshipOptions.map(option => (
                  <DropdownMenuItem 
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => changeRelationship(friend.id, option.value as RelationshipType)}
                    disabled={friend.relationshipType === option.value || isUpdating}
                  >
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                    {friend.relationshipType === option.value && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {/* For non-owner view, just show badge */}
        {userData?.uid !== userId && friend.relationshipType && (
          <Badge variant={getRelationshipBadgeColor(friend.relationshipType) as any}>
            {getRelationshipDisplay(friend.relationshipType, friend.gender)}
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Pending Requests Section */}
      {renderPendingRequests()}

      {/* Confirmed Friends Sections */}
      {coparentFriends.length > 0 && (
        <div>
          <div className="grid gap-2">
            {coparentFriends.map(renderFriendItem)}
          </div>
        </div>
      )}

      {supportFriends.length > 0 && (
        <div>
          <div className="grid gap-2">
            {supportFriends.map(renderFriendItem)}
          </div>
        </div>
      )}

      {otherFriends.length > 0 && (
        <div>
          <div className="grid gap-2">
            {otherFriends.map(renderFriendItem)}
          </div>
        </div>
      )}

      {/* Child Permissions Dialog */}
      <Dialog open={isManagingChildAccess} onOpenChange={setIsManagingChildAccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Acesso às Crianças
            </DialogTitle>
            <DialogDescription>
              {selectedFriend && (
                <div className="flex items-center mt-2 mb-4">
                  <Avatar className="h-8 w-8 mr-2">
                    {selectedFriend.photoURL ? (
                      <AvatarImage src={selectedFriend.photoURL} alt={selectedFriend.displayName || selectedFriend.username} />
                    ) : (
                      <AvatarFallback className="bg-gray-100">
                        {(selectedFriend.displayName || selectedFriend.username)[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium">
                    {selectedFriend.displayName || `${selectedFriend.firstName} ${selectedFriend.lastName}`.trim() || selectedFriend.username}
                  </span>
                </div>
              )}
              Defina quais permissões este contato terá para cada criança.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {userChildren.length > 0 ? (
              <div className="space-y-3">
                {userChildren.map(child => {
                  // Determine current access level
                  const accessLevel = 
                    child.editors.includes(selectedFriend?.id) ? 'editor' :
                    child.viewers.includes(selectedFriend?.id) ? 'viewer' : 'none';
                  
                  const isUpdating = isUpdatingChildAccess[child.id];
                  
                  return (
                    <div key={child.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          {child.photoURL ? (
                            <AvatarImage src={child.photoURL} alt={child.name} />
                          ) : (
                            <AvatarFallback className="bg-gray-100">
                              {child.firstName[0]}{child.lastName?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{child.name}</p>
                          <Badge variant={accessLevel === 'none' ? 'default' : 'default'} className="mt-1">
                            {accessLevel === 'editor' ? 'Editor' : 
                             accessLevel === 'viewer' ? 'Visualizador' : 'Sem acesso'}
                          </Badge>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="default"
                            disabled={isUpdating}
                            className="ml-2"
                          >
                            {isUpdating ? (
                              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              'Alterar'
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => updateChildAccess(child.id, 'editor')}
                            disabled={accessLevel === 'editor' || isUpdating}
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editor</span>
                            {accessLevel === 'editor' && (
                              <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => updateChildAccess(child.id, 'viewer')}
                            disabled={accessLevel === 'viewer' || isUpdating}
                          >
                            <Eye className="h-4 w-4" />
                            <span>Visualizador</span>
                            {accessLevel === 'viewer' && (
                              <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => updateChildAccess(child.id, 'none')}
                            disabled={accessLevel === 'none' || isUpdating}
                          >
                            <X className="h-4 w-4" />
                            <span>Remover acesso</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">Você não tem nenhuma criança adicionada</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="default" onClick={() => setIsManagingChildAccess(false)}>
              Concluído
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};