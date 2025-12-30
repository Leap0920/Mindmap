"use client";

import { useState } from 'react';
import HabitCard from '@/components/HabitCard';
import { ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react';

// Mock data for initial view
const INITIAL_HABITS = [
    { id: '1', name: 'Reading', completed: false },
    { id: '2', name: 'Study', completed: true },
    { id: '3', name: 'Workout', completed: false },
];

export default function HabitPage() {
    const [currentDate, setCurrentDate] = useState(new Date(2025, 1, 1)); // Feb 2025 like in the image
    const [habits, setHabits] = useState(INITIAL_HABITS);

    // Helper to get days in month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const toggleHabit = (id: string) => {
        setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
    };

    return (
        <div className="habit-page">
            <header className="page-header">
                <div className="header-left">
                    <button className="view-selector">Monthly</button>
                    <div className="month-display">
                        <h2>{monthName}</h2>
                    </div>
                </div>
                <div className="header-right">
                    <div className="controls">
                        <button className="icon-btn"><ChevronLeft size={20} /></button>
                        <button className="text-btn">Today</button>
                        <button className="icon-btn"><ChevronRight size={20} /></button>
                    </div>
                    <button className="new-btn">
                        <Plus size={18} />
                        <span>New</span>
                    </button>
                    <button className="icon-btn settings"><Settings2 size={20} /></button>
                </div>
            </header>

            <div className="calendar-grid">
                <div className="weekday-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="weekday">{d}</div>
                    ))}
                </div>
                <div className="grid-content">
                    {/* We'd normally offset this for the starting day of the week, but for simplicity: */}
                    {Array.from({ length: daysInMonth }).map((_, i) => (
                        <HabitCard
                            key={i}
                            date={new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)}
                            habits={habits}
                            onToggle={toggleHabit}
                            isToday={i + 1 === 12} // Example today
                        />
                    ))}
                </div>
            </div>

            <style jsx>{`
        .habit-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .view-selector {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .month-display h2 {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .controls {
          display: flex;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 6px;
          padding: 2px;
        }

        .icon-btn, .text-btn {
          padding: 0.4rem 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .icon-btn:hover, .text-btn:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .text-btn {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .new-btn {
          background: var(--foreground);
          color: var(--background);
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .calendar-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .weekday-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: right;
          padding-right: 1rem;
        }

        .weekday {
          font-size: 0.8rem;
          color: var(--muted);
          font-weight: 500;
          text-transform: uppercase;
        }

        .grid-content {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: var(--card-border);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          overflow: hidden;
        }

        /* We override the card background slightly when in the grid to see the borders */
        .grid-content :global(.habit-card) {
          border-radius: 0;
          border: none;
          background: var(--background);
        }

        @media (max-width: 1200px) {
          .grid-content {
            grid-template-columns: repeat(4, 1fr);
          }
           .weekday-header {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .grid-content {
            grid-template-columns: repeat(1, 1fr);
          }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
        </div>
    );
}
