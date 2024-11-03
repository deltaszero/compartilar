import Header from "@components/layout/Header";
import Footer from "@components/layout/Footer";

import MobileFooter from "@components/layout/MobileFooter";

import Image from 'next/image';
import hero_img from "@assets/images/cellphone_01.gif";

export default function Home() {
    return (
        <div>
            <Header />
            <section className="relative hero min-h-screen flex items-center">
                <div className="absolute inset-0">
                    <Image
                        src={hero_img}
                        alt="Hero Background"
                        style={{ objectFit: 'cover' }}
                        fill
                        priority
                    />
                    <div className="absolute inset-0 bg-black opacity-80"></div>
                </div>
                <div className="relative z-10 flex flex-col items-start px-4 py-24 md:px-12 lg:px-24 mx-auto max-w-7xl">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-playfair font-bold mb-6">
                        Facilite a coparentalidade organizando tudo em um só lugar
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white font-extralight mb-8">
                        Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.
                    </p>
                    <button className="btn bg-secondaryPurple border-none flex flex-col px-6 py-3 text-lg sm:text-xl md:text-2xl font-light text-black hover:text-white hover:bg-info hover:border-none rounded-md">
                        <div className="flex items-center space-x-2">
                            <span>&nbsp;</span>
                            <p className="text-2xl text-info-content font-light">
                                Comece agora
                            </p>
                            <span>&nbsp;</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Arrow-Right--Streamline-Ultimate" height={24} width={24} ><desc>{"Arrow Right Streamline Icon: https://streamlinehq.com"}</desc><path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" d="M0.75 12h22.5" strokeWidth={1.5} /><path stroke="#000000" strokeLinecap="round" strokeLinejoin="round" d="M12.75 22.5 23.25 12 12.75 1.5" strokeWidth={1.5} /></svg>
                            <span>&nbsp;</span>
                        </div>
                    </button>
                </div>
            </section >
            <div className="block md:hidden">
                <MobileFooter />
            </div>
            <div className="hidden md:block">
                <Footer />
            </div>
        </div >
    );
}