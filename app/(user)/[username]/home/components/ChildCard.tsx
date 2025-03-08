"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { KidInfo } from "../types";
import { db, storage } from "@/app/lib/firebaseConfig";
import { useUser } from "@/context/userContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, runTransaction } from "firebase/firestore";
import EditIcon from "@/app/assets/icons/edit.svg";

export const ChildCard = ({ kid }: { kid: KidInfo }) => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch the child's photo URL if exists
    const fetchChildPhotoURL = async () => {
      try {
        if (kid.photoURL) {
          setPhotoURL(kid.photoURL);
        }
      } catch (error) {
        console.error("Error fetching child photo:", error);
      }
    };
    fetchChildPhotoURL();
  }, [kid]);

  const handlePhotoClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setPhotoFile(file);
      uploadChildPhoto(file);
    }
  };

  const uploadChildPhoto = async (file: File) => {
    if (!user || !kid.id) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Check if we have access to storage (client-side only)
      if (typeof window === "undefined" || !storage) {
        toast({
          variant: "destructive",
          title: "Erro de Upload",
          description: "Upload de fotos só é possível no navegador."
        });
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }

      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione um arquivo de imagem válido."
        });
        throw new Error("Por favor, selecione um arquivo de imagem válido.");
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "O arquivo é muito grande. O tamanho máximo é de 2MB."
        });
        throw new Error("O arquivo é muito grande. O tamanho máximo é de 2MB.");
      }

      // Upload photo to firebase storage
      const storageRef = ref(storage, `children_photos/${kid.id}/profile.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Handle upload state
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          setIsUploading(false);
          setUploadProgress(null);
          toast({
            variant: "destructive",
            title: "Erro no upload",
            description: error.message
          });
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setPhotoURL(downloadURL);

            // Update child document with new photo URL
            await runTransaction(db, async (transaction) => {
              const childRef = doc(db, "children", kid.id);
              transaction.update(childRef, {
                photoURL: downloadURL,
                updatedAt: new Date(),
              });
            });

            toast({
              title: "Upload concluído",
              description: "Foto de perfil atualizada com sucesso!"
            });
          } catch (err) {
            console.error("Error updating child photo:", err);
            toast({
              variant: "destructive",
              title: "Falha na atualização",
              description: "Erro ao atualizar a foto de perfil. Tente novamente."
            });
          } finally {
            setIsUploading(false);
            setUploadProgress(null);
          }
        }
      );
    } catch (error) {
      console.error("Error uploading child photo:", error);
      setIsUploading(false);
      setUploadProgress(null);
      toast({
        variant: "destructive",
        title: "Erro de inicialização",
        description: "Erro ao iniciar upload. Tente novamente mais tarde."
      });
    }
  };

  return (
    <Card className="w-full overflow-hidden bg-white border-2 border-black rounded-none overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
      <div className="flex">
        {/* AVATAR */}
        <div className="relative border-r-2 border-black bg-main">
          <div
            className="flex items-center justify-center cursor-pointer w-[128px] h-[128px]"
            onClick={handlePhotoClick}
          >
            {photoURL ? (
              <Image
                src={photoURL}
                alt={`${kid.firstName}'s photo`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-black text-black">
                  {kid.firstName[0].toUpperCase()}
                  {kid.lastName[0].toUpperCase()}
                </span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />

            {/* <button className="absolute bottom-2 left-2 p-1.5 bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <EditIcon width={12} height={12} />
            </button> */}
            <Button 
              variant="default" 
              size="sm"
              className="absolute bottom-1.5 left-1.5 p-1.5 rounded-full bg-secondaryMain"
              // className="font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none hover:translate-y-[-2px] hover:shadow-[2px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <EditIcon width={12} height={12} />
            </Button>

            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-none"></div>
              </div>
            )}
          </div>

          {uploadProgress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 border-t border-black">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* BODY */}
        <CardContent className="flex flex-col p-4 w-full">
          {/* CARD TITLE */}
          <h2 className="text-xl font-bold tracking-tight">
            {kid.firstName} {kid.lastName}
          </h2>
          
          {/* PERMISSION BADGE */}
          <div className="mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${kid.accessLevel === 'editor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {kid.accessLevel === 'editor' ? 'Editor' : 'Visualizador'}
            </span>
          </div>

          {/* CARD ACTIONS */}
          <div className="flex justify-end mt-auto">
            <Button 
              variant="default" 
              size="sm"
              // className="font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none hover:translate-y-[-2px] hover:shadow-[2px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Detalhes
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};