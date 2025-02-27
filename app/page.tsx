// app/page.tsx
import Image from 'next/image';
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import hero_img from "@assets/images/compartilar-anthropic-hero.png";

export default function Home() {
    return (
        <section className="flex flex-col min-h-screen">
            {/* HEADER */}
            <Header />
            {/* HERO */}
            <section className="hero bg-base-200 min-h-screen">
                <div className="hero-content flex-col lg:flex-row-reverse">
                    <Image
                        src={hero_img}
                        alt="Hero image"
                        width={540}
                    />
                    {/* - */}
                    <div className="container relative z-10 mx-auto px-6 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-bold mb-4 sm:mb-6">
                                Facilite a coparentalidade organizando tudo em um só lugar
                            </h1>

                            <p className="sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 font-raleway font-light">
                                Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.
                            </p>

                            <div className='flex flex-row gap-4'>
                                <button className="btn btn-outline inline-flex items-center px-6  text-base sm:text-lg md:text-xl  font-nunito font-bold rounded-md">
                                    <span>Saiba mais</span>
                                </button>
                                <button className="btn bg-neutral text-neutral-content border-none group inline-flex items-center px-6 sm:text-lg md:text-xl  font-nunito font-bold rounded-md hover:text-neutral">
                                    <span>Comece agora</span>
                                    <svg
                                        className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                    >
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                            d="M12.75 22.5 23.25 12 12.75 1.5"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* ORGANIZE */}
            <section className="flex items-center" id="organize">
                <h2>Organize</h2>
            </section>
            <div className="divider" />
            {/* DESCOMPLIQUE */}
            <section className="flex items-center" id="descomplique">
                <h2>Descomplique</h2>
            </section>
            <div className="divider" />
            {/* PROTEJA */}
            <section className="flex items-center" id="proteja">
                <h2>Proteja</h2>
            </section>
            <div className="divider" />
            {/* DESPREOCUPE-SE */}
            <section className="flex items-center" id="despreocupe-se">
                <h2>Despreocupe-se</h2>
            </section>
            {/* FOOTER */}
            <footer>
                <Footer />
            </footer>
        </section>
    );
}