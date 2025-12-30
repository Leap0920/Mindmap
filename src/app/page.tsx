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
  Sparkles,
  ChevronRight,
  LayoutDashboard,
  Activity,
  History
} from 'lucide-react';

interface DashStats {
  habitsToday: number;
  totalHabits: number;
  completedTodos: number;
  totalTodos: number;
  routineProgress: number;
  booksReading: number;
}

interface UserProfile {
  profileImage?: string;
  backgroundImage?: string;
}

const quickLinks = [
  { name: 'Habits', href: '/habit', icon: Calendar, desc: 'Daily consistency' },
  { name: 'Tasks', href: '/todo', icon: CheckSquare, desc: 'Action items' },
  { name: 'Schedule', href: '/schedule', icon: Clock, desc: 'Time management' },
  { name: 'Notes', href: '/notepad', icon: PenTool, desc: 'Capture thoughts' },
  { name: 'Books', href: '/books', icon: Book, desc: 'Knowledge base' },
  { name: 'Journal', href: '/journal', icon: BookOpen, desc: 'Self reflection' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const greeting = currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening';
  const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const userName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchStats();
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUserProfile({
          profileImage: data.user?.profileImage,
          backgroundImage: data.user?.backgroundImage,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [habitsRes, todosRes, routinesRes, booksRes] = await Promise.all([
        fetch('/api/habits'),
        fetch('/api/todos'),
        fetch(`/api/routines?date=${new Date().toISOString().split('T')[0]}`),
        fetch('/api/books'),
      ]);
      const [habitsData, todosData, routinesData, booksData] = await Promise.all([
        habitsRes.json(), todosRes.json(), routinesRes.json(), booksRes.json(),
      ]);

      const todayStr = new Date().toISOString().split('T')[0];
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
        <Loader2 size={24} className="animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  const taskProgress = stats?.totalTodos ? Math.round((stats.completedTodos / stats.totalTodos) * 100) : 0;

  return (
    <div className="dashboard-container">
      <main className="dashboard-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-header">
            <span className="date-badge">{formattedDate}</span>
            <div className="greeting-row">
              <h1 className="main-greeting">Good {greeting}, <span className="user-name">{userName}</span></h1>
              <Sparkles className="sparkle-icon" size={20} />
            </div>
            <p className="hero-intro">Focus on what matters today. Your mind is clear.</p>
          </div>

          <div className="stats-strip">
            <div className="stat-item">
              <div className="stat-header">
                <span className="stat-title">Focus Rate</span>
                <Activity size={14} className="stat-icon-mini" />
              </div>
              <div className="stat-body">
                <span className="stat-value">{isLoading ? '—' : `${taskProgress}%`}</span>
                <div className="stat-progress-bg">
                  <div className="stat-progress-fill" style={{ width: `${taskProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-header">
                <span className="stat-title">Habit Flow</span>
                <Zap size={14} className="stat-icon-mini" />
              </div>
              <div className="stat-body">
                <span className="stat-value">{isLoading ? '—' : `${stats?.habitsToday}/${stats?.totalHabits}`}</span>
                <span className="stat-sub">daily target</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-header">
                <span className="stat-title">Reading</span>
                <BookOpen size={14} className="stat-icon-mini" />
              </div>
              <div className="stat-body">
                <span className="stat-value">{isLoading ? '—' : stats?.booksReading}</span>
                <span className="stat-sub">active books</span>
              </div>
            </div>
          </div>
        </section>

        <div className="main-grid">
          {/* Quick Access Grid */}
          <section className="links-section">
            <div className="section-title-row">
              <h2 className="section-label">Command Center</h2>
              <div className="title-line"></div>
            </div>
            <div className="quick-access-grid">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="modern-quick-card">
                  <div className="card-inner">
                    <div className="icon-box">
                      <link.icon className="card-icon" size={20} strokeWidth={1.5} />
                    </div>
                    <div className="card-text">
                      <span className="card-name">{link.name}</span>
                      <span className="card-desc">{link.desc}</span>
                    </div>
                    <ChevronRight className="card-arrow" size={14} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Perspective Section (Right Column) */}
          <aside className="perspective-aside">
            <div className="sidebar-card status-card">
              <div className="sidebar-header">
                <LayoutDashboard size={14} />
                <span>Productivity Score</span>
              </div>
              <div className="score-viz">
                <svg viewBox="0 0 100 100" className="circular-progress">
                  <circle className="bg" cx="50" cy="50" r="45" />
                  <circle
                    className="fg"
                    cx="50" cy="50" r="45"
                    style={{ strokeDasharray: `${(stats?.routineProgress || 0) * 2.82}, 282.6` }}
                  />
                </svg>
                <div className="score-text">
                  <span className="score-num">{stats?.routineProgress || 0}%</span>
                  <span className="score-label">Continuity</span>
                </div>
              </div>
            </div>

            <div className="sidebar-card mini-quote">
              <p>"Simplicity is the ultimate sophistication."</p>
              <span className="quote-author">— Leonardo da Vinci</span>
            </div>

            <div className="sidebar-card action-item">
              <div className="action-header">
                <History size={14} />
                <span>Next up</span>
              </div>
              <div className="action-content">
                <span className="action-title">Review Daily Journal</span>
                <span className="action-time">Available now</span>
              </div>
              <Link href="/journal" className="action-btn">
                Launch <ArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #050505;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          background-size: 150px 150px;
          color: #f5f5f5;
          font-family: 'Inter', sans-serif;
          position: relative;
        }

        .dashboard-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background: #050505;
          opacity: 0.97;
          z-index: 0;
        }

        .dashboard-content {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          animation: pageReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes pageReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Hero Styling */
        .hero-section {
          margin-bottom: 3.5rem;
        }

        .hero-header {
          margin-bottom: 2.5rem;
        }

        .date-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #666;
          margin-bottom: 1rem;
        }

        .greeting-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .main-greeting {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          background: linear-gradient(180deg, #fff 0%, #a1a1a1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .user-name {
          font-weight: 400;
          opacity: 0.8;
        }

        .sparkle-icon {
          color: #444;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .hero-intro {
          font-size: 1.1rem;
          color: #888;
          font-weight: 400;
        }

        /* Stats Strip */
        .stats-strip {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
        }

        .stat-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-body {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
        }

        .stat-progress-bg {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }

        .stat-progress-fill {
          height: 100%;
          background: #fff;
          border-radius: 2px;
          transition: width 1s ease-out;
        }

        .stat-sub {
          font-size: 0.75rem;
          color: #444;
        }

        /* Main Grid Layout */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 3rem;
        }

        /* Quick Access */
        .section-title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .section-label {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #444;
          white-space: nowrap;
        }

        .title-line {
          height: 1px;
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
        }

        .quick-access-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .modern-quick-card {
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 16px;
          padding: 1.25rem;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
        }

        .modern-quick-card:hover {
          background: #0f0f0f;
          border-color: #333;
          transform: translateY(-4px);
        }

        .card-inner {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          transition: all 0.3s ease;
        }

        .modern-quick-card:hover .icon-box {
          background: #fff;
          color: #000;
        }

        .card-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .card-name {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
        }

        .card-desc {
          font-size: 0.75rem;
          color: #555;
        }

        .card-arrow {
          color: #333;
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }

        .modern-quick-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Perspective Aside */
        .perspective-aside {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 1.5rem;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #666;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .score-viz {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .circular-progress {
          width: 70px;
          height: 70px;
          transform: rotate(-90deg);
        }

        .circular-progress .bg {
          fill: none;
          stroke: rgba(255, 255, 255, 0.05);
          stroke-width: 8;
        }

        .circular-progress .fg {
          fill: none;
          stroke: #fff;
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 1s ease-out;
        }

        .score-text {
          display: flex;
          flex-direction: column;
        }

        .score-num {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .score-label {
          font-size: 0.7rem;
          color: #555;
        }

        .mini-quote {
          background: transparent;
          border-style: dashed;
          text-align: center;
        }

        .mini-quote p {
          font-size: 0.9rem;
          font-style: italic;
          color: #888;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .quote-author {
          font-size: 0.7rem;
          color: #444;
          font-weight: 600;
        }

        .action-item {
          background: #fff;
          color: #000;
        }

        .action-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 700;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .action-content {
          margin-bottom: 1.5rem;
        }

        .action-title {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }

        .action-time {
          font-size: 0.75rem;
          opacity: 0.5;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #000;
          color: #fff;
          padding: 0.6rem 1.25rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
          transition: transform 0.2s ease;
        }

        .action-btn:hover {
          transform: scale(1.05);
        }

        /* Loading Screen */
        .loading-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .main-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .main-greeting {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1.5rem 1rem;
          }
          .stats-strip {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .quick-access-grid {
            grid-template-columns: 1fr;
          }
          .main-greeting {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
}
