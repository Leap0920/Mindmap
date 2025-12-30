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
        .notepad-container { 
            display: flex; 
            height: calc(100vh - 40px); 
            margin: 20px;
            border: 1px solid #151515; 
            border-radius: 20px; 
            overflow: hidden; 
            background: #080808; 
            animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        @keyframes modalIn { 
            from { opacity: 0; transform: translateY(24px) scale(0.98); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .notes-sidebar { 
            width: 320px; 
            border-right: 1px solid #151515; 
            display: flex; 
            flex-direction: column; 
            background: #080808; 
        }

        .sidebar-header { 
            padding: 24px; 
            display: flex; 
            gap: 12px; 
            border-bottom: 1px solid #151515; 
        }

        .search-box { 
            flex: 1; 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 10px 14px; 
            background: #0d0d0d; 
            border-radius: 10px; 
            border: 1px solid #1a1a1a; 
            color: #333; 
            transition: all 0.2s;
        }

        .search-box:focus-within {
            border-color: #333;
            background: #050505;
        }

        .search-box input { 
            flex: 1; 
            background: none; 
            border: none; 
            color: #fff; 
            font-size: 0.8125rem; 
            outline: none; 
            font-weight: 500;
        }

        .search-box input::placeholder { color: #222; }

        .add-note-btn { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            width: 40px; 
            height: 40px; 
            background: #fff; 
            color: #000; 
            border-radius: 10px; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .add-note-btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(255,255,255,0.2);
        }

        .notes-list { 
            flex: 1; 
            overflow-y: auto; 
            padding: 12px; 
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .note-item { 
            padding: 16px 20px; 
            border-radius: 12px; 
            cursor: pointer; 
            transition: all 0.2s; 
            border: 1px solid transparent; 
        }

        .note-item:hover { 
            background: #0d0d0d; 
            border-color: #1a1a1a; 
        }

        .note-item.active { 
            background: #111; 
            border-color: #222; 
        }

        .note-item-header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            margin-bottom: 6px; 
        }

        .note-item-header svg { color: #333; }
        .note-item h4 { 
            font-size: 0.875rem; 
            font-weight: 700; 
            color: #fff; 
            letter-spacing: -0.01em;
        }

        .note-item p { 
            font-size: 0.75rem; 
            color: #444; 
            margin-bottom: 6px; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap; 
            font-weight: 500;
        }

        .note-date { 
            font-size: 0.625rem; 
            color: #222; 
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .empty-notes { 
            text-align: center; 
            padding: 60px 20px; 
            color: #222; 
        }

        .empty-notes button { 
            margin-top: 12px; 
            color: #444; 
            font-size: 0.8125rem; 
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .empty-notes button:hover { color: #fff; }

        .note-editor { 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            background: #050505; 
        }

        .editor-header { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 24px 40px; 
            border-bottom: 1px solid #151515; 
            background: #080808;
        }

        .title-input { 
            flex: 1; 
            background: none; 
            border: none; 
            font-size: 1.5rem; 
            font-weight: 800; 
            color: #fff; 
            outline: none; 
            letter-spacing: -0.03em;
        }

        .title-input::placeholder { color: #1a1a1a; }

        .editor-actions { display: flex; gap: 12px; align-items: center; }

        .save-btn { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 10px 20px; 
            background: #fff; 
            color: #000; 
            border-radius: 10px; 
            font-weight: 800; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .save-btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(255,255,255,0.2);
        }

        .delete-btn { 
            display: flex; 
            padding: 10px; 
            color: #222; 
            border-radius: 10px; 
            transition: all 0.2s; 
        }

        .delete-btn:hover { 
            color: #ff4444; 
            background: rgba(255,68,68,0.1); 
        }

        .content-area { 
            flex: 1; 
            padding: 40px; 
            background: none; 
            border: none; 
            resize: none; 
            font-size: 1.125rem; 
            line-height: 2; 
            color: #aaa; 
            font-family: inherit; 
            outline: none; 
            font-weight: 400;
        }

        .content-area::placeholder { color: #151515; }

        .empty-state { 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            gap: 24px; 
            color: #1a1a1a; 
        }

        .empty-state p {
            font-size: 1rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }

        .empty-state button { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 12px 24px; 
            background: #fff; 
            color: #000; 
            border-radius: 12px; 
            font-weight: 800; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }

        .modal-overlay { 
            position: fixed; 
            inset: 0; 
            background: rgba(0,0,0,0.9); 
            backdrop-filter: blur(12px); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            z-index: 1000; 
        }

        .modal-box { 
            background: #080808; 
            border: 1px solid #151515; 
            border-radius: 20px; 
            padding: 40px; 
            width: 440px; 
            animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
            box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .modal-header h3 { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .modal-header button { color: #333; padding: 4px; border-radius: 8px; transition: all 0.2s; }
        .modal-header button:hover { color: #fff; background: #111; }

        .unlock-text { color: #444; font-size: 0.875rem; margin-bottom: 24px; font-weight: 500; }
        .form-group { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.75rem; font-weight: 800; color: #333; text-transform: uppercase; letter-spacing: 0.1em; }

        .form-group input[type="text"], .form-group input[type="password"] { 
            width: 100%; 
            padding: 12px 16px; 
            background: #050505; 
            border: 1px solid #151515; 
            border-radius: 10px; 
            color: #fff; 
            font-size: 0.9375rem; 
            outline: none; 
            transition: all 0.2s; 
            font-weight: 500;
        }

        .form-group input:focus { border-color: #333; background: #080808; }

        .checkbox-group label { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            cursor: pointer; 
            font-size: 0.875rem; 
            color: #555; 
            font-weight: 700;
        }

        .checkbox-group input[type="checkbox"] { 
            width: 18px; 
            height: 18px; 
            accent-color: #fff; 
            border: 2px solid #151515;
            background: #050505;
        }

        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
        .primary-btn { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 10px 24px; 
            background: #fff; 
            color: #000; 
            border-radius: 10px; 
            font-weight: 800; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }

        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,255,255,0.2); }

        .secondary-btn { 
            padding: 10px 24px; 
            background: transparent; 
            border: 1px solid #1a1a1a; 
            color: #444; 
            border-radius: 10px; 
            font-size: 0.875rem; 
            font-weight: 700;
            transition: all 0.2s; 
        }

        .secondary-btn:hover { border-color: #333; color: #888; }

        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
            .notepad-container { margin: 16px; height: calc(100vh - 32px); }
            .notes-sidebar { width: 280px; }
            .sidebar-header { padding: 20px; }
            .editor-header { padding: 20px 30px; }
            .content-area { padding: 30px; }
        }

        @media (max-width: 768px) {
            .notepad-container { 
                margin: 12px; 
                height: calc(100vh - 24px); 
                flex-direction: column; 
                border-radius: 16px;
            }
            .notes-sidebar { 
                width: 100%; 
                max-height: 45vh; 
                border-right: none; 
                border-bottom: 1px solid #151515; 
            }
            .sidebar-header { padding: 16px; }
            .search-box { padding: 8px 12px; }
            .notes-list { padding: 8px; }
            .note-item { padding: 12px 16px; }
            .note-item h4 { font-size: 0.8rem; }
            .note-editor { flex: 1; }
            .editor-header { padding: 16px 20px; flex-wrap: wrap; gap: 12px; }
            .title-input { font-size: 1.25rem; width: 100%; }
            .editor-actions { width: 100%; justify-content: flex-end; }
            .content-area { padding: 20px; font-size: 1rem; }
            .modal-box { width: 95vw; padding: 24px; border-radius: 16px; }
            .modal-header { margin-bottom: 24px; }
            .save-btn { padding: 8px 16px; font-size: 0.8rem; }
            .save-btn span { display: none; }
        }

        @media (max-width: 480px) {
            .notepad-container { margin: 8px; height: calc(100vh - 16px); border-radius: 12px; }
            .notes-sidebar { max-height: 40vh; }
            .sidebar-header { padding: 12px; gap: 8px; }
            .add-note-btn { width: 36px; height: 36px; }
            .note-item { padding: 10px 12px; }
            .editor-header { padding: 12px 16px; }
            .title-input { font-size: 1.1rem; }
            .content-area { padding: 16px; font-size: 0.9375rem; line-height: 1.8; }
            .empty-state p { font-size: 0.8rem; letter-spacing: 0.1em; }
            .empty-state button { padding: 10px 20px; font-size: 0.8rem; }
            .modal-box { padding: 20px; }
        }
      `}</style>
        </div>
    );
}
