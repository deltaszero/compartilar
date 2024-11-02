'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import NavLink from '@components/ui/NavLink';
import Image from 'next/image';
import { auth } from '@lib/firebaseConfig';
import { useUser } from '@context/userContext';


const Header = () => {
    const { user, userData, loading } = useUser();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (loading) {
        // Optionally, return a loading indicator or null
        return null;
    }

    return (
        <header className="navbar bg-neutral text-neutral-content lg:fixed lg:top-0 lg:left-0 lg:right-0 z-50">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden"> {/* lg:hidden */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
                        <li><a>Item 1</a></li>
                    </ul>
                </div>
                <div className="hidden lg:flex"> {/* hidden lg:flex */}
                    <div className="flex items-center justify-center space-x-2">
                        {/* tree icon */}
                        <svg
                            width={44}
                            height={44}
                            viewBox="0 0 99.998743 99.998737"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M48.565 96.952c-2.072-3.174-2.747-4.833-2.801-6.884-.022-.841-.197-1.778-.39-2.08l-.35-.552-1.056 1.125c-1.71 1.82-3.466 2.69-7.382 3.663-2.029.503-4.757 1.404-6.063 2.002-1.307.598-2.453 1.087-2.548 1.087-.225 0-1.904-2.755-1.906-3.128-.002-.491 6.336-2.953 9.471-3.679 3.84-.889 7.58-3.389 7.574-5.062 0-.083-1.524-.157-3.387-.164l-3.387-.012-2.956-1.009-2.956-1.008-1.853.307c-2.675.444-7.182 2.214-9.618 3.777l-2.106 1.352-.645-.823a17.008 17.008 0 01-1.073-1.558l-.43-.736 1.277-.908c.702-.5 2.767-1.617 4.59-2.482 1.821-.866 3.312-1.636 3.312-1.713 0-.076-1.13-.476-2.513-.889l-2.514-.75-5.595.01-5.596.01.132-1.804.132-1.805 6.556.02 6.557.021 4.808 1.903c2.645 1.047 6.382 2.46 8.305 3.14l3.497 1.236 2.256.01 2.256.008 1.115-1.325c2.824-3.356 2.758-11.76-.137-17.423-2.647-5.178-11.976-11.635-20.57-14.237l-2.404-.728-5.027-.225-5.027-.225-4.304.615-4.304.615-.139-.47c-.076-.26-.245-1.095-.376-1.856l-.238-1.385 3.15-.54c1.734-.298 5.535-.56 8.448-.583l5.297-.042-3.111-3.4C9.05 32.374 5.526 28.23 5.532 27.78c.004-.24.617-.863 1.362-1.384l1.356-.947 2.838 3.351c1.56 1.844 5.127 5.707 7.925 8.585l5.088 5.234L30 45.53c7.035 3.471 11.61 6.612 13.955 9.58l1.722 2.177.218-.766c.12-.422.454-3.258.741-6.304l.522-5.537-.223-6.483-.223-6.484-.704-2.229-.703-2.228-2.298-2.163c-2.806-2.642-4.53-3.834-12.51-8.643-3.428-2.066-6.902-4.21-7.72-4.766l-1.486-1.01.967-1.384c1.225-1.752 1.019-1.78 5.015.706 1.861 1.158 4.488 2.731 5.84 3.496l2.455 1.391 2.231-4.48c1.227-2.463 3.242-5.724 4.477-7.246L44.523.39l1.263 1.21c1.612 1.544 1.603 1.618-.505 4.013-1.65 1.875-6.107 10.042-6.095 11.17.003.278.654.925 1.446 1.438.792.513 2.643 1.934 4.114 3.158l2.674 2.225 1.325 2.743 1.325 2.744.519 3.689.519 3.689-.24 6.89-.239 6.889 1.538-2.055c4.17-5.57 10.493-10.88 15.977-13.413l3.267-1.51.302-2.674c.688-6.079 3.586-12.786 7.226-16.723l2.386-2.58 1.237 1.385 1.238 1.385-1.985 2.207c-3.016 3.355-6.354 11.47-6.354 15.45v.958l6.228.253c5.838.237 16.766 1.762 17.476 2.439.326.31-.401 3.556-.797 3.556-.12 0-2.52-.433-5.334-.962l-5.116-.962-7.868-.021-7.868-.022-2.84 1.465c-8.472 4.368-15.776 12.455-18.678 20.68l-1.132 3.207-.196 3.497-.197 3.497.527 1.95.526 1.952 1.598 1.596 1.597 1.596 2.316.496c4.166.892 8.456.393 18.193-2.118l5.12-1.32h3.76c2.068 0 5.022.22 6.566.489l2.807.489-.292 1.587c-.39 2.127-.595 2.266-2.628 1.795-.961-.223-3.376-.41-5.365-.416l-3.618-.01.721 1.42c.397.782 1.413 2.395 2.259 3.585l1.538 2.163-1.483 1.242-1.482 1.242-.962-1.2c-.53-.66-1.61-2.345-2.404-3.744-.793-1.4-1.652-2.855-1.908-3.235l-.465-.691-4.508 1.137c-2.48.625-6.273 1.351-8.43 1.613l-3.92.477-2.863-.499c-1.574-.274-3.62-.885-4.547-1.357-2.072-1.058-2.103-.68-.178 2.182 1.86 2.765 3.503 4.174 7.229 6.204l2.897 1.578 2.598.302c3.832.445 7.794 1.204 8.203 1.57.197.177.22 1.057.051 1.956l-.306 1.635-1.582-.267c-.87-.147-3.428-.477-5.686-.734l-4.104-.468-3.647-1.971c-2.005-1.085-4.665-2.888-5.91-4.008l-2.265-2.036.307 3.055.307 3.055 1.991 3.008 1.992 3.008-.588.396c-.324.217-1.086.666-1.695.997l-1.107.601zm11.866-37.52c-2.307-1.814-3.194-5.418-2.062-8.376.552-1.442.882-1.482 2.398-.289 2.29 1.801 3.193 5.73 1.947 8.465-.614 1.348-.803 1.365-2.283.2zm-34.447-.726c-2.26-2.423-2.76-5.365-1.4-8.23l.7-1.478.799.427c.439.235 1.236 1.043 1.772 1.796l.974 1.368.2 2.068.198 2.068-.755 1.591c-.906 1.909-1.05 1.931-2.488.39zM11.707 56.52l-1.721-1.639-.46-1.748-.46-1.749.323-1.527.322-1.527.69-.133c1.839-.354 4.745 3.674 4.733 6.56-.016 3.772-.86 4.207-3.427 1.763zm59.657-6.073c-2.24-2.078-2.986-5.073-1.98-7.958l.48-1.377h.656c1.048 0 3.138 2.547 3.65 4.447l.47 1.746-.297 1.384c-.67 3.124-1.18 3.425-2.979 1.758zm7.569-2.433l-.496-1.84.527-1.766.527-1.766 1.718-1.64c2.16-2.059 2.413-2.047 3.004.147l.48 1.785-.292 1.384c-.421 1.992-1.688 3.89-3.186 4.771-1.735 1.022-1.715 1.031-2.282-1.075zm17.282.357c-.726-.316-1.945-1.288-2.71-2.16l-1.391-1.583-.288-1.536c-.159-.845-.182-1.815-.05-2.156l.237-.619 1.475.333c3.238.73 5.576 3.574 5.576 6.783v1.547l-.765-.017c-.42-.01-1.358-.276-2.084-.592zM30.03 42.013l-.626-.396 1.171-1.77c.644-.974 1.811-2.105 2.594-2.515l1.422-.745 2.08-.007c1.144-.004 2.3.214 2.57.484l.492.492-.846 1.449c-.465.797-1.504 1.892-2.308 2.433l-1.461.985-2.23-.006c-1.227-.004-2.513-.185-2.858-.403zM5.96 39.692c-2.503-1.709-3.622-4.96-2.783-8.087C4 28.53 8.583 33.39 8.583 37.34c0 3.517-.396 3.872-2.622 2.353zm14.698-5.633c-.59-2.944 1.386-6.685 4.13-7.821l1.36-.564.416.616c.23.339.337 1.565.24 2.725l-.177 2.109-.866 1.17c-.97 1.308-3.471 3.136-4.293 3.136-.295 0-.66-.617-.81-1.37zm36.149-.645c-2.194-1.082-4.533-4.76-3.79-5.96.389-.63 2.947-.323 4.805.576l1.87.905.856 1.39c.472.764.992 1.93 1.157 2.591l.3 1.202-1.905-.01c-1.048-.005-2.53-.317-3.293-.694zm27.96-3.651c-2.448-1.492-4.055-6.273-2.783-8.281l.39-.616 1.378.57c.758.315 1.876 1.224 2.484 2.021l1.105 1.45.233 1.738c.495 3.689-.344 4.62-2.807 3.118zm-52.252-.524c-.661-.241-1.202-.68-1.202-.975 0-.92 2.604-3.25 4.231-3.788l1.553-.512 1.758.235c.967.13 2.038.516 2.38.86l.623.622-1.209 1.437c-2.006 2.385-5.16 3.207-8.134 2.121zM10.66 23.994c-2.037-.744-1.118-2.782 1.963-4.354l1.797-.917 2.141.206c1.178.113 2.428.493 2.78.844l.638.638-.965 1.227c-1.836 2.334-5.548 3.381-8.354 2.356zm52.178.034c-1.714-.363-3.769-1.772-3.769-2.586 0-.308.546-.969 1.213-1.467l1.214-.905h4.598l1.623 1.003c.893.552 1.624 1.278 1.624 1.614 0 1.463-3.943 2.882-6.503 2.34zm-16.991-4.43c-1.314-.634-1.245-1.041.463-2.75l1.447-1.447 1.924-.518 1.923-.518 1.638.491c.9.27 1.768.702 1.928.96.42.68-1.133 2.567-2.883 3.506l-1.51.81-1.973-.03c-1.086-.017-2.416-.244-2.957-.504zm25.513-6.89c-1.534-.487-3.189-1.98-4.069-3.672l-.655-1.26.588-.372c.771-.49 3.975-.49 5.258 0 1.833.699 4.859 4.436 4.158 5.136-.403.404-4.159.523-5.28.168zM30.093 9.373c-1.363-.695-3.151-2.53-3.151-3.235 0-.616 2.702-1.443 4.62-1.414l1.924.03 1.427.888c.785.49 1.69 1.319 2.011 1.844l.585.954-.672.672-.672.672-2.317.161-2.317.162-1.438-.734zm18.813-.653c-2.345-1.16-2.337-1.82.039-3.214l1.896-1.11h3.739l1.698.954c1.929 1.084 2 1.259.917 2.24-2.293 2.075-5.497 2.512-8.289 1.13z"
                                fill="currentColor"
                                strokeWidth={0.437106}
                                stroke="none"
                            />
                        </svg>
                        <a href="/" className="btn btn-ghost text-xl rounded-none p-0">
                            <p className="text-2xl font-cinzel">
                                CompartiLar
                            </p>
                        </a>
                    </div>
                </div>
            </div>
            <div className="navbar-center hidden lg:flex"> {/* hidden lg:flex */}
                <ul className="menu menu-horizontal px-1">
                    <li><NavLink href="/">Organize</NavLink></li>
                    <li><NavLink href="/">Descomplique</NavLink></li>
                    <li><NavLink href="/">Proteja</NavLink></li>
                    <li><NavLink href="/">Despreocupe-se</NavLink></li>
                </ul>
            </div>
            <div className="navbar-end">
                {user && userData ? (
                    <div className="flex items-center space-x-2">
                        <NavLink href={`/${userData.username}`}>
                            <span className="font-medium text-lg">
                                {userData.username}
                            </span>
                        </NavLink>
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className=" btn btn-ghost rounded-none flex space-x-4">
                                {/* <svg
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                    height="1em"
                                    width="1em"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M1.553 6.776a.5.5 0 01.67-.223L8 9.44l5.776-2.888a.5.5 0 11.448.894l-6 3a.5.5 0 01-.448 0l-6-3a.5.5 0 01-.223-.67z"
                                    />
                                </svg> */}
                                <div className="rounded-full avatar">
                                    {userData.photoURL ? (
                                        <Image src={userData.photoURL} alt="Avatar" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 14 14" id="Front-Camera--Streamline-Core" height={32} width={32} ><desc>{"Front Camera Streamline Icon: https://streamlinehq.com"}</desc><g id="front-camera"><g id="Group 2605"><path id="Ellipse 1111" stroke="#currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.95947 6.5c-0.13807 0 -0.25 -0.11193 -0.25 -0.25s0.11193 -0.25 0.25 -0.25" strokeWidth={1} /><path id="Ellipse 1112" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.95947 6.5c0.13807 0 0.25 -0.11193 0.25 -0.25s-0.11193 -0.25 -0.25 -0.25" strokeWidth={1} /></g><g id="Group 2628"><path id="Ellipse 1111_2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M9.0426 6.5c-0.13807 0 -0.25 -0.11193 -0.25 -0.25s0.11193 -0.25 0.25 -0.25" strokeWidth={1} /><path id="Ellipse 1112_2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M9.0426 6.5c0.13807 0 0.25 -0.11193 0.25 -0.25S9.18067 6 9.0426 6" strokeWidth={1} /></g><path id="Vector 500" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.5553 8.85718c0.47634 0.48447 1.31765 0.92857 2.44318 0.92857s1.96684 -0.4441 2.44318 -0.92857" strokeWidth={1} /><path id="Vector" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5c0 -0.26522 -0.1054 -0.51957 -0.2929 -0.70711C13.0196 3.60536 12.7652 3.5 12.5 3.5h-2L9 1.5H5l-1.5 2h-2c-0.26522 0 -0.51957 0.10536 -0.707107 0.29289C0.605357 3.98043 0.5 4.23478 0.5 4.5v7c0 0.2652 0.105357 0.5196 0.292893 0.7071 0.187537 0.1875 0.441887 0.2929 0.707107 0.2929h11c0.2652 0 0.5196 -0.1054 0.7071 -0.2929s0.2929 -0.4419 0.2929 -0.7071v-7Z" strokeWidth={1} /></g></svg>
                                    )}
                                </div>
                            </label>
                            <ul
                                tabIndex={0}
                                className="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
                            >
                                <li>
                                    <NavLink href={`/${userData.username}/settings`}>Configurações</NavLink>
                                </li>
                                <li>
                                    <button onClick={handleSignOut}>Sair</button>
                                </li>
                            </ul>
                        </div>
                        {/* <NavLink href={`/${userData.username}`}>
                            {userData.username}
                        </NavLink>
                        <button
                            onClick={handleSignOut}
                            className="btn btn-outline rounded-none flex items-center justify-center space-x-2 bg-secondaryPurple text-black hover:bg-info hover:border-none"
                        >
                            // logout icon
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" id="Login-1--Streamline-Core" height={16} width={16}><desc>Login 1 Streamline Icon: https://streamlinehq.com</desc><g id="login-1--arrow-enter-frame-left-login-point-rectangle"><path id="Vector" stroke="currentColor" d="M9.5 10.5v2c0 0.2652 -0.10536 0.5196 -0.29289 0.7071 -0.18754 0.1875 -0.44189 0.2929 -0.70711 0.2929h-7c-0.26522 0 -0.51957 -0.1054 -0.707107 -0.2929C0.605357 13.0196 0.5 12.7652 0.5 12.5v-11c0 -0.26522 0.105357 -0.51957 0.292893 -0.707107C0.98043 0.605357 1.23478 0.5 1.5 0.5h7c0.26522 0 0.51957 0.105357 0.70711 0.292893C9.39464 0.98043 9.5 1.23478 9.5 1.5v2" ></path><path id="Vector_2" stroke="currentColor" d="M13.5 7h-8" ></path><path id="Vector_3" stroke="currentColor" d="m7.5 5 -2 2 2 2" ></path></g></svg>
                            <p className="font-normal">
                                Sair
                            </p>
                        </button> */}
                    </div>
                ) : (
                    <a
                        href="/login"
                        className="btn btn-outline rounded-none flex items-center justify-center space-x-2 bg-secondaryPurple text-black hover:bg-info hover:border-none"
                    >
                        <p className="font-normal">
                            Entrar
                        </p>
                        {/* login icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" id="Logout-1--Streamline-Core" height={16} width={16}><desc>Logout 1 Streamline Icon: https://streamlinehq.com</desc><g id="logout-1--arrow-exit-frame-leave-logout-rectangle-right"><path id="Vector" stroke="currentColor" d="M9.5 10.5v2c0 0.2652 -0.10536 0.5196 -0.29289 0.7071 -0.18754 0.1875 -0.44189 0.2929 -0.70711 0.2929h-7c-0.26522 0 -0.51957 -0.1054 -0.707107 -0.2929C0.605357 13.0196 0.5 12.7652 0.5 12.5v-11c0 -0.26522 0.105357 -0.51957 0.292893 -0.707107C0.98043 0.605357 1.23478 0.5 1.5 0.5h7c0.26522 0 0.51957 0.105357 0.70711 0.292893C9.39464 0.98043 9.5 1.23478 9.5 1.5v2" ></path><path id="Vector_2" stroke="currentColor" d="M6.5 7h7" ></path><path id="Vector_3" stroke="currentColor" d="m11.5 5 2 2 -2 2" ></path></g></svg>
                    </a>
                )}
            </div>
        </header>
    );
};

export default Header;