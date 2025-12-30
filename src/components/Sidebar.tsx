"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
    CheckSquare,
    Calendar,
    BookOpen,
    PenTool,
    Book,
    Clock,
    BookMarked,
    Key,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    User,
    Settings,
    Home,
    PiggyBank,
    HandCoins
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Habit Tracker', href: '/habit', icon: Calendar },
    { name: 'Todo List', href: '/todo', icon: CheckSquare },
    { name: 'School Schedule', href: '/schedule', icon: Clock },
    { name: 'Notepad', href: '/notepad', icon: PenTool },
    { name: 'Book Hub', href: '/books', icon: Book },
    { name: 'Routine', href: '/routine', icon: BookMarked },
    { name: 'Journal', href: '/journal', icon: BookOpen },
    { name: 'Password Vault', href: '/passwords', icon: Key },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (pathname === '/login' || pathname === '/signup') {
        return null;
    }

    if (!isMounted) return null;

    const handleSignOut = () => {
        signOut({ callbackUrl: '/login' });
    };

    const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U';

    return (
        <>
            <button className={cn("mobile-toggle", isOpen && "active")} onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {isOpen && <div className="mobile-overlay" onClick={() => setIsOpen(false)} />}

            <aside className={cn("sidebar", isOpen && "open")}>
                <div className="sidebar-container">
                    <div className="brand">
                        <div className="brand-logo">
                            <Book size={32} strokeWidth={2.5} />
                        </div>
                        <span className="brand-title">Mindmap</span>
                    </div>

                    <nav className="nav-links">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn("nav-item", isActive && "active")}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="sidebar-footer">
                        <div className="divider" />
                        <div className="user-profile">
                            <div className="avatar">
                                {userInitial}
                            </div>
                            <div className="user-details">
                                <span className="user-name">{session?.user?.name || 'User'}</span>
                                <span className="user-email">{session?.user?.email || 'user@example.com'}</span>
                            </div>
                            <button className="logout-btn-icon" onClick={handleSignOut} title="Sign Out">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .sidebar {
                        width: var(--sidebar-width);
                        height: 100vh;
                        background: #0a0a0a;
                        border-right: 1px solid #141414;
                        position: fixed;
                        left: 0;
                        top: 0;
                        z-index: 100;
                        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .sidebar-container {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        padding: 2rem 1rem;
                    }

                    .brand {
                        display: flex;
                        align-items: center;
                        gap: 0.85rem;
                        padding: 0 0.5rem;
                        margin-bottom: 2.5rem;
                    }

                    .brand-logo {
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .brand-title {
                        font-size: 1.5rem;
                        font-weight: 800;
                        color: #fff;
                        letter-spacing: -0.02em;
                    }

                    .nav-links {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                    }

                    .nav-item {
                        display: flex;
                        align-items: center;
                        gap: 1.25rem;
                        padding: 0.8rem 1rem;
                        color: #888;
                        text-decoration: none;
                        border-radius: 10px;
                        font-weight: 500;
                        font-size: 1rem;
                        transition: all 0.2s ease;
                    }

                    .nav-item:hover {
                        color: #fff;
                        background: rgba(255, 255, 255, 0.03);
                    }

                    .nav-item.active {
                        color: #fff;
                        background: #1a1a1a;
                        font-weight: 700;
                    }

                    .sidebar-footer {
                        margin-top: auto;
                    }

                    .divider {
                        height: 1px;
                        background: #141414;
                        margin-bottom: 1.5rem;
                        width: 100%;
                    }

                    .user-profile {
                        display: flex;
                        align-items: center;
                        gap: 0.85rem;
                        padding: 0.5rem;
                        position: relative;
                    }

                    .avatar {
                        width: 36px;
                        height: 36px;
                        background: #1a1a1a;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                        font-weight: 700;
                        font-size: 0.85rem;
                        flex-shrink: 0;
                    }

                    .user-details {
                        display: flex;
                        flex-direction: column;
                        min-width: 0;
                        flex: 1;
                    }

                    .user-name {
                        color: #fff;
                        font-size: 0.9rem;
                        font-weight: 600;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .user-email {
                        color: #666;
                        font-size: 0.7rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .logout-btn-icon {
                        color: #444;
                        background: none;
                        border: none;
                        cursor: pointer;
                        transition: color 0.2s;
                    }

                    .logout-btn-icon:hover {
                        color: #f87171;
                    }

                    .mobile-toggle {
                        display: none;
                        position: fixed;
                        top: 1.25rem;
                        right: 1.25rem;
                        z-index: 1000;
                        background: #111;
                        color: #fff;
                        width: 44px;
                        height: 44px;
                        border-radius: 12px;
                        border: 1px solid #222;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                    }

                    .mobile-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(4px);
                        z-index: 90;
                    }

                    @media (max-width: 768px) {
                        .mobile-toggle { display: flex; }
                        .sidebar {
                            transform: translateX(-100%);
                            width: 280px;
                        }
                        .sidebar.open {
                            transform: translateX(0);
                            box-shadow: 20px 0 50px rgba(0,0,0,0.8);
                        }
                    }
                `}</style>
            </aside>
        </>
    );
}
