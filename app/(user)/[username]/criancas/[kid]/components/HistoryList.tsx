'use client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChangeHistoryEntry } from '@/lib/firebaseConfig';
import { getHumanReadableFieldName, formatFieldValue } from './HistoryUtils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Plus, Edit, History, Clock, User, FileText, 
  UserPlus, UserMinus, Users, Trash 
} from 'lucide-react';

interface HistoryListProps {
  historyEntries: ChangeHistoryEntry[];
  historyLoading: boolean;
  historyError: string | null;
}

export default function HistoryList({ 
  historyEntries, 
  historyLoading,
  historyError 
}: HistoryListProps) {
  if (historyLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (historyError) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-md">
        <p>{historyError}</p>
      </div>
    );
  }
  
  if (historyEntries.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md bg-muted/30">
        <p>Nenhum histórico de alteração encontrado.</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Show a note when we're using sample data */}
      {historyEntries.length > 0 && historyEntries[0].userName === 'Sistema' && (
        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
          <p className="font-medium">Dados de exemplo</p>
          <p className="mt-0.5">O histórico real estará disponível quando as regras de segurança forem atualizadas.</p>
        </div>
      )}
      
      <div className="divide-y border rounded-lg overflow-hidden">
        {historyEntries.map((entry, index) => {
          // Format the date to be more readable
          const eventDate = entry.timestamp instanceof Date 
            ? entry.timestamp 
            : new Date(entry.timestamp);
            
          // Generate action description and icon
          let actionIcon = <FileText className="h-3.5 w-3.5" />;
          let actionColor = "bg-blue-100 text-blue-500";
          
          switch (entry.action) {
            case 'create':
              actionIcon = <Plus className="h-3.5 w-3.5" />;
              actionColor = "bg-green-100 text-green-600";
              break;
            case 'update':
              actionIcon = <Edit className="h-3.5 w-3.5" />;
              actionColor = "bg-bg text-main";
              break;
            case 'permission_add':
              actionIcon = <UserPlus className="h-3.5 w-3.5" />;
              actionColor = "bg-purple-100 text-purple-600";
              break;
            case 'permission_remove':
              actionIcon = <UserMinus className="h-3.5 w-3.5" />;
              actionColor = "bg-orange-100 text-orange-600";
              break;
            case 'delete':
              actionIcon = <Trash className="h-3.5 w-3.5" />;
              actionColor = "bg-red-100 text-red-600";
              break;
          }
          
          return (
            <div key={index} className="py-2.5 px-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-1.5 rounded-md ${actionColor}`}>
                    {actionIcon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium leading-tight">{entry.description}</h4>
                    <div className="flex items-center text-xs space-x-2 mt-0.5">
                      <span className="inline-flex items-center">
                        <User className="h-2.5 w-2.5 mr-0.5" />
                        {entry.userName || entry.userId}
                      </span>
                      <span className="inline-flex items-center">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {format(eventDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Display a badge with the number of changed fields */}
                {entry.action === 'update' && entry.fields && (
                  <Badge variant="default" className="text-xs px-1.5 py-0 h-5">
                    {entry.fields.length} campo{entry.fields.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {/* Show changed fields if this is an update - in a compact format */}
              {(entry.action === 'update' || entry.action.startsWith('permission_')) && entry.fields && (
                <details className="mt-1.5 ml-7 text-xs">
                  <summary className="cursor-pointer hover:text-foreground">
                    Detalhes da alteração
                  </summary>
                  <div className="mt-1 space-y-1 pl-2 border-l-2 border-muted">
                    {entry.fields.map(field => (
                      <div key={field} className="pt-0.5">
                        {/* Use fieldLabels if available, otherwise use the raw field name */}
                        <div className="font-medium">
                          {entry.fieldLabels?.[entry.fields.indexOf(field)] || getHumanReadableFieldName(field)}:
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-0.5">
                          {entry.oldValues && entry.oldValues[field] !== undefined && (
                            <div>
                              <span>Antes:</span> {formatFieldValue(field, entry.oldValues?.[field])}
                            </div>
                          )}
                          {entry.newValues && entry.newValues[field] !== undefined && (
                            <div>
                              <span>Depois:</span> {formatFieldValue(field, entry.newValues?.[field])}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}