import { ImageSource } from "@/types/imageTypes";

export interface ConceptSectionProps {
  onGetStartedClick: () => void;
  openImageModal: (image: ImageSource) => void;
}

export interface TeseImagesStackProps {
  openImageModal: (image: ImageSource) => void;
}

export interface ConceptContentProps {
  onGetStartedClick: () => void;
}