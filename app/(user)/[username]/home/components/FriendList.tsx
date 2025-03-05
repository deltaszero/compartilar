"use client";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { useUser } from "@/context/userContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";

interface Friend {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  relationshipType?: string;
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
  const [isProcessingRequest, setIsProcessingRequest] = useState<{[key: string]: boolean}>({});
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
                    <Badge variant={
                      request.relationshipType === 'coparent' ? 'secondary' :
                      request.relationshipType === 'support' ? 'default' : 'outline'
                    } className="mt-1">
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
                  variant="outline"
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
        <span className="text-4xl">👥</span>
        <p>Você ainda não tem amigos adicionados</p>
      </div>
    );
  }

  // Group friends by relationship type
  const supportFriends = friends.filter(friend => friend.relationshipType === 'support');
  const coparentFriends = friends.filter(friend => friend.relationshipType === 'coparent');
  const otherFriends = friends.filter(friend => friend.relationshipType === 'other' || !friend.relationshipType);

  const renderFriendItem = (friend: Friend) => (
    <Link
      href={`/${friend.username}/perfil`}
      key={friend.username}
      className="block transition-all hover:scale-[1.02]"
    >
      <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-muted rounded-lg hover:bg-accent hover:text-accent-foreground">
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
          <div className="flex justify-between items-start">
            <h3 className="font-medium">
              {friend.firstName} {friend.lastName}
            </h3>
            {friend.relationshipType && (
              <Badge variant={
                friend.relationshipType === 'coparent' ? 'secondary' :
                friend.relationshipType === 'support' ? 'default' : 'outline'
              }>
                {friend.relationshipType === 'coparent' ? 'Co-Parent' :
                 friend.relationshipType === 'support' ? 'Apoio' : 'Outro'}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {friend.addedAt && `Adicionado em ${friend.addedAt.toDate().toLocaleDateString()}`}
          </span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4">
      {/* Pending Requests Section */}
      {renderPendingRequests()}
      
      {/* Confirmed Friends Sections */}
      {coparentFriends.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2 text-secondary">👨‍👩‍👧‍👦</span>
            Co-Pais
          </h2>
          <div className="grid gap-2">
            {coparentFriends.map(renderFriendItem)}
          </div>
        </div>
      )}
      
      {supportFriends.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
            <span className="mr-2 text-primary">💜</span>
            Rede de Apoio
          </h2>
          <div className="grid gap-2">
            {supportFriends.map(renderFriendItem)}
          </div>
        </div>
      )}
      
      {otherFriends.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold mb-2 flex items-center">
            Outros Contatos
          </h2>
          <div className="grid gap-2">
            {otherFriends.map(renderFriendItem)}
          </div>
        </div>
      )}
    </div>
  );
};