"use client";

import Link from 'next/link';
import {
  Calendar,
  CheckSquare,
  PenTool,
  Clock,
  Book,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Zap,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const stats = [
    { name: 'Weekly Focus', value: 'Productivity', icon: Activity, detail: '12% increase' },
    { name: 'Habit Streak', value: '8 Days', icon: Zap, detail: 'Personal Best' },
    { name: 'Task Progress', value: '64%', icon: TrendingUp, detail: '24 done this week' },
  ];

  const categories = [
    { title: 'Rituals', items: ['Habit Tracker', 'Daily Routine', 'Journal'], icon: Calendar, href: '/habit' },
    { title: 'Academic', items: ['School Schedule', 'Subject Notebook', 'Notepad'], icon: Book, href: '/schedule' },
    { title: 'Security', items: ['Password Vault'], icon: Clock, href: '/passwords' },
  ];

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="welcome-text">
          <div className="date-pill">Tuesday, December 30</div>
          <h1 className="text-gradient">Good morning, John.</h1>
          <p>What are we building today?</p>
        </div>
        <div className="action-buttons">
          <button className="secondary-btn">View Stats</button>
          <button className="primary-btn">Start Session</button>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass-panel hover-glow">
            <div className="stat-icon-box"><stat.icon size={20} /></div>
            <div className="stat-content">
              <span className="stat-label">{stat.name}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-detail">{stat.detail}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="main-grid">
        <section className="category-section">
          <h2>Your Ecosystem</h2>
          <div className="category-grid">
            {categories.map((cat, i) => (
              <Link href={cat.href} key={i} className="category-card premium-card hover-glow">
                <div className="card-top">
                  <cat.icon size={24} className="text-muted" />
                  <ArrowUpRight size={18} className="arrow" />
                </div>
                <h3>{cat.title}</h3>
                <div className="item-list">
                  {cat.items.map(item => <span key={item}>{item}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="recent-activity premium-card glass-panel">
          <div className="section-header">
            <h3>Recent Activity</h3>
            <Link href="/history" className="view-all">View all <ChevronRight size={14} /></Link>
          </div>
          <div className="activity-list">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="activity-item">
                <div className="activity-dot" />
                <div className="activity-info">
                  <p>Completed <strong>Reading</strong> habit</p>
                  <span>2 hours ago</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 4rem;
        }

        .date-pill {
          display: inline-block;
          background: var(--accent-soft);
          color: var(--text-primary);
          padding: 0.4rem 1rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .welcome-text h1 {
          font-size: 4rem;
          margin-bottom: 0.5rem;
          letter-spacing: -0.04em;
        }

        .welcome-text p {
          font-size: 1.25rem;
          color: var(--text-secondary);
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
        }

        .primary-btn {
          background: var(--text-primary);
          color: var(--bg-deep);
          padding: 0.9rem 1.75rem;
          border-radius: 12px;
          font-weight: 700;
        }

        .secondary-btn {
          background: rgba(255,255,255,0.05);
          padding: 0.9rem 1.75rem;
          border-radius: 12px;
          border: 1px solid var(--border-main);
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 4rem;
        }

        .stat-card {
          padding: 2rem;
          border-radius: var(--border-radius-lg);
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .stat-icon-box {
          width: 52px;
          height: 52px;
          background: var(--bg-deep);
          border: 1px solid var(--border-main);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .stat-detail {
          font-size: 0.75rem;
          font-weight: 700;
          color: #00ff88;
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 3rem;
        }

        .category-section h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .category-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          min-height: 220px;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .arrow {
          color: var(--text-dim);
          transition: var(--transition-base);
        }

        .category-card:hover .arrow {
          transform: translate(3px, -3px);
          color: var(--text-primary);
        }

        .category-card h3 {
          font-size: 1.25rem;
          font-weight: 800;
        }

        .item-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .item-list span {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-dim);
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .recent-activity {
          padding: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .view-all {
          font-size: 0.85rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .activity-item {
          display: flex;
          gap: 1rem;
        }

        .activity-dot {
          width: 8px;
          height: 8px;
          background: var(--border-bright);
          border-radius: 50%;
          margin-top: 6px;
        }

        .activity-info p {
          font-size: 0.95rem;
        }

        .activity-info span {
          font-size: 0.8rem;
          color: var(--text-dim);
        }

        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: 1fr; }
          .main-grid { grid-template-columns: 1fr; }
          .welcome-text h1 { font-size: 3rem; }
        }

        @media (max-width: 768px) {
          .dash-header { flex-direction: column; align-items: flex-start; gap: 2rem; }
          .action-buttons { width: 100%; }
          .action-buttons button { flex: 1; }
        }
      `}</style>
    </div>
  );
}
