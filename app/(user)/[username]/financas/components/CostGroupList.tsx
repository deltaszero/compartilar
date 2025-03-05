'use client';

import React from 'react';
import { CostGroup, Friend } from './types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";

interface CostGroupListProps {
  costGroups: CostGroup[];
  friends: Friend[];
  isLoadingGroups: boolean;
  selectedGroup: string | null;
  setSelectedGroup: (groupId: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  isAddingGroup: boolean;
  setIsAddingGroup: (value: boolean) => void;
  newGroupName: string;
  setNewGroupName: (value: string) => void;
  newGroupDescription: string;
  setNewGroupDescription: (value: string) => void;
  newGroupMembers: string[];
  setNewGroupMembers: (value: string[]) => void;
  handleCreateGroup: (e: React.FormEvent) => void;
}

export const CostGroupList: React.FC<CostGroupListProps> = ({
  costGroups,
  friends,
  isLoadingGroups,
  selectedGroup,
  setSelectedGroup,
  handleDeleteGroup,
  isAddingGroup,
  setIsAddingGroup,
  newGroupName,
  setNewGroupName,
  newGroupDescription,
  setNewGroupDescription,
  newGroupMembers,
  setNewGroupMembers,
  handleCreateGroup
}) => {

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Grupos de Despesas</CardTitle>
          <Button 
            variant={isAddingGroup ? "default" : "default"}
            size="sm"
            className="h-9"
            onClick={() => setIsAddingGroup(!isAddingGroup)}
          >
            {isAddingGroup ? 'Cancelar' : 'Novo Grupo'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isAddingGroup && (
          <form onSubmit={handleCreateGroup} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-name" className="text-base">Nome do Grupo</Label>
              <Input 
                id="group-name"
                type="text" 
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Ex: Apartamento, Viagem, etc."
                className="h-10"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group-description" className="text-base">Descrição (opcional)</Label>
              <Textarea 
                id="group-description"
                value={newGroupDescription}
                onChange={e => setNewGroupDescription(e.target.value)}
                placeholder="Descreva o propósito deste grupo"
                className="resize-none min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group-members" className="text-base">Membros</Label>
              <Select
                onValueChange={value => {
                  if (value && !newGroupMembers.includes(value)) {
                    setNewGroupMembers([...newGroupMembers, value]);
                  }
                }}
              >
                <SelectTrigger id="group-members" className="h-10">
                  <SelectValue placeholder="Selecione um amigo" />
                </SelectTrigger>
                <SelectContent>
                  {friends.map(friend => (
                    <SelectItem key={friend.uid} value={friend.uid}>
                      {`${friend.firstName} ${friend.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="mt-3 space-y-2">
                {newGroupMembers.map(memberId => {
                  const friend = friends.find(f => f.uid === memberId);
                  return friend ? (
                    <div key={memberId} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span>{`${friend.firstName} ${friend.lastName}`}</span>
                      <Button 
                        type="button"
                        variant="default"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setNewGroupMembers(
                          newGroupMembers.filter(id => id !== memberId)
                        )}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            
            <Button type="submit" className="w-full h-10 mt-4 text-base">
              Criar Grupo
            </Button>
          </form>
        )}
        
        {isLoadingGroups ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {costGroups.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Você ainda não tem grupos de despesas
              </div>
            ) : (
              costGroups.map(group => (
                <div 
                  key={group.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedGroup === group.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-base">{group.name}</h3>
                    <Button 
                      variant="default"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {group.description && (
                    <p className="text-sm mt-1">{group.description}</p>
                  )}
                  <div className="text-sm mt-2">
                    {group.members.length} membros
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};