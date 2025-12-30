"use client";

import { useState } from 'react';
import HabitCard from '@/components/HabitCard';
import { ChevronLeft, ChevronRight, Plus, Settings2, Calendar as CalIcon, Filter, LayoutGrid, List } from 'lucide-react';

const INITIAL_HABITS = [
  { id: '1', name: 'Reading', completed: false },
  { id: '2', name: 'Study', completed: true },
  { id: '3', name: 'Workout', completed: false },
];

export default function HabitPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 1));
  const [habits, setHabits] = useState(INITIAL_HABITS);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  return (
    <div className="habit-page">
      <header className="page-header">
        <div className="title-section">
          <div className="breadcrumb">Workspace / Productivity</div>
          <h1 className="text-gradient">Habit Journey</h1>
          <p>Small steps lead to big change.</p>
        </div>

        <div className="header-actions">
          <div className="view-toggle glass-panel">
            <button className="active"><LayoutGrid size={16} /></button>
            <button><List size={16} /></button>
          </div>
          <button className="primary-btn">
            <Plus size={18} />
            <span>Add Habit</span>
          </button>
        </div>
      </header>

      <section className="calendar-container glass-panel">
        <div className="calendar-toolbar">
          <div className="month-picker">
            <button className="nav-btn"><ChevronLeft size={20} /></button>
            <div className="current-month">
              <CalIcon size={18} className="text-muted" />
              <span>{monthName} {currentYear}</span>
            </div>
            <button className="nav-btn"><ChevronRight size={20} /></button>
          </div>
          <div className="toolbar-right">
            <button className="secondary-btn">Today</button>
            <button className="icon-btn"><Filter size={18} /></button>
            <button className="icon-btn"><Settings2 size={18} /></button>
          </div>
        </div>

        <div className="weekday-header">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="weekday">{d}</div>
          ))}
        </div>

        <div className="calendar-grid">
          {Array.from({ length: daysInMonth }).map((_, i) => (
            <HabitCard
              key={i}
              date={new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)}
              habits={habits}
              onToggle={toggleHabit}
              isToday={i + 1 === 12}
            />
          ))}
        </div>
      </section>

      <style jsx>{`
        .habit-page {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
        }

        .breadcrumb {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }

        .page-header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          padding: 4px;
          border-radius: 10px;
        }

        .view-toggle button {
          padding: 8px 12px;
          border-radius: 6px;
          color: var(--text-muted);
        }

        .view-toggle button.active {
          background: rgba(255,255,255,0.08);
          color: var(--text-primary);
        }

        .primary-btn {
          background: var(--text-primary);
          color: var(--bg-deep);
          padding: 0.75rem 1.5rem;
          border-radius: var(--border-radius-md);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.4);
        }

        .calendar-container {
          border-radius: var(--border-radius-xl);
          overflow: hidden;
        }

        .calendar-toolbar {
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-dim);
        }

        .month-picker {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .current-month {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .toolbar-right {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .secondary-btn {
          background: rgba(255,255,255,0.05);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          border: 1px solid var(--border-dim);
        }

        .icon-btn {
          color: var(--text-muted);
          padding: 0.5rem;
        }

        .icon-btn:hover {
          color: var(--text-primary);
        }

        .weekday-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 1rem 0;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border-dim);
          text-align: center;
        }

        .weekday {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--border-dim);
        }

        .calendar-grid :global(.habit-card) {
          border-radius: 0;
          border: none;
          background: var(--bg-deep);
        }

        @media (max-width: 1200px) {
          .calendar-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .weekday-header { display: none; }
        }

        @media (max-width: 768px) {
          .calendar-grid {
            grid-template-columns: repeat(1, 1fr);
          }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-actions {
            margin-top: 1.5rem;
            width: 100%;
          }
          .view-toggle { display: none; }
          .primary-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
