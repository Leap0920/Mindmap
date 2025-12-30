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
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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
                        background: var(--bg-card);
                        border-right: 1px solid var(--border-default);
                        position: fixed;
                        left: 0;
                        top: 0;
                        z-index: 100;
                        transition: transform 0.3s var(--ease-out);
                    }

                    .sidebar-container {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        padding: 1.5rem 0.75rem;
                    }

                    .brand {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0 0.75rem;
                        margin-bottom: 2rem;
                    }

                    .brand-logo {
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .brand-title {
                        font-size: 1.25rem;
                        font-weight: 700;
                        color: var(--text-primary);
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
                        gap: 0.75rem;
                        padding: 0.6rem 0.75rem;
                        color: var(--text-secondary);
                        text-decoration: none;
                        border-radius: var(--radius-md);
                        font-weight: 500;
                        font-size: 0.875rem;
                        transition: all var(--transition-fast);
                    }

                    .nav-item:hover {
                        color: var(--text-primary);
                        background: var(--accent-muted);
                    }

                    .nav-item.active {
                        color: var(--text-primary);
                        background: var(--bg-elevated);
                        font-weight: 600;
                    }

                    .sidebar-footer {
                        margin-top: auto;
                    }

                    .divider {
                        height: 1px;
                        background: var(--border-default);
                        margin: 1rem 0;
                    }

                    .user-profile {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.5rem 0.75rem;
                    }

                    .avatar {
                        width: 32px;
                        height: 32px;
                        background: var(--bg-elevated);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: var(--text-primary);
                        font-weight: 600;
                        font-size: 0.8rem;
                        flex-shrink: 0;
                    }

                    .user-details {
                        display: flex;
                        flex-direction: column;
                        min-width: 0;
                        flex: 1;
                    }

                    .user-name {
                        color: var(--text-primary);
                        font-size: 0.8rem;
                        font-weight: 600;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .user-email {
                        color: var(--text-dim);
                        font-size: 0.65rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .logout-btn-icon {
                        color: var(--text-dim);
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 0.375rem;
                        border-radius: var(--radius-sm);
                        transition: all var(--transition-fast);
                    }

                    .logout-btn-icon:hover {
                        color: var(--error);
                        background: var(--error-muted);
                    }

                    .mobile-toggle {
                        display: none;
                        position: fixed;
                        top: 1rem;
                        right: 1rem;
                        z-index: 1000;
                        background: var(--bg-card);
                        color: var(--text-primary);
                        width: 40px;
                        height: 40px;
                        border-radius: var(--radius-md);
                        border: 1px solid var(--border-default);
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                    }

                    .mobile-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.75);
                        backdrop-filter: blur(4px);
                        z-index: 90;
                    }

                    @media (max-width: 768px) {
                        .mobile-toggle { display: flex; }
                        .sidebar {
                            transform: translateX(-100%);
                            width: 260px;
                        }
                        .sidebar.open {
                            transform: translateX(0);
                            box-shadow: 20px 0 40px rgba(0,0,0,0.6);
                        }
                    }
                `}</style>
            </aside>
        </>
    );
}
