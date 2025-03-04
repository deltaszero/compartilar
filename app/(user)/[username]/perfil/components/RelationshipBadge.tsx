'use client';
import { Badge } from "@/components/ui/badge";
import { FriendshipStatus } from '@/lib/firebaseConfig';

export const RelationshipBadge = ({ status }: { status: FriendshipStatus }) => {
    const getBadgeVariant = () => {
        switch (status) {
            case 'coparent':
                return 'secondary';
            case 'support':
                return 'outline';
            case 'other':
                return 'default';
            default:
                return 'default';
        }
    };

    const getRelationshipText = () => {
        switch (status) {
            case 'coparent':
                return 'Co-Parent';
            case 'support':
                return 'Rede de Apoio';
            case 'other':
                return 'Contato';
            default:
                return 'Contato';
        }
    };

    return (
        <Badge 
            variant={getBadgeVariant() as "default" | "secondary" | "destructive" | "outline"} 
            className="px-4 py-1 text-base rounded-full shadow-sm"
        >
            {getRelationshipText()}
        </Badge>
    );
};

export default RelationshipBadge;