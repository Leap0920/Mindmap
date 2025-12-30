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
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: #555; }
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
        .notepad-container { display: flex; height: calc(100vh - 5rem); border: 1px solid #181818; border-radius: 14px; overflow: hidden; background: #0a0a0a; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .notes-sidebar { width: 280px; border-right: 1px solid #181818; display: flex; flex-direction: column; background: #080808; }
        .sidebar-header { padding: 0.875rem; display: flex; gap: 0.625rem; border-bottom: 1px solid #151515; }
        .search-box { flex: 1; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: #0a0a0a; border-radius: 8px; border: 1px solid #1a1a1a; color: #555; }
        .search-box input { flex: 1; background: none; border: none; color: #fff; font-size: 0.8125rem; outline: none; }
        .search-box input::placeholder { color: #444; }
        .add-note-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: #fff; color: #000; border-radius: 8px; transition: all 0.15s; }
        .add-note-btn:hover { transform: translateY(-1px); }
        .notes-list { flex: 1; overflow-y: auto; padding: 0.5rem; }
        .note-item { padding: 0.875rem; border-radius: 8px; cursor: pointer; margin-bottom: 0.375rem; transition: all 0.15s; border: 1px solid transparent; }
        .note-item:hover { background: #0c0c0c; border-color: #1a1a1a; }
        .note-item.active { background: #111; border-color: #1f1f1f; }
        .note-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
        .note-item-header svg { color: #555; }
        .note-item h4 { font-size: 0.875rem; font-weight: 600; color: #eee; }
        .note-item p { font-size: 0.75rem; color: #555; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .note-date { font-size: 0.625rem; color: #444; }
        .empty-notes { text-align: center; padding: 2rem 1rem; color: #555; }
        .empty-notes button { margin-top: 0.5rem; color: #888; font-size: 0.8125rem; }
        .empty-notes button:hover { color: #fff; }
        .note-editor { flex: 1; display: flex; flex-direction: column; background: #0a0a0a; }
        .editor-header { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1.25rem; border-bottom: 1px solid #151515; }
        .title-input { flex: 1; background: none; border: none; font-size: 1.125rem; font-weight: 600; color: #fff; outline: none; }
        .title-input::placeholder { color: #333; }
        .editor-actions { display: flex; gap: 0.5rem; }
        .save-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.875rem; background: #fff; color: #000; border-radius: 8px; font-weight: 600; font-size: 0.8125rem; transition: all 0.15s; }
        .save-btn:hover { transform: translateY(-1px); }
        .delete-btn { display: flex; padding: 0.5rem; color: #555; border-radius: 6px; transition: all 0.15s; }
        .delete-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
        .content-area { flex: 1; padding: 1.25rem; background: none; border: none; resize: none; font-size: 0.9375rem; line-height: 1.8; color: #ddd; font-family: inherit; outline: none; }
        .content-area::placeholder { color: #333; }
        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #444; }
        .empty-state button { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: #fff; color: #000; border-radius: 8px; font-weight: 600; font-size: 0.8125rem; transition: all 0.15s; }
        .empty-state button:hover { transform: translateY(-1px); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 14px; padding: 1.5rem; width: 90%; max-width: 380px; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
        .modal-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; color: #fff; }
        .modal-header button { color: #555; padding: 0.25rem; }
        .modal-header button:hover { color: #999; }
        .unlock-text { color: #666; font-size: 0.8125rem; margin-bottom: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.6875rem; font-weight: 600; color: #666; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input[type="text"], .form-group input[type="password"] { width: 100%; padding: 0.625rem 0.875rem; background: #080808; border: 1px solid #1f1f1f; border-radius: 8px; color: #fff; font-size: 0.875rem; outline: none; transition: border-color 0.15s; }
        .form-group input:focus { border-color: #333; }
        .checkbox-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.8125rem; color: #888; }
        .checkbox-group input[type="checkbox"] { width: 16px; height: 16px; accent-color: #fff; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.625rem; margin-top: 1.25rem; }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #fff; color: #000; border-radius: 8px; font-weight: 600; font-size: 0.8125rem; transition: all 0.15s; }
        .primary-btn:hover { transform: translateY(-1px); }
        .secondary-btn { padding: 0.5rem 1rem; background: transparent; border: 1px solid #1f1f1f; color: #777; border-radius: 8px; font-size: 0.8125rem; transition: all 0.15s; }
        .secondary-btn:hover { border-color: #333; color: #999; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) { .notes-sidebar { width: 100%; position: absolute; inset: 0; z-index: 10; } .notepad-container { position: relative; } }
      `}</style>
        </div>
    );
}
