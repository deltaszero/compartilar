'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/userContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import UserProfileBar from '@/app/components/logged-area/ui/UserProfileBar';
import { ChevronLeft } from 'lucide-react';

export default function AddChildPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user, userData } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [childData, setChildData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    relationship: '',
    notes: ''
  });

  // Check if user has permission to add a child
  const hasPermission = user?.uid && userData?.username === username;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChildData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setChildData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveChild = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para adicionar uma criança.'
      });
      return;
    }

    // Validate required fields
    if (!childData.firstName || !childData.lastName || !childData.birthDate) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha os campos de nome, sobrenome e data de nascimento.'
      });
      return;
    }

    setIsSaving(true);

    try {
      // Add the child to Firestore
      const childRef = collection(db, 'children');
      const newChild = await addDoc(childRef, {
        ...childData,
        parentId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: 'Criança adicionada',
        description: 'Os dados foram salvos com sucesso!'
      });

      // Redirect to the child's page
      router.push(`/${username}/criancas/${newChild.id}`);
    } catch (error) {
      console.error('Error adding child:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível adicionar a criança. Verifique as permissões ou tente novamente mais tarde.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col min-h-screen">
        <UserProfileBar pathname="Acesso negado" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold text-destructive mb-4">Acesso negado</h2>
            <p className="mb-6">Você não tem permissão para adicionar crianças a este perfil.</p>
            <Link href={`/${username}/criancas`}>
              <Button>Voltar para Crianças</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
      <UserProfileBar pathname="Adicionar Criança" />
      
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-20">
        {/* Back button */}
        <Link 
          href={`/${username}/criancas`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para crianças
        </Link>
        
        <Card className="overflow-hidden">
          <CardHeader>
            <h1 className="text-2xl font-bold">Adicionar Nova Criança</h1>
            <p className="text-muted-foreground">
              Preencha as informações abaixo para adicionar uma nova criança ao seu perfil.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome*</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={childData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome*</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={childData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento*</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={childData.birthDate}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Select
                  value={childData.gender}
                  onValueChange={(value) => handleSelectChange('gender', value)}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Menino</SelectItem>
                    <SelectItem value="female">Menina</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="relationship">Relação</Label>
                <Select
                  value={childData.relationship}
                  onValueChange={(value) => handleSelectChange('relationship', value)}
                >
                  <SelectTrigger id="relationship">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biological">Biológico(a)</SelectItem>
                    <SelectItem value="adopted">Adotivo(a)</SelectItem>
                    <SelectItem value="guardian">Sob guarda</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes"
                name="notes"
                placeholder="Adicione anotações e observações relevantes..."
                className="min-h-[150px]"
                value={childData.notes}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2 border-t p-6">
            <Link href={`/${username}/criancas`}>
              <Button variant="default" className='bg-mainStrongRed' disabled={isSaving}>Cancelar</Button>
            </Link>
            <Button 
              variant="default"
              className='bg-secondaryMain'
              onClick={saveChild}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Adicionar Criança'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}