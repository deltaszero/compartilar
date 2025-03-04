import { useState, useEffect } from "react";
import { EventFormProps, EventFormData } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, addHours } from "date-fns";
import { isEndAfterStart } from "./date-utils";

export function EventForm({
  isOpen,
  onClose,
  event,
  selectedDate,
  childrenData = [],
  onSave,
  userId
}: EventFormProps) {
  const now = new Date();
  const oneHourLater = addHours(now, 1);

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(now, "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(now, "yyyy-MM-dd"),
    endTime: format(oneHourLater, "HH:mm"),
    location: "",
    category: "activity",
    childId: childrenData[0]?.id || "",
    responsibleParentId: userId,
    checkInRequired: false
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      let newFormData;
      
      if (event) {
        // Editing existing event
        const startDate = event.startTime.toDate();
        const endDate = event.endTime.toDate();
        
        newFormData = {
          title: event.title,
          description: event.description || "",
          startDate: format(startDate, "yyyy-MM-dd"),
          startTime: format(startDate, "HH:mm"),
          endDate: format(endDate, "yyyy-MM-dd"),
          endTime: format(endDate, "HH:mm"),
          location: event.location?.address || "",
          category: event.category,
          childId: event.childId || childrenData[0]?.id || "",
          responsibleParentId: event.responsibleParentId,
          checkInRequired: event.checkInRequired
        };
      } else {
        // Creating new event
        newFormData = {
          title: "",
          description: "",
          startDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(now, "yyyy-MM-dd"),
          startTime: format(now, "HH:mm"),
          endDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(now, "yyyy-MM-dd"),
          endTime: format(oneHourLater, "HH:mm"),
          location: "",
          category: "activity",
          childId: childrenData[0]?.id || "",
          responsibleParentId: userId,
          checkInRequired: false
        };
      }
      
      // Compare the objects to prevent unnecessary setFormData calls
      if (JSON.stringify(formData) !== JSON.stringify(newFormData)) {
        setFormData(newFormData);
      }
      
      setError(null);
      setErrors({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleChange = (field: keyof EventFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Título é obrigatório";
    }
    
    if (!formData.startDate) {
      newErrors.startDate = "Data de início é obrigatória";
    }
    
    if (!formData.startTime) {
      newErrors.startTime = "Hora de início é obrigatória";
    }
    
    if (!formData.endDate) {
      newErrors.endDate = "Data de término é obrigatória";
    }
    
    if (!formData.endTime) {
      newErrors.endTime = "Hora de término é obrigatória";
    }

    // Check if end date/time is after start date/time
    const isValidTimeRange = isEndAfterStart(
      formData.startDate,
      formData.startTime,
      formData.endDate,
      formData.endTime
    );
    
    if (!isValidTimeRange) {
      newErrors.endTime = "A hora de término deve ser depois da hora de início";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-4 border-black shadow-brutalist max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {event ? "Editar Evento" : "Criar Evento"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-bold">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={`border-2 ${errors.title ? 'border-red-500' : 'border-black'}`}
              placeholder="Título do evento"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="font-bold">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="border-2 border-black min-h-[80px]"
              placeholder="Descrição do evento"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="font-bold">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className={`border-2 ${errors.startDate ? 'border-red-500' : 'border-black'}`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime" className="font-bold">Hora de Início</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                className={`border-2 ${errors.startTime ? 'border-red-500' : 'border-black'}`}
              />
              {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="font-bold">Data de Término</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className={`border-2 ${errors.endDate ? 'border-red-500' : 'border-black'}`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime" className="font-bold">Hora de Término</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                className={`border-2 ${errors.endTime ? 'border-red-500' : 'border-black'}`}
              />
              {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="font-bold">Localização</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="border-2 border-black"
              placeholder="Localização do evento"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="font-bold">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleChange("category", value as any)}
              >
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black">
                  <SelectItem value="school">Escola</SelectItem>
                  <SelectItem value="medical">Médico</SelectItem>
                  <SelectItem value="activity">Atividade</SelectItem>
                  <SelectItem value="visitation">Visita</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="childId" className="font-bold">Criança</Label>
              <Select 
                value={formData.childId} 
                onValueChange={(value) => handleChange("childId", value)}
                disabled={childrenData.length === 0}
              >
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder={childrenData.length === 0 ? "Sem crianças" : "Selecione a criança"} />
                </SelectTrigger>
                <SelectContent className="border-2 border-black">
                  {childrenData.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.firstName} {child.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Checkbox
              id="checkInRequired"
              checked={formData.checkInRequired}
              onCheckedChange={(checked) => handleChange("checkInRequired", Boolean(checked))}
              className="mt-1 border-2 border-black"
            />
            <Label 
              htmlFor="checkInRequired" 
              className="font-medium text-sm"
            >
              Exigir check-in quando o evento começar
            </Label>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded text-sm border-2 border-red-500">
              {error}
            </div>
          )}
          
          <DialogFooter className="gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-black"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="border-2 border-black bg-black text-white shadow-brutalist-sm hover:translate-y-1 transition-transform"
            >
              {saving ? "Salvando..." : event ? "Atualizar Evento" : "Criar Evento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}