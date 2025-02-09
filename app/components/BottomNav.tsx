import { usePathname } from 'next/navigation';
import NavLink from '@components/ui/NavLink';
import { useUser } from '@context/userContext';
// importing assets
import IconUser from '@assets/icons/bottom_bar_user.svg';
import IconGeolocation from '@assets/icons/bottom_bar_geolocation.svg';
import IconHouse from '@assets/icons/bottom_bar_house.svg';
import IconMore from '@assets/icons/bottom_bar_more.svg';
import IconChat from '@assets/icons/bottom_bar_chat.svg';
import IconCalendar from '@assets/icons/bottom_bar_calendar.svg';

const BottomNav = () => {
    const { userData, loading } = useUser();
    const pathname = usePathname();

    if (loading) {
        return (
            <div className="btm-nav bg-neutral animate-pulse">
                <div className="flex flex-row items-center justify-center gap-2">
                    <div className="skeleton h-12 w-12"></div>
                    <div className="skeleton h-12 w-12"></div>
                    <div className="skeleton h-12 w-12"></div>
                    <div className="skeleton h-12 w-12"></div>
                    <div className="skeleton h-12 w-12"></div>
                    <div className="skeleton h-12 w-12"></div>
                </div>
            </div>
        );
    }

    if (!userData) return null;

    const navItems = [
        { 
            path: `/${userData.username}`, 
            label: 'Meu Lar',
            icon: <IconHouse width={32} height={32} /> },
        { 
            path: `/${userData.username}/plan/calendar`, 
            label: 'Plano', 
            icon: <IconCalendar width={32} height={32} /> 
        },
        { 
            path: `/${userData.username}/finances`, 
            label: 'Finanças', 
            icon: <IconGeolocation width={36} height={36} /> 
        },
        { 
            path: `/${userData.username}/chat`, 
            label: 'Chat', 
            icon: <IconChat width={32} height={32} /> 
        },
        { 
            path: `/${userData.username}/handshake`, 
            label: 'Decisões', 
            icon: <IconUser width={32} height={32} /> 
        },
        { 
            path: 'null',
            label: 'Mais', 
            icon: <IconMore width={32} height={32} /> 
        },
    ];

    return (
        <div className="btm-nav btm-nav-sm text-primary bg-base-100">
            {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                    <button className={`block ${isActive ? 'active' : ''}`}>
                        <NavLink
                            key={item.path}
                            href={item.path}
                        >
                            <div className="flex flex-col items-center justify-center" >
                                {item.icon}
                            </div>
                        </NavLink>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNav;