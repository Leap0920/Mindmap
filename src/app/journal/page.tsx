"use client";

import { useState } from 'react';
import { BookOpen, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, Minimize2, Maximize2, Sparkles } from 'lucide-react';

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
      <header className="journal-header">
        <div className="header-left">
          <div className="type-badge">Personal Journal</div>
          <h1 className="text-gradient">Daily Reflection</h1>
        </div>

        <div className="date-controller glass-panel">
          <button className="nav-btn"><ChevronLeft size={18} /></button>
          <div className="current-date">
            <CalendarIcon size={16} />
            <span>{formattedDate}</span>
          </div>
          <button className="nav-btn"><ChevronRight size={18} /></button>
        </div>

        <div className="header-actions">
          <button className="icon-btn"><Minimize2 size={20} /></button>
          <button className="save-btn">
            <Save size={18} />
            <span>Archive Entry</span>
          </button>
        </div>
      </header>

      <div className="editor-container premium-card glass-panel">
        <div className="editor-top">
          <div className="mood-selector">
            <Sparkles size={20} className="text-muted" />
            <span>Deep reflection mode active</span>
          </div>
          <div className="word-count">
            {content.trim().split(/\s+/).filter(x => x).length} words
          </div>
        </div>

        <textarea
          placeholder="Release your thoughts into the void..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="journal-field"
        />

        <div className="editor-footer">
          <div className="tags">#reflection #productivity #mindset</div>
          <div className="auto-save">All changes saved to cloud</div>
        </div>
      </div>

      <style jsx>{`
        .journal-page {
          max-width: 900px;
          margin: 0 auto;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .journal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4rem;
        }

        .type-badge {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }

        .header-left h1 {
          font-size: 3rem;
        }

        .date-controller {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 0.6rem 1.25rem;
          border-radius: 100px;
        }

        .current-date {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .nav-btn {
          color: var(--text-dim);
        }

        .nav-btn:hover { color: var(--text-primary); }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .icon-btn { color: var(--text-dim); }
        .icon-btn:hover { color: var(--text-primary); }

        .save-btn {
          background: var(--text-primary);
          color: var(--bg-deep);
          padding: 0.8rem 1.75rem;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .editor-container {
          min-height: 700px;
          display: flex;
          flex-direction: column;
          padding: 3rem;
          border-radius: var(--border-radius-xl);
          background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0));
        }

        .editor-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .mood-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .journal-field {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 1.4rem;
          line-height: 1.8;
          resize: none;
          outline: none;
          font-family: inherit;
        }

        .journal-field::placeholder {
          color: var(--text-dim);
          opacity: 0.4;
        }

        .editor-footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-dim);
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .tags { color: var(--text-dim); }
        .auto-save { color: #00ff88; }

        @media (max-width: 900px) {
          .journal-header { flex-direction: column; align-items: flex-start; gap: 2rem; }
          .editor-container { padding: 1.5rem; min-height: 500px; }
          .header-left h1 { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}
