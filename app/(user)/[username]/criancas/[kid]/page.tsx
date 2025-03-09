'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/userContext';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, checkFriendshipStatus } from '@/lib/firebaseConfig';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import LoadingPage from '@/app/components/LoadingPage';
import UserProfileBar from '@/app/components/logged-area/ui/UserProfileBar';
import { toast } from '@/hooks/use-toast';
import { KidInfo } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, Camera, Edit, Save, Plus, Trash, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChildDetailPage() {
  const { username, kid } = useParams<{ username: string; kid: string }>();
  const router = useRouter();
  const { user, userData, loading } = useUser();
  const [childData, setChildData] = useState<KidInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedData, setEditedData] = useState<Partial<KidInfo>>({});
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !userData) {
        router.push('/login');
        return;
      }

      try {
        // Get child data
        const childRef = doc(db, 'children', kid as string);
        const childSnap = await getDoc(childRef);

        if (!childSnap.exists()) {
          toast({
            variant: 'destructive',
            title: 'Criança não encontrada',
            description: 'Os dados solicitados não existem.'
          });
          router.push(`/${username}/criancas`);
          return;
        }

        const childInfo = { id: childSnap.id, ...childSnap.data() } as KidInfo;
        setChildData(childInfo);
        setEditedData(childInfo);

        // Check if user is the owner
        if (childInfo.parentId === user.uid) {
          setIsOwner(true);
        } else {
          // Check friendship status
          const status = await checkFriendshipStatus(user.uid, childInfo.parentId);
          if (status === 'none') {
            toast({
              variant: 'destructive',
              title: 'Acesso negado',
              description: 'Você não tem permissão para ver esta informação.'
            });
            // router.push(`${username}/home`);
            return;
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching child data:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Ocorreu um erro ao carregar os dados. Tente novamente.'
        });
        router.push(`/${username}/criancas`);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [user, userData, kid, username, router, loading]);

  // Handle photo selection
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione uma imagem.'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo da imagem é 5MB.'
      });
      return;
    }

    // Create a URL for preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewPhoto(previewUrl);

    // Upload photo to Firebase
    uploadPhoto(file);
  };

  // Upload photo to Firebase Storage
  const uploadPhoto = async (file: File) => {
    if (!user?.uid || !childData?.id) return;

    setUploadProgress(0);
    try {
      if (!storage) {
        throw new Error("Storage is not initialized");
      }
      const storageRef = ref(storage, `children_photos/${childData.id}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading file:', error);
          toast({
            variant: 'destructive',
            title: 'Erro no upload',
            description: 'Não foi possível enviar a foto. Tente novamente.'
          });
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Update edited data with new photo URL
          setEditedData(prev => ({
            ...prev,
            photoURL: downloadURL
          }));

          setUploadProgress(null);

          toast({
            title: 'Foto enviada',
            description: 'A foto foi carregada com sucesso!'
          });
        }
      );
    } catch (error) {
      console.error('Error starting upload:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível iniciar o upload da foto.'
      });
      setUploadProgress(null);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save changes
  const saveChanges = async () => {
    if (!childData?.id) return;

    setIsSaving(true);
    try {
      const childRef = doc(db, 'children', childData.id);
      await updateDoc(childRef, {
        ...editedData,
        updatedAt: new Date()
      });

      setChildData(editedData as KidInfo);
      setIsEditing(false);

      toast({
        title: 'Dados salvos',
        description: 'As informações foram atualizadas com sucesso!'
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações. Tente novamente.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete child
  const deleteChild = async () => {
    if (!childData?.id || !isOwner) return;

    setIsDeleting(true);
    try {
      // Get reference to the child document
      const childRef = doc(db, 'children', childData.id);

      // Delete the photo from storage if it exists
      if (childData.photoURL && storage) {
        try {
          // Extract the storage path from the URL
          const photoPath = decodeURIComponent(childData.photoURL.split('/o/')[1].split('?')[0]);
          const photoRef = ref(storage, photoPath);
          await deleteObject(photoRef);
        } catch (photoError) {
          console.error('Error deleting photo, continuing with child deletion:', photoError);
        }
      }

      // Delete the child document from Firestore
      await deleteDoc(childRef);

      toast({
        title: 'Criança removida',
        description: 'Os dados foram excluídos com sucesso!'
      });

      // Navigate back to the children list
      router.push(`/${username}/criancas`);
    } catch (error) {
      console.error('Error deleting child:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a criança. Tente novamente.'
      });
      setIsDeleting(false);
    }
  };

  // Format date to display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data indisponível';
    }
  };

  // Calculate child's age
  const calculateAge = (birthDateStr: string) => {
    try {
      const birthDate = new Date(birthDateStr);
      const today = new Date();

      let years = today.getFullYear() - birthDate.getFullYear();
      const months = today.getMonth() - birthDate.getMonth();

      if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
        years--;
      }

      if (years < 1) {
        // Calculate months for babies
        const monthAge = months + (months < 0 ? 12 : 0);
        return `${monthAge} ${monthAge === 1 ? 'mês' : 'meses'}`;
      }

      return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    } catch (e) {
      return "Idade não disponível";
    }
  };

  // Get relationship text
  // const getRelationshipText = (relationship: string | null) => {
  //   if (!relationship) return "Relação não especificada";

  //   switch (relationship) {
  //     case "biological": return "Filho(a) Biológico(a)";
  //     case "adopted": return "Filho(a) Adotivo(a)";
  //     case "guardian": return "Sob Guarda";
  //     default: return "Relação não especificada";
  //   }
  // };

  // Get gender text
  // const getGenderText = (gender: string | null) => {
  //   if (!gender) return "Não especificado";

  //   switch (gender) {
  //     case "male": return "Menino";
  //     case "female": return "Menina";
  //     case "other": return "Outro";
  //     default: return "Não especificado";
  //   }
  // };

  if (isLoading || loading) {
    return <LoadingPage />;
  }

  if (!childData) {
    return (
      <div className="flex flex-col min-h-screen">
        <UserProfileBar pathname="Criança não encontrada" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold text-destructive mb-4">Criança não encontrada</h2>
            <p className="mb-6">Os dados solicitados não existem ou foram removidos.</p>
            <Link href={`/${username}/criancas`}>
              <Button>Voltar para Crianças</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const photoToDisplay = previewPhoto || editedData.photoURL || childData.photoURL;

  return (
    <div className="flex flex-col min-h-screen ">
      <UserProfileBar pathname={`${isEditing ? 'Editando' : ''} ${childData.firstName}`} />

      <div className="flex-1 w-full max-w-4xl mx-auto p-4 pb-20">
        {/* Back button */}
        <Link
          href={`/${username}/criancas`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para crianças
        </Link>

        {/* Header with photo and basic info */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Photo section */}
              <div className="relative md:w-1/3 h-64 md:h-auto">
                {photoToDisplay ? (
                  <Image
                    src={photoToDisplay}
                    alt={`Foto de ${childData.firstName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <span className="text-6xl font-bold text-primary/60">
                      {childData.firstName[0].toUpperCase()}
                      {childData.lastName[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Photo upload controls for edit mode */}
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                    <Button
                      variant="default"
                      size="icon"
                      className="absolute bottom-4 right-4 rounded-full bg-secondaryMain"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>

                    {uploadProgress !== null && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs text-center">
                        Enviando... {Math.round(uploadProgress)}%
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Basic info section */}
              <div className="p-6 md:flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Nome</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={editedData.firstName || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Sobrenome</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={editedData.lastName || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Data de Nascimento</Label>
                      <Input
                        id="birthDate"
                        name="birthDate"
                        type="date"
                        value={editedData.birthDate ? new Date(editedData.birthDate).toISOString().split('T')[0] : ''}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gênero</Label>
                        <Select
                          value={editedData.gender || ''}
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
                          value={editedData.relationship || ''}
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
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold">
                      {childData.firstName} {childData.lastName}
                    </h1>

                    {/* <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="default">{getGenderText(childData.gender)}</Badge>
                      <Badge variant="default">{getRelationshipText(childData.relationship)}</Badge>
                    </div> */}

                    <div className="mt-6 space-y-2">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Nascimento: {formatDate(childData.birthDate)}</span> &nbsp; <span className="text-gray-600">({calculateAge(childData.birthDate)})</span>
                      </div>
                      {/* <div className="text-sm">
                        Idade: {calculateAge(childData.birthDate)}
                      </div> */}
                    </div>
                  </>
                )}

                {/* Action buttons */}
                <div className="mt-6 flex justify-between items-center">
                  {/* Delete button - only visible when not editing */}
                  {isOwner && !isEditing && (
                    <Button
                      onClick={() => setShowDeleteDialog(true)}
                      variant="default"
                      size="sm"
                      className="gap-1 bg-mainStrongRed"
                    >
                      <Trash className="h-4 w-4" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                  )}

                  {/* Spacer when in edit mode */}
                  {isEditing && <div></div>}

                  {/* Edit/Save buttons */}
                  <div className="flex gap-2">
                    {isOwner && !isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="default"
                        className='bg-secondaryMain'
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    )}

                    {isEditing && (
                      <>
                        <Button
                          variant="default"
                          className='bg-mainStrongRed'
                          onClick={() => {
                            setIsEditing(false);
                            setEditedData(childData);
                            setPreviewPhoto(null);
                          }}
                          disabled={isSaving}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={saveChanges}
                          disabled={isSaving}
                          variant="default"
                          className="bg-secondaryMain"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirmar exclusão
                      </DialogTitle>
                      <DialogDescription>
                        Você está prestes a excluir todas as informações de{' '}
                        <strong>{childData?.firstName} {childData?.lastName}</strong>.
                        Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-gray-500">
                        Todos os dados associados a esta criança, incluindo fotos e registros, serão permanentemente removidos.
                      </p>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                      <Button
                        variant="default"
                        onClick={() => setShowDeleteDialog(false)}
                        disabled={isDeleting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="default"
                        onClick={deleteChild}
                        disabled={isDeleting}
                        className="gap-2"
                      >
                        {isDeleting ? (
                          <>
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>Excluindo...</span>
                          </>
                        ) : (
                          <>
                            <Trash className="h-4 w-4" />
                            <span>Excluir permanentemente</span>
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional information tabs */}
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="notes">Anotações</TabsTrigger>
            <TabsTrigger value="medical">Saúde</TabsTrigger>
            <TabsTrigger value="education">Educação</TabsTrigger>
          </TabsList>

          {/* Notes tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Anotações</h2>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Adicione anotações e observações relevantes..."
                      className="min-h-[150px]"
                      value={editedData.notes || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    {childData.notes ? (
                      <p>{childData.notes}</p>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Nenhuma anotação disponível.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical tab */}
          <TabsContent value="medical">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Informações Médicas</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  As informações médicas são utilizadas em casos de emergência e para garantir os cuidados necessários.
                </p>

                {/* Medical info would be implemented here with edit functionality */}
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    As informações médicas serão implementadas em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education tab */}
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Informações Educacionais</h2>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Registre informações sobre a escola, série e contatos educacionais.
                </p>

                {/* Education info would be implemented here with edit functionality */}
                <div className="text-center py-4">
                  <p className="text-muted-foreground">
                    As informações educacionais serão implementadas em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}