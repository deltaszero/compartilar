'use client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChangeHistoryEntry } from '../services/child-api';

interface HistoryEntryProps {
  entry: ChangeHistoryEntry;
}

export function HistoryEntry({ entry }: HistoryEntryProps) {
  // Format timestamp
  const formattedDate = entry.timestamp 
    ? format(new Date(entry.timestamp), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : 'Data desconhecida';

  // Action icon/color mapping
  const actionConfig = {
    create: {
      icon: '➕',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    },
    update: {
      icon: '✏️',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    },
    delete: {
      icon: '🗑️',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    },
    share: {
      icon: '🔗',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    },
    unshare: {
      icon: '🔒',
      badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    },
    default: {
      icon: 'ℹ️',
      badgeColor: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  };
  
  const { icon, badgeColor } = actionConfig[entry.action as keyof typeof actionConfig] || actionConfig.default;

  return (
    <div className="flex items-start space-x-4 p-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {/* User avatar */}
      <Avatar className="h-10 w-10">
        {entry.userPhotoURL ? (
          <AvatarImage src={entry.userPhotoURL} alt={entry.userName || 'Usuário'} />
        ) : (
          <AvatarFallback className="bg-primary/10 text-primary">
            {entry.userName ? entry.userName.charAt(0).toUpperCase() : 'U'}
          </AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{entry.userName || 'Usuário'}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
              {icon} {entry.action.charAt(0).toUpperCase() + entry.action.slice(1)}
            </span>
          </div>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300">{entry.description}</p>
        
        {/* Show changed fields if present */}
        {entry.fields && entry.fields.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            <span>Campos alterados: </span>
            {entry.fields.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}