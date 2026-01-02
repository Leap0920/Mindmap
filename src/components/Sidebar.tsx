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
    Home,
    PiggyBank,
    HandCoins,
    AlertTriangle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navGroups = [
    {
        label: "Primary",
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
            { name: 'Account', href: '/profile', icon: User },
        ]
    },
    {
        label: "Active Flow",
        items: [
            { name: 'Habits', href: '/habit', icon: Calendar },
            { name: 'Actions', href: '/todo', icon: CheckSquare },
            { name: 'Timeline', href: '/schedule', icon: Clock },
        ]
    },
    {
        label: "Systems",
        items: [
            { name: 'Notebook', href: '/notepad', icon: PenTool },
            { name: 'Library', href: '/books', icon: Book },
            { name: 'Routine', href: '/routine', icon: BookMarked },
            { name: 'Archive', href: '/journal', icon: BookOpen },
            { name: 'Vault', href: '/passwords', icon: Key },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();
    const [isMounted, setIsMounted] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (pathname === '/login' || pathname === '/signup') {
        return null;
    }

    if (!isMounted) return null;

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleConfirmLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    const handleCancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    const userInitial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U';

    return (
        <>
            {/* Mobile Top Navbar */}
            <div className="mobile-top-navbar">
                <button className="hamburger-btn" onClick={() => setIsOpen(true)}>
                    <Menu size={24} />
                </button>
                <div className="mobile-brand">Mindmap</div>
                <div className="mobile-spacer" />
            </div>

            {isOpen && <div className="glass-overlay" onClick={() => setIsOpen(false)} />}

            <aside className={cn("modern-sidebar", isOpen && "revealed")}>
                <div className="sidebar-inner">
                    <div className="sidebar-header">
                        <div className="brand-suite">
                            <div className="orb-logo">
                                <div className="orb-inner">
                                    <div className="orb-core" />
                                </div>
                                <BookMarked size={16} className="orb-icon" />
                            </div>
                            <div className="brand-text">
                                <h2 className="brand-name">Mindmap</h2>
                                <span className="brand-version">v2.0.4</span>
                            </div>
                        </div>
                        {/* Mobile Close Button */}
                        <button className="sidebar-close-btn" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="scroll-container">
                        {navGroups.map((group, gIdx) => (
                            <div key={gIdx} className="nav-set">
                                <h3 className="set-label">{group.label}</h3>
                                <div className="set-list">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn("sidebar-link", isActive && "link-active")}
                                                onClick={() => setIsOpen(false)}
                                            >
                                                <div className="link-bg" />
                                                <div className="link-content">
                                                    <Icon size={18} className="link-icon" />
                                                    <span className="link-label">{item.name}</span>
                                                </div>
                                                {isActive && <div className="link-accent" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="sidebar-footer">
                        <div className="user-hub">
                            <div className="user-pod">
                                <div className="pod-avatar">
                                    <div className="avatar-shimmer" />
                                    <span className="avatar-text">{userInitial}</span>
                                </div>
                                <div className="pod-meta">
                                    <span className="pod-user">{session?.user?.name || 'Explorer'}</span>
                                    <span className="pod-status">Verified Base</span>
                                </div>
                                <div className="pod-actions">
                                    <button className="pod-btn exit" onClick={handleLogoutClick} title="Terminate Session">
                                        <LogOut size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="logout-modal-overlay" onClick={handleCancelLogout}>
                    <div className="logout-modal" onClick={e => e.stopPropagation()}>
                        <div className="logout-icon">
                            <AlertTriangle size={28} />
                        </div>
                        <h3>Sign Out?</h3>
                        <p>Are you sure you want to end your session? Any unsaved changes will be lost.</p>
                        <div className="logout-modal-actions">
                            <button className="logout-btn-cancel" onClick={handleCancelLogout}>
                                Cancel
                            </button>
                            <button className="logout-btn-confirm" onClick={handleConfirmLogout}>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .modern-sidebar {
                    width: 280px;
                    height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    z-index: 500;
                    background: #000;
                    border-right: 1px solid rgba(255,255,255,0.05);
                    transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
                    transform: translateX(-100%);
                    box-shadow: 40px 0 100px rgba(0,0,0,0.8);
                }

                .modern-sidebar.revealed { transform: translateX(0); }

                .sidebar-inner {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    padding: 2.5rem 1.25rem;
                    background: radial-gradient(circle at 0% 0%, rgba(20,20,20,1) 0%, rgba(0,0,0,1) 100%);
                }

                .sidebar-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3.5rem; padding: 0 0.5rem; }

                .brand-suite {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .orb-logo {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .orb-inner {
                    position: absolute;
                    inset: 0;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    transform: rotate(45deg);
                    transition: all 0.5s ease;
                }

                .orb-logo:hover .orb-inner {
                    transform: rotate(135deg);
                    border-color: rgba(255,255,255,0.4);
                    box-shadow: 0 0 20px rgba(255,255,255,0.1);
                }

                .orb-core {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 4px;
                    height: 4px;
                    background: #fff;
                    border-radius: 50%;
                }

                .orb-icon { color: #fff; position: relative; z-index: 2; }

                .brand-text { display: flex; flex-direction: column; }
                .brand-name { font-size: 1.125rem; font-weight: 900; color: #fff; letter-spacing: -0.03em; margin: 0; text-transform: uppercase; }
                .brand-version { font-size: 0.6rem; color: #444; font-weight: 700; letter-spacing: 0.1em; }

                .scroll-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 3rem;
                    overflow-y: auto;
                    padding-right: 8px;
                    min-height: 0;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.1) transparent;
                }

                .scroll-container::-webkit-scrollbar { width: 4px; }
                .scroll-container::-webkit-scrollbar-track { background: transparent; }
                .scroll-container::-webkit-scrollbar-thumb { 
                    background: rgba(255,255,255,0.1); 
                    border-radius: 10px;
                }

                .set-label {
                    font-size: 0.65rem;
                    font-weight: 900;
                    color: #222;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    margin: 0 0 1rem 0.75rem;
                }

                .set-list { display: flex; flex-direction: column; gap: 0.5rem; }

                .sidebar-link {
                    position: relative;
                    display: block;
                    padding: 0.875rem 1rem;
                    text-decoration: none;
                    border-radius: 14px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow: hidden;
                }

                .link-bg {
                    position: absolute;
                    inset: 0;
                    background: #fff;
                    opacity: 0;
                    transform: scale(0.9) translateY(10px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .sidebar-link:hover .link-bg {
                    opacity: 1;
                    transform: scale(1) translateY(0);
                }

                .link-active .link-bg {
                    opacity: 1;
                    background: #fff;
                    transform: scale(1) translateY(0);
                }

                .link-content {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.3s;
                }

                .link-icon { color: #555; transition: all 0.3s; }
                .link-label { font-size: 1rem; font-weight: 600; color: #666; transition: all 0.3s; }

                .sidebar-link:hover .link-label { color: #aaa; }
                .sidebar-link:hover .link-icon { color: #aaa; transform: translateX(2px); }

                .link-active .link-label { color: #000; font-weight: 700; }
                .link-active .link-icon { color: #000; }

                .link-accent {
                    position: absolute;
                    right: 1.25rem;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 4px;
                    height: 4px;
                    background: #000;
                    border-radius: 50%;
                }

                .sidebar-footer { margin-top: 4rem; }

                .user-pod {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 1rem;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.4s;
                }

                .user-pod:hover {
                    background: rgba(255,255,255,0.04);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-4px);
                }

                .pod-avatar {
                    width: 38px;
                    height: 38px;
                    background: #fff;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                }

                .avatar-shimmer {
                    position: absolute;
                    top: 0; left: -100%; width: 100%; height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent);
                    animation: shimmer 3s infinite;
                }

                @keyframes shimmer { 100% { left: 100%; } }

                .avatar-text { color: #000; font-weight: 900; font-size: 1rem; }

                .pod-meta { flex: 1; display: flex; flex-direction: column; min-width: 0; }
                .pod-user { color: #fff; font-size: 1rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .pod-status { color: #333; font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

                .pod-actions { display: flex; gap: 4px; }
                .pod-btn {
                    background: none; border: none; color: #444; padding: 6px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
                }
                .pod-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
                .pod-btn.exit:hover { color: #ff4444; background: rgba(255,68,68,0.1); }

                .mobile-top-navbar {
                    display: flex;
                    align-items: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 64px;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(25px);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    z-index: 450;
                    padding: 0 0.75rem;
                    gap: 0.5rem;
                }

                .hamburger-btn {
                    color: #fff;
                    padding: 0.5rem;
                    margin-left: -0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                .mobile-brand {
                    font-family: 'Inter', sans-serif;
                    font-weight: 900;
                    font-size: 1.25rem;
                    color: #fff;
                    letter-spacing: -0.04em;
                    text-transform: capitalize;
                }

                .mobile-spacer { flex: 1; }

                .sidebar-close-btn {
                    display: block;
                    color: #444;
                    padding: 0.5rem;
                    margin-right: -0.5rem;
                    transition: all 0.2s;
                    cursor: pointer;
                }

                .sidebar-close-btn:hover { color: #fff; }

                .glass-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(10px);
                    z-index: 400;
                    animation: fadeIn 0.4s ease;
                }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .logout-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(12px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.2s ease;
                }

                .logout-modal {
                    background: #0a0a0a;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 20px;
                    padding: 32px;
                    max-width: 380px;
                    width: 90%;
                    text-align: center;
                    animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 30px 80px rgba(0,0,0,0.8);
                }

                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .logout-icon {
                    width: 56px;
                    height: 56px;
                    background: rgba(255, 68, 68, 0.1);
                    border: 1px solid rgba(255, 68, 68, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: #ff4444;
                }

                .logout-modal h3 {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #fff;
                    margin: 0 0 8px;
                }

                .logout-modal p {
                    font-size: 0.875rem;
                    color: #666;
                    margin: 0 0 28px;
                    line-height: 1.5;
                }

                .logout-modal-actions {
                    display: flex;
                    gap: 12px;
                }

                .logout-btn-cancel {
                    flex: 1;
                    padding: 12px 20px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: #888;
                    font-size: 0.875rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .logout-btn-cancel:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border-color: rgba(255,255,255,0.2);
                }

                .logout-btn-confirm {
                    flex: 1;
                    padding: 12px 20px;
                    background: #ff4444;
                    border: none;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 0.875rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .logout-btn-confirm:hover {
                    background: #ff5555;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(255, 68, 68, 0.3);
                }
            `}</style>
        </>
    );
}
