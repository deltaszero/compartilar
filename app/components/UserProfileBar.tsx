import { useUser } from '@context/userContext';
import IconBell from '@assets/icons/icon_meu_lar_bell.svg';


export interface SignupFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    photoURL?: string;
}


const UserNavbar = ({ userData }: { userData: Partial<SignupFormData> }) => {
    const navItems = [
        { path: `/${userData.username}`, label: 'Perfil', },
        { path: `/${userData.username}/meu-lar`, label: 'Meu Lar', },
        { path: `/${userData.username}/geolocation`, label: 'Localização',},
        { path: `/${userData.username}/chat`, label: 'Chat',},
        { path: 'mais', label: 'Mais',},
    ];
    return (
        <header className="navbar text-base-content">
            <div className="navbar-start">
                <p className="text-2xl">
                    {navItems.find(item => item.path === window.location.pathname)?.label}
                </p>
            </div>
            <div className="navbar-end">
                <IconBell width={32} height={32} />
            </div>
        </header>
    );
}


const UserNotFound = () => (
    <div className="flex flex-1 items-center justify-center">
        <p className="text-xl text-error">User not found</p>
    </div>
);

const UserProfileBar = () => {
    const {userData } = useUser();
    if (!userData) return <UserNotFound />;
    return (
        <>
            <UserNavbar userData={userData} />
        </>
    );
}

export default UserProfileBar;