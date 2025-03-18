'use client';

import { Notification } from '@/types/shared.types';
import { 
    UserPlus, 
    Mail, 
    Calendar, 
    DollarSign, 
    CheckSquare, 
    FileText, 
    AlertCircle, 
    Bell 
} from "lucide-react";
import { formatTime } from '../utils';

export interface NotificationItemProps {
    notification: Notification;
    onRead: (id: string) => void;
}

export const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
    // Handle notification click - mark as read and navigate if needed
    const handleClick = async () => {
        try {
            // For friend request notifications, we need special handling
            if (notification.type === 'friend_request') {
                // Just call the provided onRead handler which will navigate to the right page
                onRead(notification.id);
                return;
            }
            
            // For other notification types, use the API to mark as read
            // Get authentication token from Firebase
            const auth = (await import('@/app/lib/firebaseConfig')).auth;
            const user = auth.currentUser;
            if (!user) {
                console.error('User not authenticated');
                throw new Error('User not authenticated');
            }
            
            const token = await user.getIdToken();
            
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    notificationId: notification.id,
                    userId: notification.userId,
                    status: 'read'
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error marking notification as read');
            }
            
            // Then call the provided handler for UI updates
            onRead(notification.id);
            
            // Navigate if needed
            if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Still call onRead for UI consistency
            onRead(notification.id);
        }
    };
    
    // Different icon based on notification type
    const getIcon = () => {
        switch (notification.type) {
            case 'friend_request':
                return <UserPlus className="h-5 w-5 text-blue-500" />;
            case 'message':
                return <Mail className="h-5 w-5 text-green-500" />;
            case 'event_reminder':
                return <Calendar className="h-5 w-5 text-yellow-500" />;
            case 'expense':
                return <DollarSign className="h-5 w-5 text-red-500" />;
            case 'task':
                return <CheckSquare className="h-5 w-5 text-purple-500" />;
            case 'decision':
                return <FileText className="h-5 w-5 text-orange-500" />;
            case 'system':
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
            default:
                return <Bell className="h-5 w-5" />;
        }
    };
    
    return (
        <div 
            className={`
                flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-md
                ${notification.status === 'unread' ? 'bg-blue-50' : ''}
            `}
            onClick={handleClick}
        >
            <div className="mt-1">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
            </div>
        </div>
    );
};