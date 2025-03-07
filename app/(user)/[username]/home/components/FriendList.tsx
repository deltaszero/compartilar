"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
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
import { ChevronDown, Users, Heart, UserCog } from "lucide-react";

interface Friend {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  relationshipType?: string;
  gender?: 'male' | 'female' | 'other' | null;
  addedAt?: any;
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
}

export const FriendList = ({ userId }: { userId: string }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingRequest, setIsProcessingRequest] = useState<{ [key: string]: boolean }>({});
  const [isUpdatingRelationship, setIsUpdatingRelationship] = useState<{ [key: string]: boolean }>({});
  const { userData } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch confirmed friends
        const friendsRef = collection(db, 'friends', userId, 'friendsList');
        const friendsSnapshot = await getDocs(friendsRef);

        const friendsData: Friend[] = [];
        friendsSnapshot.forEach((doc) => {
          friendsData.push({
            ...doc.data() as Friend,
            id: doc.id
          });
        });
        
        // Try to fetch gender information for each friend from their account_info
        for (let friend of friendsData) {
          try {
            const accountInfoRef = doc(db, 'account_info', friend.id);
            const accountInfoSnap = await getDoc(accountInfoRef);
            if (accountInfoSnap.exists()) {
              const accountData = accountInfoSnap.data();
              if (accountData.gender) {
                friend.gender = accountData.gender;
              }
            }
          } catch (err) {
            console.log(`Couldn't fetch gender for user ${friend.id}`, err);
          }
        }

        setFriends(friendsData);

        // Fetch pending friend requests
        const requestsRef = collection(db, 'friendship_requests');
        const requestsQuery = query(
          requestsRef,
          where('receiverId', '==', userId),
          where('status', '==', 'pending')
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsData: FriendshipRequest[] = [];

        requestsSnapshot.forEach((doc) => {
          requestsData.push({
            id: doc.id,
            ...doc.data() as Omit<FriendshipRequest, 'id'>
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
      const requestRef = doc(db, 'friendship_requests', requestId);
      const timestamp = Timestamp.now();

      // Update the request status
      await updateDoc(requestRef, {
        status,
        updatedAt: timestamp
      });

      // If accepted, add to both users' friends lists
      if (status === 'accepted') {
        const request = pendingRequests.find(req => req.id === requestId);
        if (!request) return;

        // Add sender to current user's friends
        await setDoc(doc(db, 'friends', userData.uid, 'friendsList', request.senderId), {
          username: request.senderUsername,
          photoURL: request.senderPhotoURL,
          addedAt: timestamp,
          firstName: request.senderFirstName || '',
          lastName: request.senderLastName || '',
          relationshipType: request.relationshipType || 'support',
          ...(request.sharedChildren && { sharedChildren: request.sharedChildren })
        });

        // Add current user to sender's friends
        await setDoc(doc(db, 'friends', request.senderId, 'friendsList', userData.uid), {
          username: userData.username,
          photoURL: userData.photoURL,
          addedAt: timestamp,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          relationshipType: request.relationshipType || 'support',
          ...(request.sharedChildren && { sharedChildren: request.sharedChildren })
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
          <span className="mr-2">🔔</span>
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
                  {request.relationshipType && (
                    <Badge variant="default" className="mt-1">
                      {request.relationshipType === 'coparent' ? 'Co-Parent' :
                        request.relationshipType === 'support' ? 'Apoio' : 'Outro'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleRequest(request.id, 'accepted')}
                  disabled={isProcessingRequest[request.id]}
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
        {/* <span className="text-4xl">👥</span> */}
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
      
      // Update in both users' friends lists
      const userFriendRef = doc(db, 'friends', userData.uid, 'friendsList', friendId);
      const friendUserRef = doc(db, 'friends', friendId, 'friendsList', userData.uid);
      
      // If it's a coparent relationship and we don't have gender info, try to get it
      if (newRelationship === 'coparent' && !friend.gender) {
        try {
          const accountInfoRef = doc(db, 'account_info', friendId);
          const accountInfoSnap = await getDoc(accountInfoRef);
          if (accountInfoSnap.exists()) {
            const accountData = accountInfoSnap.data();
            if (accountData.gender) {
              friend.gender = accountData.gender;
            }
          }
        } catch (err) {
          console.log(`Couldn't fetch gender for user ${friendId}`, err);
        }
      }
      
      // Update in current user's friends list
      await updateDoc(userFriendRef, {
        relationshipType: newRelationship,
        ...(friend.gender && { gender: friend.gender }) // Include gender if available
      });
      
      // Update in friend's friends list too (for consistency)
      await updateDoc(friendUserRef, {
        relationshipType: newRelationship
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

  // We'll define the relationship options inside the renderFriendItem function
  // so we can use the friend's gender information

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
      <div key={friend.username} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-muted rounded-lg">
        <Link
          href={`/${friend.username}/perfil`}
          className="flex items-center flex-1 space-x-2 sm:space-x-3 hover:text-accent-foreground transition-colors"
        >
          {friend.photoURL ? (
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-full overflow-hidden">
              <Image
                src={friend.photoURL}
                alt={friend.username}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <span className="text-sm sm:text-xl">
                {friend.username?.[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="flex flex-col flex-1">
            <h3 className="font-medium">
              {friend.firstName} {friend.lastName}
            </h3>
            <span className="text-sm text-muted-foreground">
              {friend.addedAt && `Adicionado em ${friend.addedAt.toDate().toLocaleDateString()}`}
            </span>
          </div>
        </Link>
        
        {/* Relationship indicator and dropdown */}
        {userData?.uid === userId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
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
          {/* <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2 text-secondary">👨‍👩‍👧‍👦</span>
            Pais
          </h2> */}
          <div className="grid gap-2">
            {coparentFriends.map(renderFriendItem)}
          </div>
        </div>
      )}

      {supportFriends.length > 0 && (
        <div>
          {/* <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2 text-primary">💜</span>
            Rede de Apoio
          </h2> */}
          <div className="grid gap-2">
            {supportFriends.map(renderFriendItem)}
          </div>
        </div>
      )}

      {otherFriends.length > 0 && (
        <div>
          {/* <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
            Outros Contatos
          </h2> */}
          <div className="grid gap-2">
            {otherFriends.map(renderFriendItem)}
          </div>
        </div>
      )}
    </div>
  );
};