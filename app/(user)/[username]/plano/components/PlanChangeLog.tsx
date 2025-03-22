'use client';

import { useState, useEffect } from 'react';
import { ChangelogEntry } from '../types';
import { getParentalPlanChangeLog } from '../services/plan-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@context/userContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Plus,
  Edit,
  Trash,
  Clock
} from 'lucide-react';

interface PlanChangeLogProps {
  planId: string;
  limit?: number;
}

export default function PlanChangeLog({ planId, limit = 10 }: PlanChangeLogProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !planId) return;

    const fetchChangelog = async () => {
      setLoading(true);
      try {
        const entries = await getParentalPlanChangeLog(planId, user.uid, limit);
        setChangelog(entries);
      } catch (error) {
        console.error('Error fetching changelog:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o histórico de alterações',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChangelog();
  }, [planId, user, limit, toast]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpandEntry = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Plus className="h-4 w-4" />;
      case 'update':
        return <Edit className="h-4 w-4" />;
      case 'delete':
        return <Trash className="h-4 w-4" />;
      case 'approve_field':
        return <CheckCircle className="h-4 w-4" />;
      case 'reject_field':
        return <XCircle className="h-4 w-4" />;
      case 'cancel_field_change':
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    let color = '';
    let label = '';

    switch (action) {
      case 'create':
        color = 'bg-green-100 text-green-800';
        label = 'Criação';
        break;
      case 'update':
        color = 'bg-blue-100 text-blue-800';
        label = 'Atualização';
        break;
      case 'delete':
        color = 'bg-red-100 text-red-800';
        label = 'Exclusão';
        break;
      case 'approve_field':
        color = 'bg-green-100 text-green-800';
        label = 'Aprovação';
        break;
      case 'reject_field':
        color = 'bg-amber-100 text-amber-800';
        label = 'Rejeição';
        break;
      case 'cancel_field_change':
        color = 'bg-gray-100 text-gray-800';
        label = 'Cancelamento';
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
        label = 'Ação';
    }

    return (
      <Badge className={`${color} font-normal`}>
        {getActionIcon(action)}
        <span className="ml-1">{label}</span>
      </Badge>
    );
  };

  // Render a summary of the changes
  const renderChangeSummary = (entry: ChangelogEntry) => {
    if (entry.action === 'create') {
      return <p>Plano parental criado</p>;
    }

    if (entry.action === 'delete') {
      return <p>Plano parental excluído</p>;
    }

    // For field-specific changes
    if (entry.fieldName) {
      const section = entry.section ? `${entry.section}` : '';
      const fieldName = entry.fieldName;

      switch (entry.action) {
        case 'update':
          return <p>Alterou o campo {fieldName} na seção {section}</p>;
        case 'approve_field':
          return <p>Aprovou alteração no campo {fieldName} na seção {section}</p>;
        case 'reject_field':
          return <p>Rejeitou alteração no campo {fieldName} na seção {section}</p>;
        case 'cancel_field_change':
          return <p>Cancelou alteração no campo {fieldName} na seção {section}</p>;
        default:
          return <p>{entry.description}</p>;
      }
    }

    // General update
    if (entry.action === 'update') {
      if (entry.section) {
        return <p>Atualizou seção {entry.section}</p>;
      }
      return <p>Atualizou o plano parental</p>;
    }

    // Fallback to description
    return <p>{entry.description}</p>;
  };

  // Render the detailed changes
  const renderChangeDetails = (entry: ChangelogEntry) => {
    // Skip rendering if there's no before or after data
    if (!entry.fieldsBefore && !entry.fieldsAfter) {
      return null;
    }

    // For field-specific changes, show the old and new values
    if (entry.fieldName && entry.section) {
      const fieldName = entry.fieldName;
      const section = entry.section;
      
      // Extract values - handle both primitive and object values
      const beforeValue = entry.fieldsBefore?.[fieldName] ? 
        (typeof entry.fieldsBefore[fieldName] === 'object' ? 
          (entry.fieldsBefore[fieldName].value || 'N/A') : 
          entry.fieldsBefore[fieldName]) 
        : 'N/A';
      
      const afterValue = entry.fieldsAfter?.[fieldName] ? 
        (typeof entry.fieldsAfter[fieldName] === 'object' ? 
          (entry.fieldsAfter[fieldName].value || 'N/A') : 
          entry.fieldsAfter[fieldName]) 
        : 'N/A';

      return (
        <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Valor anterior:</p>
              <p className="break-words">{beforeValue}</p>
            </div>
            <div>
              <p className="font-medium">Novo valor:</p>
              <p className="break-words">{afterValue}</p>
            </div>
          </div>
        </div>
      );
    }

    // For section updates, show a summary
    if (entry.section) {
      return (
        <div className="mt-2 bg-gray-50 p-2 rounded text-sm">
          <p>Atualizou vários campos na seção {entry.section}</p>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Alterações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent>
        {changelog.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma alteração registrada</p>
        ) : (
          <div className="space-y-4">
            {changelog.map((entry) => (
              <div 
                key={entry.id} 
                className="border rounded p-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <div className="mt-1">{getActionBadge(entry.action)}</div>
                    <div>
                      <div className="font-medium">{renderChangeSummary(entry)}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => entry.id && toggleExpandEntry(entry.id)}
                    className="px-2 h-7"
                  >
                    {expandedEntries.has(entry.id || '') ? 'Menos' : 'Mais'}
                  </Button>
                </div>
                {entry.id && expandedEntries.has(entry.id) && renderChangeDetails(entry)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}