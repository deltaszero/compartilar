'use client';
import { Badge } from "@/components/ui/badge";
import { FriendshipStatus } from '@/lib/firebaseConfig';

export const RelationshipBadge = ({ status }: { status: FriendshipStatus }) => {
    const getBadgeVariant = () => {
        switch (status) {
            case 'coparent':
                return "default";
            case 'support':
                return "default";
            case 'other':
                return 'default';
            default:
                return 'default';
        }
    };

    const getRelationshipText = () => {
        switch (status) {
            case 'coparent':
                return 'Mãe/Pai';
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
            variant={getBadgeVariant() as "default" | "neutral" } 
            className="px-4 py-1 text-base rounded-md shadow-sm"
        >
            {getRelationshipText()}
        </Badge>
    );
};

export default RelationshipBadge;