"use client";

import { useState } from 'react';
import { BookOpen, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight } from 'lucide-react';

export default function JournalPage() {
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date());

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="journal-page">
            <div className="journal-header">
                <div className="date-nav">
                    <button className="nav-btn"><ChevronLeft size={20} /></button>
                    <div className="date-info">
                        <CalendarIcon size={18} />
                        <span>{formattedDate}</span>
                    </div>
                    <button className="nav-btn"><ChevronRight size={20} /></button>
                </div>
                <button className="save-btn glass">
                    <Save size={18} />
                    <span>Save Entry</span>
                </button>
            </div>

            <div className="journal-container glass">
                <div className="entry-meta">
                    <BookOpen size={24} />
                    <h2>How was your day?</h2>
                </div>
                <textarea
                    placeholder="Start writing your thoughts..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="journal-textarea"
                />
            </div>

            <style jsx>{`
        .journal-page {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .journal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .date-nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: var(--card-bg);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          border: 1px solid var(--card-border);
        }

        .date-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          font-size: 0.95rem;
        }

        .nav-btn {
          color: var(--muted);
          padding: 0.25rem;
        }

        .nav-btn:hover {
          color: var(--foreground);
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-weight: 600;
          background: var(--foreground);
          color: var(--background);
        }

        .journal-container {
          padding: 3rem;
          border-radius: 24px;
          border: 1px solid var(--card-border);
          min-height: 600px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          background: rgba(255, 255, 255, 0.02);
        }

        .entry-meta {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          color: var(--muted);
        }

        .entry-meta h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .journal-textarea {
          flex: 1;
          background: none;
          border: none;
          color: var(--foreground);
          font-size: 1.25rem;
          line-height: 1.8;
          resize: none;
          outline: none;
          font-family: inherit;
        }

        .journal-textarea::placeholder {
          color: var(--muted-foreground);
          opacity: 0.5;
        }

        @media (max-width: 600px) {
          .journal-container {
            padding: 1.5rem;
          }
          .journal-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
           .date-nav {
            justify-content: space-between;
          }
        }
      `}</style>
        </div>
    );
}
