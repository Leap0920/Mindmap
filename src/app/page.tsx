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
  ArrowRight,
  Loader2,
  Zap,
  Target,
  TrendingUp,
  BookOpen,
  Bookmark,
  Sparkles
} from 'lucide-react';

interface DashStats {
  habitsToday: number;
  totalHabits: number;
  completedTodos: number;
  totalTodos: number;
  routineProgress: number;
  booksReading: number;
}

const quickLinks = [
  { name: 'Habits', href: '/habit', icon: Calendar, desc: 'Track daily habits', color: '#10b981' },
  { name: 'Tasks', href: '/todo', icon: CheckSquare, desc: 'Manage your todos', color: '#f59e0b' },
  { name: 'Schedule', href: '/schedule', icon: Clock, desc: 'Class timetable', color: '#8b5cf6' },
  { name: 'Notes', href: '/notepad', icon: PenTool, desc: 'Quick notes', color: '#ec4899' },
  { name: 'Books', href: '/books', icon: Book, desc: 'Reading tracker', color: '#06b6d4' },
  { name: 'Journal', href: '/journal', icon: BookOpen, desc: 'Daily reflections', color: '#f97316' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const userName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there';

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
        habitsRes.json(), todosRes.json(), routinesRes.json(), booksRes.json(),
      ]);

      const todayStr = today.toISOString().split('T')[0];
      setStats({
        habitsToday: habitsData.entries?.filter((e: any) => e.date === todayStr && e.completed).length || 0,
        totalHabits: habitsData.habits?.length || 0,
        completedTodos: todosData.todos?.filter((t: any) => t.completed).length || 0,
        totalTodos: todosData.todos?.length || 0,
        routineProgress: routinesData.routines?.length > 0 
          ? Math.round((routinesData.logs?.filter((l: any) => l.completed).length / routinesData.routines.length) * 100) 
          : 0,
        booksReading: booksData.books?.filter((b: any) => b.status === 'reading').length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="loading-screen">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  const taskProgress = stats?.totalTodos ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0;

  return (
    <div className="dashboard">
      <header className="hero">
        <div className="hero-content">
          <p className="hero-date">{formattedDate}</p>
          <h1 className="hero-title">{greeting}, {userName}</h1>
          <p className="hero-subtitle">Here's your productivity overview</p>
        </div>
      </header>

      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon habits"><Zap size={18} /></div>
            <div className="stat-content">
              <span className="stat-value">{isLoading ? '—' : `${stats?.habitsToday}/${stats?.totalHabits}`}</span>
              <span className="stat-label">Habits today</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon tasks"><Target size={18} /></div>
            <div className="stat-content">
              <span className="stat-value">{isLoading ? '—' : `${taskProgress}%`}</span>
              <span className="stat-label">Tasks complete</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon routine"><TrendingUp size={18} /></div>
            <div className="stat-content">
              <span className="stat-value">{isLoading ? '—' : `${stats?.routineProgress}%`}</span>
              <span className="stat-label">Routine done</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon books"><Bookmark size={18} /></div>
            <div className="stat-content">
              <span className="stat-value">{isLoading ? '—' : stats?.booksReading}</span>
              <span className="stat-label">Reading now</span>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-section">
        <div className="section-header">
          <h2>Quick Access</h2>
          <Sparkles size={16} />
        </div>
        <div className="quick-grid">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="quick-card">
              <div className="quick-icon" style={{ '--accent': link.color } as any}>
                <link.icon size={20} />
              </div>
              <div className="quick-content">
                <span className="quick-name">{link.name}</span>
                <span className="quick-desc">{link.desc}</span>
              </div>
              <ArrowRight size={16} className="quick-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <style jsx>{`
        .dashboard {
          max-width: 960px;
          margin: 0 auto;
          padding: 1.5rem;
          animation: fadeUp 0.4s ease-out;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero {
          margin-bottom: 2.5rem;
          padding: 2rem 0;
        }
        .hero-date {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .hero-title {
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.03em;
          margin-bottom: 0.25rem;
        }
        .hero-subtitle {
          font-size: 0.9rem;
          color: #555;
        }

        .stats-section {
          margin-bottom: 2.5rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .stat-card {
          background: #0a0a0a;
          border: 1px solid #181818;
          border-radius: 14px;
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .stat-card:hover {
          border-color: #252525;
          transform: translateY(-2px);
        }
        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-icon.habits { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .stat-icon.tasks { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .stat-icon.routine { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
        .stat-icon.books { background: rgba(6, 182, 212, 0.12); color: #06b6d4; }
        
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 1.375rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.125rem;
        }

        .quick-section {
          margin-bottom: 2rem;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .section-header h2 {
          font-size: 0.875rem;
          font-weight: 600;
          color: #888;
        }
        .section-header :global(svg) {
          color: #444;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .quick-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: #0a0a0a;
          border: 1px solid #181818;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        .quick-card:hover {
          border-color: #252525;
          background: #0e0e0e;
        }
        .quick-card:hover .quick-arrow {
          opacity: 1;
          transform: translateX(3px);
        }
        .quick-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          color: var(--accent);
          flex-shrink: 0;
        }
        .quick-content {
          flex: 1;
          min-width: 0;
        }
        .quick-name {
          display: block;
          font-weight: 600;
          font-size: 0.9rem;
          color: #fff;
        }
        .quick-desc {
          display: block;
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.125rem;
        }
        .quick-arrow {
          color: #444;
          opacity: 0;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .dashboard { padding: 1rem; }
          .hero { padding: 1.5rem 0; margin-bottom: 2rem; }
          .hero-title { font-size: 1.5rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .quick-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
