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
    const handleClick = () => {
        onRead(notification.id);
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
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