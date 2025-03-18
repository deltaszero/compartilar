import Image from "next/image";
import { ExternalLink } from "lucide-react";
import tese_01 from "@assets/images/tese-01.png";
import tese_02 from "@assets/images/tese-02.png";
import tese_03 from "@assets/images/tese-03.png";
import { TeseImagesStackProps } from "./types";
// import { ImageSource } from "@/types/imageTypes";

export default function TeseImagesStack({ openImageModal }: TeseImagesStackProps) {
  return (
    <div className="w-full lg:w-1/2 mt-10 lg:mt-0">
      <div className="flex justify-center">
        <div className="relative h-[400px] w-[300px] sm:h-[500px] sm:w-[380px] md:h-[550px] md:w-[420px] lg:h-[600px] lg:w-[450px]">
          {/* Third page - bottom of the stack */}
          <div 
            onClick={() => openImageModal({ src: tese_03, alt: "Terceira página da tese sobre Plano Parental" })}
            className="cursor-pointer absolute top-4 sm:top-6 left-6 sm:left-8 rotate-[-8deg] z-10 group"
          >
            <Image 
              src={tese_03} 
              alt="Terceira página da tese sobre Plano Parental" 
              width={280} 
              height={400}
              className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:brightness-105 
                       sm:w-[350px] sm:h-[480px] md:w-[400px] md:h-[520px] lg:w-[430px] lg:h-[560px]"
            />
            <div className="absolute top-2 right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-mainStrongGreen" />
            </div>
          </div>
          
          {/* Second page - middle of the stack */}
          <div 
            onClick={() => openImageModal({ src: tese_02, alt: "Segunda página da tese sobre Plano Parental" })}
            className="cursor-pointer absolute top-2 sm:top-3 left-2 rotate-[-2deg] z-20 group"
          >
            <Image 
              src={tese_02} 
              alt="Segunda página da tese sobre Plano Parental" 
              width={280} 
              height={400}
              className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:brightness-105
                       sm:w-[350px] sm:h-[480px] md:w-[400px] md:h-[520px] lg:w-[430px] lg:h-[560px]"
            />
            <div className="absolute top-2 right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-mainStrongGreen" />
            </div>
          </div>
          
          {/* First page - top of the stack */}
          <div 
            onClick={() => openImageModal({ src: tese_01, alt: "Primeira página da tese sobre Plano Parental" })}
            className="cursor-pointer absolute top-0 left-0 rotate-[8deg] z-30 group"
          >
            <div className="hover:rotate-1 hover:translate-y-[-5px] transition-all duration-300">
              <Image 
                src={tese_01} 
                alt="Primeira página da tese sobre Plano Parental" 
                width={280} 
                height={400}
                className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:brightness-105
                        sm:w-[350px] sm:h-[480px] md:w-[400px] md:h-[520px] lg:w-[430px] lg:h-[560px]"
              />
              <div className="absolute top-2 right-2 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-mainStrongGreen" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}