'use client';
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { HistoryEntry } from './HistoryEntry';
import { ChangeHistoryEntry, fetchChildHistory } from '../services/child-api';

interface HistoryListProps {
  childId: string;
  user: User | null;
}

export function HistoryList({ childId, user }: HistoryListProps) {
  const [historyEntries, setHistoryEntries] = useState<ChangeHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistoryData = async () => {
    if (!user || !childId) {
      setIsLoading(false);
      setError('É necessário estar autenticado para ver o histórico');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get a fresh token
      const token = await user.getIdToken(true);

      // Fetch history data
      const history = await fetchChildHistory(childId, token, 50);
      setHistoryEntries(history);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Não foi possível carregar o histórico');
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar o histórico. Tente novamente mais tarde.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load history data on component mount
  useEffect(() => {
    loadHistoryData();
  }, [childId, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Carregando histórico...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadHistoryData} variant="neutral" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (historyEntries.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center text-gray-500">
        <p>Nenhum registro de alteração encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-medium">Histórico de Alterações</h3>
        <Button onClick={loadHistoryData} variant="neutral" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
        {historyEntries.map((entry) => (
          <HistoryEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}