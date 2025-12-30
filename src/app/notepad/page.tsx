"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Save, Trash2, Plus, Search, Lock, Unlock, Loader2, X } from 'lucide-react';

interface Note {
    _id: string;
    title: string;
    content: string;
    isLocked: boolean;
    tags: string[];
    updatedAt: string;
}

export default function NotepadPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', isLocked: false, password: '' });
    const [unlockPassword, setUnlockPassword] = useState('');
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [pendingUnlockNote, setPendingUnlockNote] = useState<Note | null>(null);

    const fetchNotes = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/notes?type=notepad');
            const data = await res.json();
            setNotes(data.notes || []);
            if (data.notes?.length > 0 && !activeNoteId) {
                const firstNote = data.notes[0];
                if (!firstNote.isLocked) {
                    setActiveNoteId(firstNote._id);
                    setEditedTitle(firstNote.title);
                    setEditedContent(firstNote.content);
                }
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session, activeNoteId]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchNotes();
        }
    }, [status, router, fetchNotes]);

    const activeNote = notes.find(n => n._id === activeNoteId);

    const selectNote = (note: Note) => {
        if (note.isLocked) {
            setPendingUnlockNote(note);
            setShowUnlockModal(true);
        } else {
            setActiveNoteId(note._id);
            setEditedTitle(note.title);
            setEditedContent(note.content);
        }
    };

    const unlockNote = async () => {
        if (!pendingUnlockNote) return;
        try {
            const res = await fetch('/api/notes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pendingUnlockNote._id, unlockPassword }),
            });
            if (res.ok) {
                const data = await res.json();
                setActiveNoteId(pendingUnlockNote._id);
                setEditedTitle(data.note.title);
                setEditedContent(data.note.content);
                setShowUnlockModal(false);
                setUnlockPassword('');
                setPendingUnlockNote(null);
            } else {
                alert('Invalid password');
            }
        } catch (error) {
            console.error('Error unlocking note:', error);
        }
    };

    const createNote = async () => {
        if (!newNote.title.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newNote, type: 'notepad' }),
            });
            if (res.ok) {
                const data = await res.json();
                setNotes(prev => [data.note, ...prev]);
                if (!newNote.isLocked) {
                    setActiveNoteId(data.note._id);
                    setEditedTitle(data.note.title);
                    setEditedContent('');
                }
                setNewNote({ title: '', isLocked: false, password: '' });
                setShowNewModal(false);
            }
        } catch (error) {
            console.error('Error creating note:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const saveNote = async () => {
        if (!activeNoteId) return;
        setIsSaving(true);
        try {
            await fetch('/api/notes', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: activeNoteId,
                    title: editedTitle,
                    content: editedContent,
                }),
            });
            setNotes(prev => prev.map(n =>
                n._id === activeNoteId ? { ...n, title: editedTitle, content: editedContent } : n
            ));
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteNote = async (id: string) => {
        try {
            await fetch('/api/notes', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setNotes(prev => prev.filter(n => n._id !== id));
            if (activeNoteId === id) {
                setActiveNoteId(null);
                setEditedTitle('');
                setEditedContent('');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Loading notes...</span>
                <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: var(--text-muted); }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="notepad-container">
            <aside className="notes-sidebar">
                <div className="sidebar-header">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="add-note-btn" onClick={() => setShowNewModal(true)}>
                        <Plus size={20} />
                    </button>
                </div>
                <div className="notes-list">
                    {filteredNotes.map(note => (
                        <div
                            key={note._id}
                            className={`note-item ${activeNoteId === note._id ? 'active' : ''}`}
                            onClick={() => selectNote(note)}
                        >
                            <div className="note-item-header">
                                <h4>{note.title}</h4>
                                {note.isLocked && <Lock size={12} />}
                            </div>
                            <p>{note.isLocked ? '🔒 Locked content' : (note.content?.substring(0, 50) || 'Empty note') + '...'}</p>
                            <span className="note-date">{new Date(note.updatedAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                    {filteredNotes.length === 0 && (
                        <div className="empty-notes">
                            <p>No notes yet</p>
                            <button onClick={() => setShowNewModal(true)}>Create your first note</button>
                        </div>
                    )}
                </div>
            </aside>

            <main className="note-editor">
                {activeNote ? (
                    <>
                        <div className="editor-header">
                            <input
                                className="title-input"
                                value={editedTitle}
                                onChange={e => setEditedTitle(e.target.value)}
                                placeholder="Note title..."
                            />
                            <div className="editor-actions">
                                <button className="save-btn" onClick={saveNote} disabled={isSaving}>
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    <span>Save</span>
                                </button>
                                <button className="delete-btn" onClick={() => deleteNote(activeNoteId!)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <textarea
                            className="content-area"
                            value={editedContent}
                            onChange={e => setEditedContent(e.target.value)}
                            placeholder="Start typing your note..."
                        />
                    </>
                ) : (
                    <div className="empty-state">
                        <p>Select a note to start editing</p>
                        <button onClick={() => setShowNewModal(true)}>
                            <Plus size={18} /> Create New Note
                        </button>
                    </div>
                )}
            </main>

            {showNewModal && (
                <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>New Note</h3>
                            <button onClick={() => setShowNewModal(false)}><X size={20} /></button>
                        </div>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                placeholder="Note title"
                                value={newNote.title}
                                onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={newNote.isLocked}
                                    onChange={e => setNewNote({ ...newNote, isLocked: e.target.checked })}
                                />
                                <Lock size={14} /> Lock this note
                            </label>
                        </div>
                        {newNote.isLocked && (
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="Set a password"
                                    value={newNote.password}
                                    onChange={e => setNewNote({ ...newNote, password: e.target.value })}
                                />
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowNewModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={createNote} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showUnlockModal && (
                <div className="modal-overlay" onClick={() => setShowUnlockModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Lock size={18} /> Unlock Note</h3>
                            <button onClick={() => setShowUnlockModal(false)}><X size={20} /></button>
                        </div>
                        <p className="unlock-text">This note is protected. Enter the password to view.</p>
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={unlockPassword}
                                onChange={e => setUnlockPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowUnlockModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={unlockNote}>
                                <Unlock size={16} /> Unlock
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .notepad-container { display: flex; height: calc(100vh - 5rem); border: 1px solid var(--border-main); border-radius: 16px; overflow: hidden; background: var(--bg-card); }
        .notes-sidebar { width: 300px; border-right: 1px solid var(--border-main); display: flex; flex-direction: column; background: var(--bg-main); }
        .sidebar-header { padding: 1rem; display: flex; gap: 0.75rem; border-bottom: 1px solid var(--border-dim); }
        .search-box { flex: 1; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--bg-deep); border-radius: 8px; border: 1px solid var(--border-dim); color: var(--text-muted); }
        .search-box input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 0.9rem; }
        .add-note-btn { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; background: var(--text-primary); color: var(--bg-deep); border-radius: 8px; }
        .notes-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
        .note-item { padding: 1rem; border-radius: 10px; cursor: pointer; margin-bottom: 0.5rem; transition: background 0.15s; }
        .note-item:hover { background: rgba(255,255,255,0.03); }
        .note-item.active { background: var(--accent-soft); }
        .note-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
        .note-item h4 { font-size: 0.95rem; font-weight: 600; }
        .note-item p { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .note-date { font-size: 0.7rem; color: var(--text-dim); }
        .empty-notes { text-align: center; padding: 2rem 1rem; color: var(--text-muted); }
        .empty-notes button { margin-top: 0.5rem; color: var(--text-primary); text-decoration: underline; }
        .note-editor { flex: 1; display: flex; flex-direction: column; }
        .editor-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-dim); }
        .title-input { flex: 1; background: none; border: none; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
        .editor-actions { display: flex; gap: 0.5rem; }
        .save-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--text-primary); color: var(--bg-deep); border-radius: 8px; font-weight: 600; font-size: 0.9rem; }
        .delete-btn { display: flex; padding: 0.5rem; color: var(--text-muted); border-radius: 8px; }
        .delete-btn:hover { color: #f87171; background: rgba(239,68,68,0.1); }
        .content-area { flex: 1; padding: 1.5rem; background: none; border: none; resize: none; font-size: 1rem; line-height: 1.8; color: var(--text-primary); font-family: inherit; }
        .content-area::placeholder { color: var(--text-dim); }
        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: var(--text-muted); }
        .empty-state button { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); border-radius: 10px; font-weight: 600; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 1.5rem; width: 90%; max-width: 400px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .modal-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }
        .unlock-text { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem; }
        .form-group input[type="text"], .form-group input[type="password"] { width: 100%; padding: 0.75rem 1rem; background: var(--bg-deep); border: 1px solid var(--border-main); border-radius: 10px; color: var(--text-primary); }
        .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .checkbox-group input[type="checkbox"] { width: 16px; height: 16px; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; background: var(--text-primary); color: var(--bg-deep); border-radius: 8px; font-weight: 600; }
        .secondary-btn { padding: 0.6rem 1rem; background: transparent; border: 1px solid var(--border-main); color: var(--text-secondary); border-radius: 8px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) { .notes-sidebar { width: 100%; position: absolute; inset: 0; z-index: 10; } .notepad-container { position: relative; } }
      `}</style>
        </div>
    );
}
