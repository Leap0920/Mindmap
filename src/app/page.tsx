"use client";

import Link from 'next/link';
import {
  Calendar,
  CheckSquare,
  PenTool,
  Clock,
  Book,
  ArrowRight
} from 'lucide-react';

export default function Home() {
  const stats = [
    { name: 'Habits Done Today', value: '2/5', icon: Calendar, color: 'white' },
    { name: 'Tasks Pending', value: '8', icon: CheckSquare, color: 'white' },
    { name: 'Next Class', value: '14:00', icon: Clock, color: 'white' },
    { name: 'Words Journaled', value: '450', icon: PenTool, color: 'white' },
  ];

  const shortcuts = [
    { title: 'Habit Tracker', href: '/habit', description: 'Track your daily wins', icon: Calendar },
    { title: 'Notepad', href: '/notepad', description: 'Quick thoughts & ideas', icon: PenTool },
    { title: 'Schedule', href: '/schedule', description: 'Class times & rooms', icon: Clock },
    { title: 'Password Vault', href: '/passwords', description: 'Secure credentials', icon: Book },
  ];

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>Welcome back, John</h1>
        <p>Tuesday, December 30, 2025</p>
      </header>

      <section className="stats-row">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass hover-lift">
            <div className="stat-icon"><stat.icon size={20} /></div>
            <div className="stat-info">
              <span className="stat-label">{stat.name}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="shortcuts-grid">
        {shortcuts.map((item, i) => (
          <Link href={item.href} key={i} className="shortcut-card glass hover-lift">
            <div className="shortcut-top">
              <div className="shortcut-icon"><item.icon size={24} /></div>
              <ArrowRight size={20} className="arrow" />
            </div>
            <div className="shortcut-bottom">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </Link>
        ))}
      </section>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .dash-header {
          margin-bottom: 3rem;
        }

        .dash-header h1 {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.05em;
        }

        .dash-header p {
          color: var(--muted);
          font-size: 1.1rem;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid var(--card-border);
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          background: var(--foreground);
          color: var(--background);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--muted);
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .shortcuts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .shortcut-card {
          padding: 2rem;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
        }

        .shortcut-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .shortcut-icon {
          color: var(--muted);
        }

        .arrow {
          color: var(--muted);
          transition: transform 0.2s;
        }

        .shortcut-card:hover .arrow {
          transform: translateX(5px);
          color: var(--foreground);
        }

        .shortcut-bottom h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .shortcut-bottom p {
          font-size: 0.9rem;
          color: var(--muted);
        }

        @media (max-width: 600px) {
          .dash-header h1 {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}
