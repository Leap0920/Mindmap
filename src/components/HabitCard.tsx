"use client";

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
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
    const formattedDate = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className={cn("habit-card glass", isToday && "today-card")}>
            <div className="card-header">
                <div className="date-badge">
                    <span className="day-name">{dayName}</span>
                    <span className="day-num">{dayNum}</span>
                </div>
                <div className="status-indicator">
                    <Check size={14} className="icon" />
                    <span>Daily Habits</span>
                </div>
            </div>
            <div className="full-date">{formattedDate}</div>
            <div className="habit-list">
                {habits.map((habit) => (
                    <div
                        key={habit.id}
                        className="habit-item"
                        onClick={() => onToggle(habit.id)}
                    >
                        <div className={cn("checkbox", habit.completed && "checked")}>
                            {habit.completed && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className={cn("habit-name", habit.completed && "completed")}>
                            {habit.name}
                        </span>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .habit-card {
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-height: 200px;
          transition: all 0.2s ease;
        }

        .habit-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--muted);
        }

        .today-card {
          border-color: var(--foreground);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .date-badge {
          display: flex;
          flex-direction: column;
        }

        .day-name {
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 600;
        }

        .day-num {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .full-date {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .habit-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .habit-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          user-select: none;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid var(--muted);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .checkbox.checked {
          background: var(--foreground);
          border-color: var(--foreground);
          color: var(--background);
        }

        .habit-name {
          font-size: 0.85rem;
          color: var(--foreground);
        }

        .habit-name.completed {
          color: var(--muted);
          text-decoration: line-through;
        }
      `}</style>
        </div>
    );
}
