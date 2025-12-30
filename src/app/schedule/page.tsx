"use client";

import { useState } from 'react';
import { Clock, User as UserIcon, MapPin, Plus } from 'lucide-react';

export default function SchedulePage() {
    const [schedule] = useState([
        { id: '1', subject: 'Advanced Mathematics', teacher: 'Dr. Smith', room: 'B-204', time: '08:00 - 09:30', days: ['Mon', 'Wed'] },
        { id: '2', subject: 'Computer Science', teacher: 'Prof. Johnson', room: 'Lab 1', time: '10:00 - 12:00', days: ['Tue', 'Thu'] },
        { id: '3', subject: 'Physics II', teacher: 'Dr. Williams', room: 'A-105', time: '13:00 - 14:30', days: ['Mon', 'Fri'] },
    ]);

    return (
        <div className="schedule-page">
            <header className="page-header">
                <h1>School Schedule</h1>
                <button className="add-btn"><Plus size={18} /><span>Add Class</span></button>
            </header>

            <div className="schedule-grid">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <div key={day} className="day-column">
                        <h3>{day}</h3>
                        <div className="class-cards">
                            {schedule.filter(c => c.days.some(d => day.startsWith(d))).map(cls => (
                                <div key={`${day}-${cls.id}`} className="class-card glass">
                                    <span className="time">{cls.time}</span>
                                    <h4>{cls.subject}</h4>
                                    <div className="class-meta">
                                        <div className="meta-item">
                                            <UserIcon size={14} />
                                            <span>{cls.teacher}</span>
                                        </div>
                                        <div className="meta-item">
                                            <MapPin size={14} />
                                            <span>{cls.room}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .schedule-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .add-btn {
          background: var(--foreground);
          color: var(--background);
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .schedule-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1.5rem;
          align-items: flex-start;
        }

        .day-column h3 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .class-cards {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .class-card {
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--card-border);
          transition: transform 0.2s;
        }

        .class-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.08);
        }

        .time {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted);
          display: block;
          margin-bottom: 0.5rem;
        }

        h4 {
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .class-meta {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--muted);
        }

        @media (max-width: 1000px) {
          .schedule-grid {
            grid-template-columns: 1fr;
          }
          .day-column {
            margin-bottom: 2rem;
          }
        }
      `}</style>
        </div>
    );
}
