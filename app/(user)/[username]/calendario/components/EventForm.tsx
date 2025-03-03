"use client";

import { useEffect, useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EventFormProps, EventFormData } from "./types";
import dayjs from "dayjs";

export function EventForm({
  isOpen,
  onClose,
  event,
  selectedDate,
  childrenData = [],
  onSave,
  userId,
  // children
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    startDate: selectedDate ? selectedDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    startTime: "08:00",
    endDate: selectedDate ? selectedDate.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    endTime: "09:00",
    location: "",
    category: "other",
    childId: "",
    responsibleParentId: userId,
    checkInRequired: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      // Edit mode - populate form with event data
      const startDate = dayjs(event.startTime.toDate());
      const endDate = dayjs(event.endTime.toDate());
      
      setFormData({
        title: event.title,
        description: event.description || "",
        startDate: startDate.format("YYYY-MM-DD"),
        startTime: startDate.format("HH:mm"),
        endDate: endDate.format("YYYY-MM-DD"),
        endTime: endDate.format("HH:mm"),
        location: event.location?.address || "",
        category: event.category,
        childId: event.childId || "",
        responsibleParentId: event.responsibleParentId || userId,
        checkInRequired: event.checkInRequired || false
      });
    } else if (selectedDate) {
      // Create mode with selected date
      setFormData(prev => ({
        ...prev,
        startDate: selectedDate.format("YYYY-MM-DD"),
        endDate: selectedDate.format("YYYY-MM-DD")
      }));
    }
  }, [event, selectedDate, userId]);

  const handleChange = (
    field: keyof EventFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora Inicial</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endTime">Hora Final</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">Escola</SelectItem>
                <SelectItem value="medical">Médico</SelectItem>
                <SelectItem value="activity">Atividade</SelectItem>
                <SelectItem value="visitation">Visita</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="childId">Criança</Label>
            <Select
              value={formData.childId}
              onValueChange={(value) => handleChange("childId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma criança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Não especificado</SelectItem>
                {childrenData.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.firstName} {child.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Endereço ou local"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="checkInRequired"
              checked={formData.checkInRequired}
              onCheckedChange={(checked) => 
                handleChange("checkInRequired", Boolean(checked))
              }
            />
            <Label htmlFor="checkInRequired" className="cursor-pointer">
              Check-in obrigatório
            </Label>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : event ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}