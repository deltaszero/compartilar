import { ChangeEvent } from 'react';
import { KidInfo } from '../../../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Edit, Save } from 'lucide-react';

interface ChildInfoFormProps {
  childData: KidInfo | null;
  editedData: Partial<KidInfo>;
  isEditing: boolean;
  isOwnerOrEditor: boolean;
  isSaving: boolean;
  uploadProgress: number | null;
  onEditToggle: () => void;
  onSave: () => void;
  onInputChange: (name: string, value: string) => void;
}

export function ChildInfoForm({
  childData,
  editedData,
  isEditing,
  isOwnerOrEditor,
  isSaving,
  uploadProgress,
  onEditToggle,
  onSave,
  onInputChange
}: ChildInfoFormProps) {
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onInputChange(name, value);
  };

  const handleSelectChange = (name: string, value: string) => {
    onInputChange(name, value);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Nome</Label>
              <Input
                id="firstName"
                name="firstName"
                value={editedData.firstName || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Nome"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                name="lastName"
                value={editedData.lastName || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Sobrenome"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={editedData.birthDate || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gênero</Label>
              <Select
                name="gender"
                value={editedData.gender || ''}
                onValueChange={(value) => handleSelectChange('gender', value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={editedData.notes || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Informações adicionais, alergias, etc."
              className="h-24"
            />
          </div>
        </div>
      </CardContent>
      
      {isOwnerOrEditor && (
        <CardFooter className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={onEditToggle}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={onSave}
                disabled={isSaving || uploadProgress !== null}
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
                {!isSaving && <Save className="ml-2 h-4 w-4" />}
              </Button>
            </>
          ) : (
            <Button onClick={onEditToggle}>
              Editar
              <Edit className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}