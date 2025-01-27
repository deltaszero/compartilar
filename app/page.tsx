// app/page.tsx

// importing modules
import Image from 'next/image';
// importing components
import Header from "@components/layout/Header";
import Footer from "@components/layout/Footer";
import MobileFooter from "@components/layout/MobileFooter";
// importing assets
import hero_img from "@assets/images/cellphone_01.gif";

export default function Home() {
    return (
        <div>
            {/* header */}
            <Header />
            {/* hero */}
            <section className="relative hero min-h-screen flex items-center">
                <div className="absolute inset-0">
                    <Image
                        src={hero_img}
                        alt="Hero Background"
                        style={{ objectFit: 'cover' }}
                        fill
                        priority
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black opacity-80"></div>
                </div>
                <div className="relative z-10 flex flex-col items-start px-4 py-24 md:px-12 lg:px-24 mx-auto max-w-7xl">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-playfair font-bold mb-6">
                        Facilite a coparentalidade organizando tudo em um só lugar
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white mb-8 font-raleway font-light">
                        Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.
                    </p>
                    <button 
                        className="
                            btn border-none flex flex-col px-6 py-3 text-lg rounded-md font-raleway
                            bg-primaryPurple text-base-100 hover:bg-accent-base-100 hover:text-primaryPurple
                            sm:text-xl 
                            md:text-2xl 
                            hover:border-none 
                        ">
                        <div className="flex items-center space-x-2 ">
                            <span>&nbsp;</span>
                            <p>
                                Comece agora
                            </p>
                            <span>&nbsp;</span>
                            {/* small right arrow icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Arrow-Right--Streamline-Ultimate" width="24" height="24">
                                <desc>{"Arrow Right Streamline Icon: https://streamlinehq.com"}</desc>
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M0.75 12h22.5" strokeWidth="1" />
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M12.75 22.5 23.25 12 12.75 1.5" strokeWidth="1" />
                            </svg>
                            <span>&nbsp;</span>
                        </div>
                    </button>
                </div>
            </section >
            {/* footer */}
            <div className="block md:hidden">
                <MobileFooter />
            </div>
            <div className="hidden md:block">
                <Footer />
            </div>
        </div >
    );
}