// app/(user)/[username]/home/components/FeatureCardMenu.tsx
import Link from 'next/link';
import Image from 'next/image';

// Import WebP image for Calendar
import calendarWebp from '@/app/assets/images/horizontal-menu_calendar.webp';
import rocketWebp from '@/app/assets/images/horizontal-menu_rocket.webp';
import tasklistWebp from '@/app/assets/images/horizontal-menu_tasklist.webp';
import profileWebp from '@/app/assets/images/horizontal-menu_profile.webp';
import heartWebp from '@/app/assets/images/horizontal-menu_heart.webp';
import geolocationWebp from '@/app/assets/images/horizontal-menu_geolocation.webp';
import financeWebp from '@/app/assets/images/horizontal-menu_finance.webp';

interface FeatureCardMenuProps {
    username: string;
}

export const FeatureCardMenu = ({ username }: FeatureCardMenuProps) => {
    // Feature data array with WebP images and background colors
    const features = [
        {
            name: 'Perfil',
            imageSrc: profileWebp,
            path: `/${username}/perfil`,
            color: '#ff6b6b',
        },
        {
            name: 'Crianças',
            imageSrc: heartWebp,
            path: `/${username}/criancas`,
            color: '#FFDC58',
        },
        {
            name: 'Calendário',
            imageSrc: calendarWebp,
            path: `/${username}/calendario`,
            color: '#88aaee',
        },
        {
            name: 'Finanças',
            imageSrc: financeWebp,
            path: `/${username}/financas`,
            color: '#ff6b6b', // mainStrongGreen
        },
        {
            name: 'Plano Parental',
            imageSrc: tasklistWebp,
            path: `/${username}/calendario`,
            color: '#a388ee',
        },
        {
            name: 'Check-in',
            imageSrc: geolocationWebp,
            path: `/${username}/calendario`,
            color: '#FD9745',
        },
        {
            name: 'Plano Duo',
            imageSrc: rocketWebp,
            path: `/${username}/home`,
            color: '#a388ee',
        },
    ];

    return (
        <section className="px-4 pt-2 pb-6">
            <div className="flex flex-col gap-1 mb-4">
                <h2 className="text-xl font-black font-raleway">
                    Acesso Rápido
                </h2>
                <p className="text-sm font-nunito">
                    Acesse as principais funcionalidades com um clique.
                </p>
            </div>
            <div className="overflow-x-auto pb-2 no-scrollbar pr-2">
                <div className="flex gap-3 w-max">
                    {features.map((feature) => (
                        <Link
                            href={feature.path}
                            key={feature.name}
                            className="flex-shrink-0"
                        >
                            <div 
                                className="w-36 h-36 rounded-base border-2 border-border shadow-shadow p-1 hover:brightness-110 hover:scale-[1.02] transition-all relative overflow-hidden flex flex-col justify-end"
                                style={{ 
                                    backgroundColor: feature.color, 
                                    // backgroundImage: feature.name === 'Calendário' 
                                    //     ? 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0.5))' 
                                    //     : 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.3))'
                                }}
                            >
                                    <div className="absolute inset-0 w-full h-full">
                                        <Image 
                                            src={feature.imageSrc}
                                            alt=""
                                            fill
                                            sizes="128px"
                                            className="object-contain opacity-70 mix-blend-normal"
                                        />
                                    </div>
                                
                                {/* Content stays on top of the background */}
                                <div className="relative z-10 h-full flex flex-col items-start justify-end">
                                    <span className="text-center font-black text-lg font-raleway text-bw drop-shadow-[2px_2px_0px_rgba(0,0,0,1.0)]">
                                        {feature.name}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeatureCardMenu;