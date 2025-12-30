"use client";

import { useState } from 'react';
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
  LogOut,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Search,
  Bell
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Habit Tracker', href: '/habit', icon: Calendar },
  { name: 'Todo List', href: '/todo', icon: CheckSquare },
  { name: 'School Schedule', href: '/schedule', icon: Clock },
  { name: 'Subject Notebook', href: '/notebook', icon: BookOpen },
  { name: 'Notepad', href: '/notepad', icon: PenTool },
  { name: 'Book Hub', href: '/books', icon: Book },
  { name: 'Routine', href: '/routine', icon: Clock },
  { name: 'Journal', href: '/journal', icon: ImageIcon },
  { name: 'Password Vault', href: '/passwords', icon: Key },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={cn("sidebar", isOpen && "mobile-open")}>
        <div className="sidebar-brand">
          <div className="logo-box">M</div>
          <span className="brand-name">Mindmap</span>
        </div>

        <div className="search-trigger">
          <Search size={16} />
          <span>Quick search...</span>
          <kbd>⌘K</kbd>
        </div>

        <nav className="nav-group">
          <span className="group-label">Workspace</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-link", isActive && "active")}
                onClick={() => setIsOpen(false)}
              >
                <div className="icon-wrapper">
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="link-text">{item.name}</span>
                {isActive && <div className="active-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link href="/settings" className="footer-link">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <button className="footer-link logout">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        <style jsx>{`
          .sidebar {
            width: var(--sidebar-width);
            height: 100vh;
            background: var(--bg-main);
            border-right: 1px solid var(--border-main);
            display: flex;
            flex-direction: column;
            position: fixed;
            left: 0;
            top: 0;
            z-index: 100;
            padding: 2rem 1rem;
            transition: var(--transition-base);
          }

          .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0 1rem;
            margin-bottom: 2.5rem;
          }

          .logo-box {
            width: 32px;
            height: 32px;
            background: var(--text-primary);
            color: var(--bg-deep);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            border-radius: 8px;
            font-size: 1.2rem;
          }

          .brand-name {
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: -0.03em;
          }

          .search-trigger {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 0.75rem;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-dim);
            border-radius: 10px;
            margin: 0 0.5rem 2rem;
            color: var(--text-muted);
            font-size: 0.85rem;
            cursor: pointer;
            transition: var(--transition-fast);
          }

          .search-trigger:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: var(--border-main);
          }

          .search-trigger kbd {
            margin-left: auto;
            font-family: inherit;
            font-size: 0.7rem;
            background: rgba(255, 255, 255, 0.1);
            padding: 0.1rem 0.3rem;
            border-radius: 4px;
            color: var(--text-dim);
          }

          .nav-group {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            overflow-y: auto;
          }

          .group-label {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-dim);
            margin: 0 1rem 0.75rem;
          }

          .nav-link {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
            position: relative;
            transition: var(--transition-fast);
          }

          .nav-link:hover {
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-primary);
          }

          .nav-link.active {
            background: var(--accent-soft);
            color: var(--text-primary);
            font-weight: 600;
          }

          .icon-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .active-dot {
            width: 4px;
            height: 4px;
            background: var(--text-primary);
            border-radius: 50%;
            margin-left: auto;
          }

          .sidebar-footer {
            margin-top: auto;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-dim);
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .footer-link {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            border-radius: 10px;
            color: var(--text-muted);
            font-size: 0.9rem;
            transition: var(--transition-fast);
          }

          .footer-link:hover {
            color: var(--text-primary);
            background: rgba(255, 255, 255, 0.03);
          }

          .logout:hover {
            color: #ff4444;
            background: rgba(255, 68, 68, 0.05);
          }

          .mobile-toggle {
            display: none;
            position: fixed;
            top: 1.25rem;
            right: 1.25rem;
            z-index: 1000;
            background: var(--bg-card);
            color: var(--text-primary);
            width: 40px;
            height: 40px;
            border-radius: 10px;
            border: 1px solid var(--border-main);
            align-items: center;
            justify-content: center;
          }

          @media (max-width: 1024px) {
            .sidebar {
              width: var(--sidebar-collapsed);
              padding: 2rem 0.5rem;
            }
            .brand-name, .link-text, .search-trigger span, .search-trigger kbd, .group-label, .active-dot, .footer-link span {
              display: none;
            }
            .sidebar-brand, .search-trigger, .nav-link, .footer-link {
              justify-content: center;
              padding: 0.75rem;
            }
            .nav-link {
              width: 48px;
              height: 48px;
              margin: 0 auto;
            }
          }

          @media (max-width: 768px) {
            .mobile-toggle {
              display: flex;
            }
            .sidebar {
              transform: translateX(-100%);
              width: 280px;
              padding: 2rem 1rem;
            }
            .sidebar.mobile-open {
              transform: translateX(0);
              box-shadow: 20px 0 50px rgba(0,0,0,0.8);
            }
            .brand-name, .link-text, .search-trigger span, .search-trigger kbd, .group-label, .footer-link span {
              display: block;
            }
            .sidebar-brand, .search-trigger, .nav-link, .footer-link {
              justify-content: flex-start;
              padding: 0.75rem 1rem;
            }
            .nav-link {
              width: auto;
              height: auto;
            }
          }
        `}</style>
      </aside>
    </>
  );
}
