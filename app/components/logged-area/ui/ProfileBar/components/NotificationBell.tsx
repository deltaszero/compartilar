'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@context/userContext';
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Notification, NotificationType } from '@/types/shared.types';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';// import { collection, getDocs, query, where, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebaseConfig';
import { NotificationItem } from './NotificationItem';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const { userData } = useUser();
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    // Load notification count - disabled to prevent permission errors
    useEffect(() => {
        if (!userData?.uid) return;
        
        // Set count to 0 without querying Firestore
        setUnreadCount(0);
        
        /* Firestore query disabled to prevent permission errors
        const loadUnreadCount = async () => {
            try {
                // Just count friend requests for now
                const friendRequestsRef = collection(db, 'friendship_requests');
                const requestsQuery = query(
                    friendRequestsRef,
                    where('receiverId', '==', userData.uid),
                    where('status', '==', 'pending')
                );
                const requestsSnapshot = await getDocs(requestsQuery);
                const requestsCount = requestsSnapshot.size;
                
                // Set the count
                setUnreadCount(requestsCount);
            } catch (error) {
                console.error('Error loading unread count:', error);
            }
        };
        
        loadUnreadCount();
        
        // Set up an interval to refresh the count every minute
        const interval = setInterval(loadUnreadCount, 60000);
        return () => clearInterval(interval);
        */
    }, [userData]);
    
    // Load notifications when dropdown is opened
    useEffect(() => {
        if (isOpen && userData?.uid) {
            loadNotifications();
        }
    }, [isOpen, userData?.uid]);
    
    // Load notifications from friend requests - disabled to prevent permission errors
    const loadNotifications = async () => {
        if (!userData?.uid) return;
        
        // Set empty notifications without querying Firestore
        setNotifications([]);
        
        /* Firestore query disabled to prevent permission errors
        try {
            console.log("Loading notifications for user:", userData.uid);
            
            // For now, just get friend requests and convert them to notification format
            const friendRequestsRef = collection(db, 'friendship_requests');
            const requestsQuery = query(
                friendRequestsRef,
                where('receiverId', '==', userData.uid),
                where('status', '==', 'pending')
            );
            
            const requestsSnapshot = await getDocs(requestsQuery);
            console.log(`Found ${requestsSnapshot.size} friend requests`);
            
            if (requestsSnapshot.empty) {
                setNotifications([]);
                return;
            }
            
            const friendRequests: Notification[] = [];
            
            requestsSnapshot.forEach(doc => {
                try {
                    const data = doc.data();
                    console.log("Processing request:", doc.id, data);
                    
                    // Ensure all required fields exist
                    if (!data || !data.senderUsername) {
                        console.log("Missing required data for notification, skipping");
                        return;
                    }
                    
                    // Create a notification object with proper validation
                    const notification: Notification = {
                        id: doc.id,
                        userId: userData.uid,
                        type: 'friend_request' as NotificationType,
                        title: 'Nova solicitação de amizade',
                        message: `${data.senderUsername} quer se conectar como ${data.relationshipType || 'amigo'}`,
                        status: 'unread' as 'unread' | 'read' | 'archived',
                        createdAt: data.createdAt || Timestamp.now(),
                        metadata: {
                            senderId: data.senderId || '',
                            senderUsername: data.senderUsername || '',
                            senderPhotoURL: data.senderPhotoURL || '',
                            requestId: doc.id,
                            relationshipType: data.relationshipType || 'support'
                        },
                        actionUrl: `/${userData.username}/home`
                    };
                    
                    friendRequests.push(notification);
                } catch (err) {
                    console.error("Error processing notification:", err);
                }
            });
            
            console.log("Final notifications list:", friendRequests);
            
            // Set notifications
            setNotifications(friendRequests);
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Set empty notifications array to avoid undefined
            setNotifications([]);
        }
        */
    };
    
    // Mark notification as read - currently just redirects for friend requests
    // since those are handled on the home page
    const handleMarkAsRead = async (id: string) => {
        try {
            const notification = notifications.find(n => n.id === id);
            if (!notification) return;
            
            // Friend requests are handled on the home page, so just navigate there
            if (notification.type === 'friend_request' && notification.actionUrl) {
                window.location.href = notification.actionUrl;
                return;
            }
            
            // For other notification types, we would mark them as read in the database
            // but we're not using those yet
            
            // Just navigate to the action URL if present
            if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
            }
        } catch (error) {
            console.error('Error handling notification:', error);
        }
    };
    
    // Mark all as read - currently doesn't do anything since we only have friend requests
    // and those should remain visible until accepted/rejected
    const handleMarkAllAsRead = async () => {
        // This function would mark all non-friend-request notifications as read
        // but since we're not using those yet, it doesn't need to do anything
        console.log('Mark all as read - no action needed yet');
    };
    
    return (
        <div className="relative" ref={dropdownRef}>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="default"
                        size="icon"
                        className="h-9 w-9 relative rounded-md"
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-secondaryMain text-[10px] font-medium text-primary-foreground ring-1 ring-background">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                        <span className="sr-only">Notificações</span>
                    </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent
                    align="end"
                    className="w-80 p-0 mt-2 border-2 border-black rounded-md shadow-lg z-[1000] overflow-hidden"
                >
                    <div className="flex items-center justify-between p-3 border-b">
                        <h3 className="font-bold text-sm">Notificações</h3>
                        {unreadCount > 0 && (
                            <Button 
                                variant="default" 
                                size="sm" 
                                className="text-xs h-7"
                                onClick={handleMarkAllAsRead}
                            >
                                Marcar todas como lidas
                            </Button>
                        )}
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <NotificationItem 
                                    key={notification.id}
                                    notification={notification}
                                    onRead={handleMarkAsRead}
                                />
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                <p className="text-sm">Sem notificações</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-2 border-t text-center">
                        <Link 
                            href={`/${userData?.username}/home`}
                            className="text-xs hover:underline"
                        >
                            Ver todas as notificações
                        </Link>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};