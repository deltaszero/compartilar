"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { KidInfo } from "../types";
import { db, storage } from "@/app/lib/firebaseConfig";
import { useUser } from "@/context/userContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex items-center">
      {/* CARD */}
      <div className="flex bg-card text-card-foreground shadow-xl w-full rounded-xl overflow-hidden">
        {/* AVATAR */}
        <div className="bg-primary relative">
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
              <span className="text-2xl text-primary-foreground w-full h-full flex items-center justify-center">
                {kid.firstName[0].toUpperCase()}
                {kid.lastName[0].toUpperCase()}
              </span>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />

            <button className="absolute bottom-1 left-1 p-1.5 bg-accent text-accent-foreground rounded-full">
              <EditIcon width={12} height={12} />
            </button>

            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {uploadProgress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
        {/* BODY */}
        <div className="flex flex-col p-4">
          {/* CARD TITLE */}
          <h2 className="text-xl font-semibold">
            {kid.firstName} {kid.lastName}
          </h2>
          <div className="flex flex-row gap-1 text-wrap py-1">
            <Badge variant="secondary">
              {kid.gender === 'male' ? 'Masculino' : 
               kid.gender === 'female' ? 'Feminino' : 'Outro'}
            </Badge>
            <Badge variant="outline">
              {kid.relationship === 'biological' ? 'Biológico' : 
               kid.relationship === 'adopted' ? 'Adotado' : 'Guardião'}
            </Badge>
          </div>

          {/* CARD ACTIONS */}
          <div className="flex justify-end mt-auto">
            <Button variant="outline" size="sm">
              Detalhes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};