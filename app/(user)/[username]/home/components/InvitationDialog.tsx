"use client";
import { useState, useEffect } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/lib/firebaseConfig";
import { InvitationData, UserDialogData } from "../types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvitationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserDialogData;
}

export const InvitationDialog = ({ isOpen, onClose, userData }: InvitationDialogProps) => {
  const [invitationType, setInvitationType] = useState<string>("coparent");
  const [message, setMessage] = useState<string>("");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInvitationType("coparent");
      setMessage("");
      setGeneratedLink("");
      setIsGenerating(false);
      setIsCopied(false);
    }
  }, [isOpen]);

  const generateLink = async () => {
    if (!message) {
      toast({
        variant: "destructive",
        title: "Mensagem necessária",
        description: "Por favor, adicione uma mensagem personalizada"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Expires in 7 days
      
      const invitationData: InvitationData = {
        inviterId: userData.uid,
        inviterName: `${userData.firstName} ${userData.lastName}`,
        inviterUsername: userData.username,
        invitationType,
        message,
        createdAt: new Date(),
        expiresAt: expirationDate,
        status: 'active'
      };
      
      // Store invitation in Firestore
      const invitationRef = await addDoc(collection(db, "invitations"), invitationData);
      
      // Generate the invitation link with the invitation ID
      const baseURL = typeof window !== 'undefined' ? `${window.location.origin}/convite` : 'https://compartilar.com/convite';
      const invitationLink = `${baseURL}/${invitationRef.id}`;
      
      setGeneratedLink(invitationLink);
    } catch (error) {
      console.error("Error generating invitation link:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar convite",
        description: "Erro ao gerar link de convite. Tente novamente."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      toast({
        title: "Link copiado",
        description: "Link copiado para a área de transferência!"
      });
      
      // Reset copy confirmation after 3 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Convide alguém para o CompartiLar</h2>
            <Button 
              variant="default" 
              size="icon" 
              onClick={onClose}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          {!generatedLink ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de convite
                </label>
                <select
                  value={invitationType}
                  onChange={(e) => setInvitationType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="coparent">Co-parentalidade</option>
                  <option value="support">Rede de Apoio</option>
                  <option value="family">Família</option>
                  <option value="friend">Amigo</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem personalizada
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Exemplo: Olá! Vamos utilizar o CompartiLar para facilitar nossa comunicação e organização."
                  className="w-full p-2 border border-gray-300 rounded-md h-32"
                />
              </div>
              
              <Button
                className="w-full"
                onClick={generateLink}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Skeleton className="h-4 w-4 rounded-full mr-2" />
                    Gerando link...
                  </>
                ) : "Gerar link de convite"}
              </Button>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <div className="flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Link de convite gerado!</h3>
                <p className="text-sm text-gray-500 mt-1">Compartilhe este link com a pessoa que você quer convidar.</p>
              </div>
              
              <div className="p-2 bg-gray-100 rounded-md mb-4">
                <p className="text-sm font-mono break-all">{generatedLink}</p>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={copyToClipboard}
                >
                  {isCopied ? "Copiado!" : "Copiar link"}
                </Button>
                
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={onClose}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};