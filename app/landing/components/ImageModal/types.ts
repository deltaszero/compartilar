export interface ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedImage: { src: any; alt: string } | null;
}