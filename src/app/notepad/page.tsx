"use client";

import { useState } from 'react';
import ProtectedContent from '@/components/ProtectedContent';
import { Save, Trash2, Plus, Search } from 'lucide-react';

export default function NotepadPage() {
    const [notes, setNotes] = useState([
        { id: '1', title: 'Meeting Notes', content: 'Discuss quarterly goals...', locked: false },
        { id: '2', title: 'Personal Thoughts', content: 'Secret plans for the weekend...', locked: true },
    ]);
    const [activeNoteId, setActiveNoteId] = useState('1');

    const activeNote = notes.find(n => n.id === activeNoteId);

    return (
        <div className="notepad-container">
            <aside className="notes-sidebar">
                <div className="sidebar-header">
                    <div className="search-box">
                        <Search size={16} />
                        <input type="text" placeholder="Search notes..." />
                    </div>
                    <button className="add-note-btn"><Plus size={20} /></button>
                </div>
                <div className="notes-list">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className={`note-item ${activeNoteId === note.id ? 'active' : ''}`}
                            onClick={() => setActiveNoteId(note.id)}
                        >
                            <h4>{note.title}</h4>
                            <p>{note.content.substring(0, 30)}...</p>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="note-editor">
                {activeNote ? (
                    <ProtectedContent isInitiallyLocked={activeNote.locked}>
                        <div className="editor-header">
                            <input
                                className="title-input"
                                value={activeNote.title}
                                onChange={() => { }}
                            />
                            <div className="editor-actions">
                                <button className="icon-btn"><Save size={18} /></button>
                                <button className="icon-btn delete"><Trash2 size={18} /></button>
                            </div>
                        </div>
                        <textarea
                            className="content-area"
                            value={activeNote.content}
                            onChange={() => { }}
                            placeholder="Start typing..."
                        />
                    </ProtectedContent>
                ) : (
                    <div className="empty-state">Select a note to start editing</div>
                )}
            </main>

            <style jsx>{`
        .notepad-container {
          display: flex;
          height: calc(100vh - 4rem);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          overflow: hidden;
          background: var(--card-bg);
        }

        .notes-sidebar {
          width: 300px;
          border-right: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          gap: 1rem;
          border-bottom: 1px solid var(--card-border);
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--background);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid var(--card-border);
          color: var(--muted);
        }

        .search-box input {
          background: none;
          border: none;
          color: var(--foreground);
          font-size: 0.85rem;
          width: 100%;
        }

        .add-note-btn {
          color: var(--muted);
        }

        .notes-list {
          flex: 1;
          overflow-y: auto;
        }

        .note-item {
          padding: 1.5rem;
          border-bottom: 1px solid var(--card-border);
          cursor: pointer;
          transition: background 0.2s;
        }

        .note-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .note-item.active {
          background: rgba(255, 255, 255, 0.05);
          border-left: 3px solid var(--foreground);
        }

        .note-item h4 {
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
        }

        .note-item p {
          font-size: 0.8rem;
          color: var(--muted-foreground);
        }

        .note-editor {
          flex: 1;
          padding: 2rem;
          background: var(--background);
          overflow-y: auto;
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .title-input {
          font-size: 2rem;
          font-weight: 700;
          background: none;
          border: none;
          color: var(--foreground);
          width: 70%;
        }

        .editor-actions {
          display: flex;
          gap: 1rem;
        }

        .icon-btn {
          color: var(--muted);
          padding: 0.5rem;
          border-radius: 6px;
        }

        .icon-btn:hover {
          background: var(--card-bg);
          color: var(--foreground);
        }

        .icon-btn.delete:hover {
          color: #ff4444;
        }

        .content-area {
          width: 100%;
          min-height: 500px;
          background: none;
          border: none;
          color: var(--foreground);
          font-size: 1.1rem;
          line-height: 1.6;
          resize: none;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--muted);
        }

        @media (max-width: 900px) {
          .notes-sidebar {
            width: 80px;
          }
          .sidebar-header, .note-item p, .note-item h4 {
            display: none;
          }
          .note-item {
            justify-content: center;
          }
        }
      `}</style>
        </div>
    );
}
