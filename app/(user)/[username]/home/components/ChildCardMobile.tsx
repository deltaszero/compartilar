"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { KidInfo } from "../types";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export const ChildCardMobile = ({ kid }: { kid: KidInfo }) => {
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      toast({
        title: "Upload iniciado",
        description: "Iniciando upload da foto..."
      });
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div onClick={handlePhotoClick} className="cursor-pointer">
        <AspectRatio ratio={1}>
          {photoURL ? (
            <div className="relative w-full h-full">
              <Image
                src={photoURL}
                alt={`${kid.firstName}'s photo`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white font-medium text-xl">
                    {kid.firstName}
                  </h3>
                  <p className="text-white/80 text-xs">
                    {kid.relationship === 'biological' ? 'Biológico' : 
                     kid.relationship === 'adopted' ? 'Adotado' : 'Guardião'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-primary flex flex-col items-center justify-center">
              <div className="text-4xl text-primary-foreground font-medium">
                {kid.firstName[0].toUpperCase()}
                {kid.lastName[0].toUpperCase()}
              </div>
              <div className="text-primary-foreground/80 text-xs mt-2">
                Adicionar foto
              </div>
            </div>
          )}
        </AspectRatio>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handlePhotoChange}
      />
    </Card>
  );
};