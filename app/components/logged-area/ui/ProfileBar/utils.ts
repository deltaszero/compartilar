// ProfileBar/utils.ts

/**
 * Format a timestamp into a human-readable relative time
 */
export const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return '';
    
    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMs / 3600000);
        const diffDays = Math.round(diffMs / 86400000);
        
        if (diffMins < 60) {
            return `${diffMins}m atrás`;
        } else if (diffHours < 24) {
            return `${diffHours}h atrás`;
        } else if (diffDays < 7) {
            return `${diffDays}d atrás`;
        } else {
            return date.toLocaleDateString();
        }
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};