"use client";

import { Check, Flame } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HabitItem {
  id: string;
  name: string;
  completed: boolean;
}

interface HabitCardProps {
  date: Date;
  habits: HabitItem[];
  onToggle: (habitId: string) => void;
  isToday?: boolean;
}

export default function HabitCard({ date, habits, onToggle, isToday }: HabitCardProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNum = date.getDate();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  return (
    <div className={cn(
      "habit-card transition-all",
      isToday && "today",
      isWeekend && "weekend"
    )}>
      <div className="card-top">
        <div className="day-info">
          <span className="num">{dayNum}</span>
          <span className="label">{dayName}</span>
        </div>
        {isToday && <div className="today-badge">Today</div>}
      </div>

      <div className="habit-items">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={cn("habit-row", habit.completed && "done")}
            onClick={() => onToggle(habit.id)}
          >
            <div className="check-box">
              {habit.completed && <Check size={10} strokeWidth={4} />}
            </div>
            <span className="name">{habit.name}</span>
          </div>
        ))}
      </div>

      {habits.every(h => h.completed) && habits.length > 0 && (
        <div className="perfect-day">
          <Flame size={12} fill="currentColor" />
          <span>Perfect</span>
        </div>
      )}

      <style jsx>{`
        .habit-card {
          padding: 1.25rem;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: var(--bg-deep);
          position: relative;
          border-bottom: 1px solid var(--border-dim);
          border-right: 1px solid var(--border-dim);
          transition: var(--transition-base);
        }

        .habit-card:hover {
          background: rgba(255, 255, 255, 0.02);
          z-index: 10;
        }

        .today {
          background: rgba(255, 255, 255, 0.03);
          box-shadow: inset 0 0 0 1px var(--border-main);
        }

        .weekend .num {
          color: var(--text-dim);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .day-info {
          display: flex;
          flex-direction: column;
        }

        .num {
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1;
        }

        .label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          margin-top: 2px;
        }

        .today-badge {
          background: var(--text-primary);
          color: var(--bg-deep);
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .habit-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .habit-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--text-secondary);
          transition: var(--transition-fast);
        }

        .check-box {
          width: 16px;
          height: 16px;
          border: 2px solid var(--border-bright);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-fast);
        }

        .habit-row:hover .check-box {
          border-color: var(--text-primary);
        }

        .done .check-box {
          background: var(--text-primary);
          border-color: var(--text-primary);
          color: var(--bg-deep);
        }

        .done .name {
          color: var(--text-dim);
          text-decoration: line-through;
        }

        .perfect-day {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .habit-card {
            min-height: auto;
            border-right: none;
          }
        }
      `}</style>
    </div>
  );
}
