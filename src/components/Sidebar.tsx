"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    CheckSquare,
    Calendar,
    BookOpen,
    PenTool,
    Book,
    Clock,
    Image as ImageIcon,
    Key,
    Lock,
    LogOut,
    User,
    Settings
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { name: 'Habit Tracker', href: '/habit', icon: Calendar },
    { name: 'Todo List', href: '/todo', icon: CheckSquare },
    { name: 'School Schedule', href: '/schedule', icon: Clock },
    { name: 'Subject Notebook', href: '/notebook', icon: BookOpen },
    { name: 'Notepad', href: '/notepad', icon: PenTool },
    { name: 'Book Hub', href: '/books', icon: Book },
    { name: 'Routine', href: '/routine', icon: Clock },
    { name: 'Journal', href: '/journal', icon: ImageIcon },
    { name: 'Password Holder', href: '/passwords', icon: Key },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1>Mindmap</h1>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn("nav-item", isActive && "active")}
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="sidebar-footer">
                <Link href="/settings" className="nav-item">
                    <Settings size={20} />
                    <span>Settings</span>
                </Link>
                <button className="nav-item logout">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>

            <style jsx>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--card-bg);
          border-right: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .sidebar-header {
          padding: 2rem;
          border-bottom: 1px solid var(--card-border);
        }

        .sidebar-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: var(--foreground);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: var(--muted);
          transition: all 0.2s ease;
          font-size: 0.95rem;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--foreground);
        }

        .nav-item.active {
          background: var(--foreground);
          color: var(--background);
        }

        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid var(--card-border);
        }

        .logout:hover {
          color: #ff4444;
        }

        @media (max-width: 768px) {
          .sidebar {
            width: 70px;
          }
          .sidebar-header h1, .nav-item span {
            display: none;
          }
          .nav-item {
            justify-content: center;
            padding: 1rem;
          }
        }
      `}</style>
        </div>
    );
}
