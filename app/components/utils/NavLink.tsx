'use client'

import type { Route } from 'next'
import Link from 'next/link'
// import { usePathname } from 'next/navigation'

interface NavLinkProps<T extends string> {
    href: Route<T> | URL
    children: React.ReactNode
}

function NavLink<T extends string>({href, children, ...props}: NavLinkProps<T>) {
    // const pathname = usePathname()
    // const isActive = pathname === href

    return (
        <Link 
            {...props}
            href={href}
            // className={isActive ? 'font-black' : ''}
        >
            {children}
        </Link>
    )
}

export default NavLink;