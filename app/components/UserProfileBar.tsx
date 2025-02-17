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


const UserNavbar = ({ pathname }: {  pathname: string }) => {
    return (
        <header className="navbar">
            <div className="navbar-start">
                <p className="text-2xl font-semibold">
                    {pathname}
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