"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  CheckSquare,
  PenTool,
  Clock,
  Book,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  Activity,
  Zap,
  LayoutDashboard
} from 'lucide-react';

interface DashStats {
  habitsToday: number;
  totalHabits: number;
  completedTodos: number;
  totalTodos: number;
  routineProgress: number;
  booksReading: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [habitsRes, todosRes, routinesRes, booksRes] = await Promise.all([
        fetch('/api/habits'),
        fetch('/api/todos'),
        fetch(`/api/routines?date=${today.toISOString().split('T')[0]}`),
        fetch('/api/books'),
      ]);

      const [habitsData, todosData, routinesData, booksData] = await Promise.all([
        habitsRes.json(),
        todosRes.json(),
        routinesRes.json(),
        booksRes.json(),
      ]);

      const todayStr = today.toISOString().split('T')[0];
      const todayHabits = habitsData.entries?.filter((e: any) => e.date === todayStr && e.completed).length || 0;
      const totalHabits = habitsData.habits?.length || 0;
      const completedTodos = todosData.todos?.filter((t: any) => t.completed).length || 0;
      const totalTodos = todosData.todos?.length || 0;
      const routineItems = routinesData.routines?.length || 0;
      const routineCompleted = routinesData.logs?.filter((l: any) => l.completed).length || 0;
      const routineProgress = routineItems > 0 ? Math.round((routineCompleted / routineItems) * 100) : 0;
      const booksReading = booksData.books?.filter((b: any) => b.status === 'reading').length || 0;

      setStats({
        habitsToday: todayHabits,
        totalHabits,
        completedTodos,
        totalTodos,
        routineProgress,
        booksReading,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { title: 'Rituals', items: ['Habit Tracker', 'Daily Routine', 'Journal'], icon: Calendar, href: '/habit' },
    { title: 'Academic', items: ['School Schedule', 'Subject Notebook', 'Notepad'], icon: Book, href: '/schedule' },
    { title: 'Security', items: ['Password Vault'], icon: Clock, href: '/passwords' },
  ];

  if (status === 'loading') {
    return (
      <div className="loading-screen">
        <Loader2 size={32} className="spinner" />
        <style jsx>{`
          .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 80vh; }
          .spinner { animation: spin 1s linear infinite; color: #444; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="welcome">
          <span className="date">{formattedDate}</span>
          <h1>{greeting}, {userName}.</h1>
        </div>
        <div className="header-actions">
          <Link href="/habit" className="outline-btn">Track Habits</Link>
          <Link href="/todo" className="solid-btn">Tasks</Link>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Habits Today</span>
            <span className="value">{isLoading ? '—' : `${stats?.habitsToday}/${stats?.totalHabits}`}</span>
          </div>
          <Zap size={20} className="stat-icon" />
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Tasks Completed</span>
            <span className="value">{isLoading ? '—' : `${stats?.completedTodos}/${stats?.totalTodos}`}</span>
          </div>
          <CheckSquare size={20} className="stat-icon" />
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="label">Routine Progress</span>
            <span className="value">{isLoading ? '—' : `${stats?.routineProgress}%`}</span>
          </div>
          <Activity size={20} className="stat-icon" />
        </div>
      </section>

      <div className="content-grid">
        <section className="categories">
          <h2>Quick Access</h2>
          <div className="grid">
            {categories.map((cat, i) => (
              <Link href={cat.href} key={i} className="cat-card">
                <div className="cat-header">
                  <cat.icon size={20} />
                  <ArrowUpRight size={16} className="arrow" />
                </div>
                <h3>{cat.title}</h3>
                <div className="cat-items">
                  {cat.items.map(item => <span key={item}>{item}</span>)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="activity">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link href="/history" className="view-all">History <ChevronRight size={14} /></Link>
          </div>
          <div className="list">
            {[1, 2, 3].map(idx => (
              <div key={idx} className="list-item">
                <div className="dot" />
                <div className="info">
                  <p>System activity logged</p>
                  <span>Recently</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1000px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3.5rem;
        }

        .welcome .date {
          display: block;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .welcome h1 {
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .solid-btn {
          background: #fff;
          color: #000;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .outline-btn {
          border: 1px solid var(--border-main);
          color: var(--text-secondary);
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .outline-btn:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-bottom: 3.5rem;
        }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-main);
          padding: 1.5rem;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-info .label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .stat-info .value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-icon {
          color: var(--text-dim);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 3rem;
        }

        .categories h2, .activity h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }

        .cat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-main);
          padding: 1.5rem;
          border-radius: 12px;
          transition: border-color 0.2s;
        }

        .cat-card:hover {
          border-color: var(--border-bright);
        }

        .cat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          color: var(--text-muted);
        }

        .cat-card h3 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .cat-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .cat-items span {
          font-size: 0.7rem;
          color: var(--text-dim);
          background: rgba(255, 255, 255, 0.02);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .view-all {
          font-size: 0.8rem;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }

        .list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .list-item {
          display: flex;
          gap: 0.85rem;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: #333;
          border-radius: 50%;
          margin-top: 6px;
        }

        .info p {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .info span {
          font-size: 0.75rem;
          color: var(--text-dim);
        }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: 1fr; }
          .content-grid { grid-template-columns: 1fr; }
          .dash-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
