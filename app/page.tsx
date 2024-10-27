// import { LoremIpsum } from "lorem-ipsum";

// const lorem_ipsum_1 = new LoremIpsum({
//     sentencesPerParagraph: { max: 8, min: 4 },
//     wordsPerSentence: { max: 5, min: 4 }
// });

import hero_img from "@static/img/cellphone_01.gif";

export default function Home() {
    return (
            <section className="hero min-h-screen" style={{backgroundImage: `url(${hero_img.src})`,}}>
                <div className="hero-overlay bg-opacity-80"></div>
                <div className="hero-content text-neutral-content text-center">
                <div className="max-w-6xl mx-12">
                    <h1 className="text-7xl text-white font-playfair text-left font-bold mb-12">
                        Facilite a coparentalidade organizando tudo em um só lugar
                    </h1>
                    <p className="my-12 text-left text-3xl font-extralight">
                        {/* {lorem_ipsum_1.generateParagraphs(1)} */}
                        Uma plataforma feita para você manter todas as informações importantes sobre seus filhos de forma segura e acessível, facilitando o planejamento e a comunicação, trazendo clareza e harmonia para a sua família.
                    </p>
                    <button className="btn btn-info btn-xs sm:btn-sm md:btn-md lg:btn-lg">
                        <div className="flex items-center justify-center space-x-2">
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
                </div>
            </section>
    );
}