'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@context/userContext';
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Notification, NotificationType } from '@/types/shared.types';
import { auth } from '@/app/lib/firebaseConfig';
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
    
    // Load notification count from API
    useEffect(() => {
        if (!userData?.uid) return;
        
        const loadUnreadCount = async () => {
            try {
                // Get authentication token
                const user = auth.currentUser;
                if (!user) {
                    console.error('User not authenticated');
                    return;
                }
                
                const token = await user.getIdToken();
                
                // Get notification count from the API with auth token
                const response = await fetch(`/api/notifications?userId=${userData.uid}&status=pending`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error loading notifications count');
                }
                
                const notifications = await response.json();
                
                // Set the count based on the number of notifications
                setUnreadCount(notifications.length);
            } catch (error) {
                console.error('Error loading unread count:', error);
            }
        };
        
        loadUnreadCount();
        
        // Set up an interval to refresh the count every minute
        const interval = setInterval(loadUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [userData]);
    
    // Load notifications when dropdown is opened
    useEffect(() => {
        if (isOpen && userData?.uid) {
            loadNotifications();
        }
    }, [isOpen, userData?.uid]);
    
    // Load notifications from API
    const loadNotifications = async () => {
        if (!userData?.uid) return;
        
        try {
            console.log("Loading notifications for user:", userData.uid);
            
            // Get authentication token
            const user = auth.currentUser;
            if (!user) {
                console.error('User not authenticated');
                return;
            }
            
            const token = await user.getIdToken();
            
            // Use the API endpoint to fetch notifications with auth token
            const response = await fetch(`/api/notifications?userId=${userData.uid}&status=pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error loading notifications');
            }
            
            const notificationsData = await response.json();
            console.log(`Loaded ${notificationsData.length} notifications from API`);
            
            // Convert to Notification objects
            const formattedNotifications: Notification[] = notificationsData.map((notif: any) => ({
                id: notif.id,
                userId: notif.userId,
                type: notif.type as NotificationType,
                title: notif.title,
                message: notif.message,
                status: notif.status as 'unread' | 'read' | 'archived',
                createdAt: new Date(notif.createdAt),
                metadata: notif.metadata || {},
                actionUrl: notif.actionUrl || `/${userData.username}/home`
            }));
            
            // Set notifications
            setNotifications(formattedNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Set empty notifications array to avoid undefined
            setNotifications([]);
        }
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