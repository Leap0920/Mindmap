"use client";

import { useState } from 'react';
import { Clock, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

export default function RoutinePage() {
    const [routines, setRoutines] = useState([
        { id: '1', name: 'Morning Meditation', time: '06:30', completed: true },
        { id: '2', name: 'Drink 500ml Water', time: '07:00', completed: true },
        { id: '3', name: 'Deep Work Session', time: '09:00', completed: false },
        { id: '4', name: 'Evening Review', time: '21:00', completed: false },
    ]);

    const toggle = (id: string) => {
        setRoutines(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    };

    return (
        <div className="routine-page">
            <header className="page-header">
                <div>
                    <h1>Daily Routine</h1>
                    <p>Consistency is key to success</p>
                </div>
                <button className="add-btn"><Plus size={18} /><span>Add Step</span></button>
            </header>

            <div className="routine-list glass">
                {routines.map(item => (
                    <div
                        key={item.id}
                        className={`routine-item ${item.completed ? 'done' : ''}`}
                        onClick={() => toggle(item.id)}
                    >
                        <div className="item-left">
                            {item.completed ? (
                                <CheckCircle2 className="check-icon active" size={24} />
                            ) : (
                                <Circle className="check-icon" size={24} />
                            )}
                            <div className="item-info">
                                <h4>{item.name}</h4>
                                <div className="time-tag">
                                    <Clock size={12} />
                                    <span>{item.time}</span>
                                </div>
                            </div>
                        </div>
                        <button className="delete-btn" onClick={(e) => e.stopPropagation()}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .routine-page {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
        }

        .page-header p {
          color: var(--muted);
        }

        .add-btn {
          background: var(--foreground);
          color: var(--background);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .routine-list {
          border: 1px solid var(--card-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .routine-item {
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--card-border);
          cursor: pointer;
          transition: background 0.2s;
        }

        .routine-item:last-child {
          border-bottom: none;
        }

        .routine-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .item-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .check-icon {
          color: var(--muted);
          transition: all 0.2s;
        }

        .check-icon.active {
          color: var(--foreground);
        }

        .item-info h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          transition: color 0.2s;
        }

        .routine-item.done h4 {
          color: var(--muted);
          text-decoration: line-through;
        }

        .time-tag {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          width: fit-content;
        }

        .delete-btn {
          color: var(--muted);
          opacity: 0;
          transition: all 0.2s;
        }

        .routine-item:hover .delete-btn {
          opacity: 1;
        }

        .delete-btn:hover {
          color: #ff4444;
        }
      `}</style>
        </div>
    );
}
