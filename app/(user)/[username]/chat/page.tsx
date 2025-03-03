// app/(user)/[username]/chat/page.tsx
'use client';
import React from 'react';
import UserProfileBar from "@/app/components/logged-area/ui/UserProfileBar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ConstructionIcon, MessageSquare, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ChatItem component for displaying a fake chat entry in the brutalist style
 */
const ChatItem = ({ name, message, isActive = false }: { 
  name: string; 
  message: string;
  isActive?: boolean;
}) => (
  <div 
    className={cn(
      "flex flex-col p-4 mb-4 border-2 border-border rounded-base",
      "hover:translate-x-[2px] hover:translate-y-[2px] transition-transform cursor-pointer",
      isActive ? "bg-main shadow-shadow" : "bg-bw"
    )}
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full border-2 border-border bg-secondaryMain flex items-center justify-center text-sm font-heading">
        {name.substring(0, 1).toUpperCase()}
      </div>
      <h3 className="font-heading">{name}</h3>
    </div>
    <p className="mt-2 text-sm text-text truncate">{message}</p>
  </div>
);

export default function ChatPage() {
  // Empty state for the chat app
  return (
    <div className="h-screen flex flex-col bg-bg">
      <UserProfileBar pathname='Conversas' />
      
      <div className="flex flex-col md:flex-row flex-1 p-4 gap-4">
        {/* Left sidebar - Conversation list */}
        <div className="w-full md:w-1/3 border-2 border-border rounded-base p-4 bg-bg shadow-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg">Conversas</h2>
            <Button variant="noShadow" size="sm" className="border-2 border-border">
              <MessageSquare size={18} />
              <span>Nova</span>
            </Button>
          </div>
          
          <div className="space-y-2">
            <ChatItem 
              name="Maria"
              message="Preciso trocar o horário da visita"
              isActive={true}
            />
            <ChatItem 
              name="Grupo da Escola" 
              message="Reunião de pais nesta quinta-feira"
            />
          </div>
        </div>
        
        {/* Right content - Chat or empty state */}
        <div className="flex-1 flex items-center justify-center">
          <Alert className="max-w-md border-2 border-border bg-bw shadow-shadow">
            <ConstructionIcon className="h-6 w-6 mr-2" />
            <AlertTitle className="text-lg font-heading">
              Módulo em desenvolvimento
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p>O sistema de mensagens entre cuidadores estará disponível em breve.</p>
              <p className="mt-2">Funcionalidades planejadas:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  <span>Mensagens diretas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users size={16} />
                  <span>Grupos de conversa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <span>Compartilhamento de arquivos</span>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}