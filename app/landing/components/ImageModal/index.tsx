import Image from "next/image";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ImageModalProps } from "./types";

export default function ImageModal({ open, onOpenChange, selectedImage }: ImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">
          {selectedImage?.alt || "Visualização de imagem do Plano Parental"}
        </DialogTitle>
        
        {selectedImage && (
          <div className="relative bg-transparent">
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute -top-2 right-2 bg-main rounded-full p-2 shadow-md z-50"
              aria-label="Fechar visualização"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex items-center justify-center">
              <Image 
                src={selectedImage.src} 
                alt={selectedImage.alt}
                width={800}
                height={1000}
                className="object-contain max-h-[85vh] max-w-[90vw] rounded-lg"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}