import React from 'react';
import NavLink from '../ui/NavLink';

const Header = () => (
    <header className="bg-gray-500 text-white">
        <nav className="container">
            <ul className="flex gap-4 p-4">
                <li>
                    <NavLink href="/">Home</NavLink>
                </li>
            </ul>
        </nav>
    </header>
);

export default Header;