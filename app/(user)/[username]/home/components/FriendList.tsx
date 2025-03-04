"use client";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
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

export const FriendList = ({ userId }: { userId: string }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true);
      try {
        // Query the nested friendsList collection
        const friendsRef = collection(db, 'friends', userId, 'friendsList');
        const snapshot = await getDocs(friendsRef);

        const friendsData: Friend[] = [];
        snapshot.forEach((doc) => {
          friendsData.push({
            ...doc.data() as Friend,
            id: doc.id
          });
        });

        setFriends(friendsData);
      } catch (err) {
        console.error('Error fetching friends:', err);
        toast({
          variant: "destructive",
          title: "Erro ao carregar amigos",
          description: "Não foi possível carregar sua lista de amigos"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchFriends();
    }
  }, [userId, toast]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (friends.length === 0) {
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