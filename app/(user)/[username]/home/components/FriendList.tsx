"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/userContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ChevronDown, Users, Heart, UserCog, UserCheck, Edit, Eye, X, Search, CameraOff } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
// import IconCamera from '@/app/assets/icons/camera.svg';
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
    const [isUpdatingChildAccess, setIsUpdatingChildAccess] = useState<{ [key: string]: boolean }>({});

    // Hooks
    const { user, userData } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            if (!user) {
                console.log('No user available, skipping fetch');
                setIsLoading(false);
                return;
            }

            if (!userData?.uid) {
                console.log('No userData.uid available, skipping fetch');
                setIsLoading(false);
                return;
            }

            try {
                console.log('Fetching friends data for user ID:', userData.uid);

                // Get the auth token (might need for future authentication)
                const token = await user.getIdToken();

                // Fetch friends data from API - use the actual userId we receive as a prop
                const friendsResponse = await fetch(`/api/friends?userId=${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                // Log response status for debugging
                console.log('Friends API response status:', friendsResponse.status, 'for userId:', userId);

                if (!friendsResponse.ok) {
                    // Try to get more error details
                    let errorText = '';
                    try {
                        const errorData = await friendsResponse.json();
                        errorText = errorData.message || errorData.error || 'Unknown error';
                        console.error('Friends API error details:', errorData);
                    } catch (e) {
                        errorText = await friendsResponse.text();
                    }
                    throw new Error(`Failed to fetch friends: ${errorText}`);
                }

                const friendsData = await friendsResponse.json();
                console.log('Friends data received:', friendsData);
                setFriends(friendsData);

                // Fetch pending requests from API
                try {
                    // Use the token we already fetched
                    const requestsResponse = await fetch(`/api/friends/requests?userId=${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });

                    if (!requestsResponse.ok) {
                        throw new Error('Failed to fetch friend requests');
                    }

                    const requestsData = await requestsResponse.json();
                    setPendingRequests(requestsData);
                } catch (reqErr) {
                    console.error('Error fetching friend requests:', reqErr);
                    // Initialize with empty array on error
                    setPendingRequests([]);
                }
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
    }, [userId, toast, user]);

    const handleRequest = async (requestId: string, status: 'accepted' | 'declined') => {
        if (!userData || !user) return;

        setIsProcessingRequest(prev => ({ ...prev, [requestId]: true }));

        try {
            // Get a fresh token
            const token = await user.getIdToken(true);

            // Call the API with proper auth headers and correct method (PATCH)
            const response = await fetch('/api/friends/requests', {
                method: 'PATCH', // Changed from POST to PATCH as the API endpoint expects
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    requestId,
                    userId: userData.uid,
                    action: status === 'accepted' ? 'accept' : 'decline'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process friend request');
            }

            const result = await response.json();

            // Handle success response
            if (status === 'accepted') {
                // Refresh the friends list by fetching again
                try {
                    const refreshToken = await user.getIdToken(true);
                    const friendsResponse = await fetch(`/api/friends?userId=${userData.uid}`, {
                        headers: {
                            'Authorization': `Bearer ${refreshToken}`,
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });

                    if (friendsResponse.ok) {
                        const updatedFriends = await friendsResponse.json();
                        setFriends(updatedFriends);
                    }
                } catch (refreshError) {
                    console.error('Error refreshing friends list:', refreshError);
                }

                toast({
                    title: "Solicitação aceita",
                    description: "Solicitação de amizade aceita com sucesso!"
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
        return (
            <div className="space-y-3">
                <div className="grid gap-2">
                    {Array(1).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="flex space-x-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-20 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
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
                      {request.relationshipType === 'coparent' ? 'Mãe/Pai' :
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
                <div className="flex items-center max-w-xs mt-2">
                    <Search />
                    <p className="text-xs text-gray-400">
                        Adicione amigos através da busca na barra de pesquisa no topo da página.
                    </p>
                </div>
            </div>
        );
    }

    // Group friends by relationship type
    const supportFriends = friends.filter(friend => friend.relationshipType === 'support');
    const coparentFriends = friends.filter(friend => friend.relationshipType === 'coparent');
    const otherFriends = friends.filter(friend => friend.relationshipType === 'other' || !friend.relationshipType);

    // Add function to change relationship
    const changeRelationship = async (friendId: string, newRelationship: RelationshipType) => {
        if (!userData?.uid || !user) return;

        // Don't allow changes if already updating
        if (isUpdatingRelationship[friendId]) return;

        setIsUpdatingRelationship(prev => ({ ...prev, [friendId]: true }));

        try {
            // Get the friend data
            const friend = friends.find(f => f.id === friendId);
            if (!friend) throw new Error("Friend not found");

            // Get a fresh token
            const token = await user.getIdToken(true);

            // Call the API with proper authentication headers
            const response = await fetch('/api/friends/relationship', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    userId: userData.uid,
                    friendId,
                    relationshipType: newRelationship
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update relationship');
            }

            const result = await response.json();

            // Update local state
            setFriends(prev =>
                prev.map(f =>
                    f.id === friendId ? { ...f, relationshipType: newRelationship } : f
                )
            );

            toast({
                title: "Relacionamento atualizado",
                description: `${friend.firstName} agora é ${result.relationshipDisplay} na sua rede!`
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
        if (!userData?.uid || !user) return [];

        try {
            // Get a fresh token
            const token = await user.getIdToken(true);

            // Call the API to get children with friend-specific access info
            const friendId = selectedFriend?.id;
            const url = friendId
                ? `/api/children/access?userId=${userData.uid}&friendId=${friendId}`
                : `/api/children/access?userId=${userData.uid}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch children');
            }

            return await response.json();
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
        if (!userData?.uid || !selectedFriend || !user) return;

        // Mark this child as updating
        setIsUpdatingChildAccess(prev => ({ ...prev, [childId]: true }));

        try {
            // Get a fresh token
            const token = await user.getIdToken(true);

            // Call the API with proper auth headers
            const response = await fetch('/api/children/access', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    childId,
                    friendId: selectedFriend.id,
                    accessLevel
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update child access');
            }

            const result = await response.json();

            // Update the local state
            setUserChildren(prev =>
                prev.map(child => {
                    if (child.id === childId) {
                        // Create new editors and viewers arrays based on the access level
                        const newEditors = [...(child.editors || [])].filter(id => id !== selectedFriend.id);
                        const newViewers = [...(child.viewers || [])].filter(id => id !== selectedFriend.id);

                        if (accessLevel === 'editor') {
                            newEditors.push(selectedFriend.id);
                        } else if (accessLevel === 'viewer') {
                            newViewers.push(selectedFriend.id);
                        }

                        return {
                            ...child,
                            editors: newEditors,
                            viewers: newViewers
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
                return 'Mãe/Pai'; // Default if gender is 'other' or null
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
            return 'Mãe/Pai';
        };

        const relationshipOptions = [
            { value: 'coparent', label: getCoparentLabel(), icon: Users },
            { value: 'support', label: 'Apoio', icon: Heart },
            { value: 'other', label: 'Outro', icon: UserCog }
        ];

        return (
            <div key={friend.id} className="flex flex-row gap-4 py-2">
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
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blank text-bw">
                            <CameraOff />
                        </div>
                    )}
                    <div className="flex flex-col flex-1">
                        <h3 className="text-lg font-semibold">
                            {`${friend.firstName}`.trim() || friend.displayName || friend.username}
                        </h3>
                        <span className="text-sm text-gray-400">
                            {friend.username ? `@${friend.username}` : ''}
                        </span>
                        <span className="text-sm text-gray-400">
                            {friend.addedAt && friend.addedAt.toDate ? `Adicionado em ${friend.addedAt.toDate().toLocaleDateString()}` : ''}
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
                                    className="h-8 gap-1 hover:bg-accent px-4 text-md font-semibold font-raleway"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin " />
                                    ) : (
                                        getRelationshipDisplay(friend.relationshipType, friend.gender)
                                    )}
                                    <ChevronDown/>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {relationshipOptions.map(option => (
                                    <DropdownMenuItem
                                        key={option.value}
                                        className="flex items-center gap-2 cursor-pointer px-4 text-md font-semibold font-raleway"
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
                        <DialogTitle id="child-permissions-dialog-title">
                            Gerenciar Acesso às Crianças
                        </DialogTitle>
                        <div className="h-[1em]" />
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
                        <div className="h-[1em]" />
                        <DialogDescription>
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
                                <p className="text-gray-400">
                                    Você não tem nenhuma criança adicionada
                                </p>
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