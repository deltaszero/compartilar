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


const UserNavbar = ({ pathname }: { pathname: string }) => {
    return (
        <header className="navbar">
            <div className="navbar-start">
                <button className="flex items-center justify-center mr-2 w-10 h-10 transition-colors duration-150 rounded-full focus:shadow-outline text-primary hover:bg-primary-content hover:text-primary">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z">
                        </path>
                    </svg>
                </button>
                <p className="text-2xl font-semibold">
                    {pathname}
                </p>
            </div>
            <div className="navbar-end">                
                <button className="relative flex items-center justify-center mr-4 w-10 h-10 transition-colors duration-150 rounded-full text-primary focus:shadow-outline hover:bg-primary-content hover:text-primary">
                    <IconBell width={32} height={32} />
                    <div className="badge badge-xs badge-accent absolute text-accent-content -top-0 -left-3 sm:badge-sm">+99</div>
                </button>
            </div>
        </header>
    );
}


const UserNotFound = () => (
    <div className="flex flex-1 items-center justify-center">
        <p className="text-xl text-error">User not found</p>
    </div>
);

const UserProfileBar = ({ pathname }: { pathname: string }) => {
    const { userData } = useUser();
    if (!userData) return <UserNotFound />;
    return (
        <>
            <UserNavbar pathname={pathname} />
        </>
    );
}

export default UserProfileBar;