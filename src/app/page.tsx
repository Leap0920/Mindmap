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
  Key,
  Bookmark
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
  { name: 'Habits', href: '/habit', icon: Calendar, desc: 'Track daily habits' },
  { name: 'Tasks', href: '/todo', icon: CheckSquare, desc: 'Manage your todos' },
  { name: 'Schedule', href: '/schedule', icon: Clock, desc: 'School timetable' },
  { name: 'Notes', href: '/notepad', icon: PenTool, desc: 'Quick notes' },
  { name: 'Books', href: '/books', icon: Book, desc: 'Reading tracker' },
  { name: 'Journal', href: '/journal', icon: BookOpen, desc: 'Daily reflections' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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
    <div className="page animate-slide">
      <header className="header">
        <div>
          <p className="date">{formattedDate}</p>
          <h1 className="title">{greeting}, {userName}</h1>
        </div>
      </header>

      <section className="metrics">
        <div className="metric-card">
          <div className="metric-icon"><Zap size={18} /></div>
          <div className="metric-data">
            <span className="metric-value">{isLoading ? '—' : stats?.habitsToday}/{stats?.totalHabits}</span>
            <span className="metric-label">Habits completed</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Target size={18} /></div>
          <div className="metric-data">
            <span className="metric-value">{isLoading ? '—' : `${taskProgress}%`}</span>
            <span className="metric-label">Tasks done</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><TrendingUp size={18} /></div>
          <div className="metric-data">
            <span className="metric-value">{isLoading ? '—' : `${stats?.routineProgress}%`}</span>
            <span className="metric-label">Routine progress</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Bookmark size={18} /></div>
          <div className="metric-data">
            <span className="metric-value">{isLoading ? '—' : stats?.booksReading}</span>
            <span className="metric-label">Books reading</span>
          </div>
        </div>
      </section>

      <section className="quick-access">
        <h2>Quick Access</h2>
        <div className="links-grid">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href} className="link-card">
              <div className="link-icon"><link.icon size={20} /></div>
              <div className="link-info">
                <span className="link-name">{link.name}</span>
                <span className="link-desc">{link.desc}</span>
              </div>
              <ArrowRight size={16} className="link-arrow" />
            </Link>
          ))}
        </div>
      </section>

      <style jsx>{`
        .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
        .header { margin-bottom: 2.5rem; }
        .date { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem; }
        .title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; }
        
        .metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 3rem;
        }
        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .metric-icon {
          width: 36px;
          height: 36px;
          background: var(--accent-muted);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        .metric-data { display: flex; flex-direction: column; }
        .metric-value { font-size: 1.25rem; font-weight: 700; }
        .metric-label { font-size: 0.75rem; color: var(--text-muted); }
        
        .quick-access h2 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .links-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        .link-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          transition: all var(--transition-base);
        }
        .link-card:hover {
          border-color: var(--border-default);
          background: var(--bg-elevated);
        }
        .link-card:hover .link-arrow { opacity: 1; transform: translateX(2px); }
        .link-icon {
          width: 40px;
          height: 40px;
          background: var(--accent-muted);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        .link-info { flex: 1; }
        .link-name { display: block; font-weight: 600; font-size: 0.9rem; }
        .link-desc { font-size: 0.75rem; color: var(--text-muted); }
        .link-arrow { color: var(--text-dim); opacity: 0; transition: all var(--transition-base); }
        
        @media (max-width: 768px) {
          .metrics { grid-template-columns: repeat(2, 1fr); }
          .links-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
