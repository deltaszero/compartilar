import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Edit, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ParentalPlan } from '../types';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useUser } from '@/context/userContext';
import { deleteParentalPlan } from '../services/plan-service';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlanListItemProps {
  plan: ParentalPlan;
  onDeleted?: () => void;
}

export default function PlanListItem({ plan, onDeleted }: PlanListItemProps) {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user } = useUser();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const formattedDate = plan.updatedAt 
    ? formatDistanceToNow(new Date(plan.updatedAt), { addSuffix: true, locale: ptBR })
    : "Data desconhecida";
  
  const childCount = plan.childrenIds?.length || 0;
  
  // Status badge color
  const getStatusBadge = () => {
    switch (plan.status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500">Rascunho</Badge>;
      case 'archived':
        return <Badge className="bg-gray-500">Arquivado</Badge>;
      default:
        return null;
    }
  };
  
  // Simplified truncated description
  const truncateDescription = (text?: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text;
  };
  
  // Navigate to plan details
  const handleViewPlan = () => {
    router.push(`/${username}/plano/${plan.id}`);
  };
  
  // Navigate to edit form
  const handleEditPlan = () => {
    router.push(`/${username}/plano/${plan.id}/editar`);
  };
  
  // Handle delete
  const handleDeletePlan = async () => {
    if (!user) return;
    
    try {
      setIsDeleting(true);
      await deleteParentalPlan(user, plan.id);
      toast({
        title: "Plano excluído",
        description: "O plano parental foi excluído com sucesso.",
      });
      
      if (onDeleted) {
        onDeleted();
      } else {
        // Refresh the page if no callback provided
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o plano. Tente novamente mais tarde.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  
  return (
    <>
      <Card className="overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold">{plan.title}</CardTitle>
              <CardDescription className="text-sm">
                Atualizado {formattedDate}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <p className="text-sm text-gray-600 mb-3">
            {truncateDescription(plan.description) || "Sem descrição"}
          </p>
          
          <div className="flex items-center text-sm text-gray-500">
            <FileText className="h-4 w-4 mr-1" />
            <span>{childCount} {childCount === 1 ? 'criança' : 'crianças'}</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2">
          <Button 
            variant="default" 
            className="w-full mr-2"
            onClick={handleViewPlan}
          >
            Ver detalhes
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEditPlan}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano parental</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este plano parental? 
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}