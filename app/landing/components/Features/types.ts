export interface Feature {
  id: string;
  title: string;
  description: string;
  img?: any;
}

export interface FeatureCardProps {
  feature: Feature;
  onClick: (id: string) => void;
  isMobile: boolean;
}