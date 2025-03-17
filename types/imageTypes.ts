import { StaticImageData } from 'next/image';

// Define the ImageSource type
export type ImageSource = {
    src: string | StaticImageData; // URL, path to the image, or StaticImageData from next/image
    alt: string; // Alt text for accessibility
  };