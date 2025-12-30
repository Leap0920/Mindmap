"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';

interface JournalEntry {
    _id: string;
    title: string;
    content: string;
    mood?: string;
    date: string;
    tags: string[];
}

const MOODS = ['😊 Happy', '😐 Neutral', '😔 Sad', '😤 Frustrated', '🤔 Thoughtful', '😴 Tired', '🔥 Motivated'];

export default function JournalPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [date, setDate] = useState(new Date());
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fetchEntry = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const res = await fetch(`/api/notes?type=journal&date=${dateStr}`);
            const data = await res.json();
            if (data.notes?.length > 0) {
                const existingEntry = data.notes[0];
                setEntry(existingEntry);
                setContent(existingEntry.content);
                setMood(existingEntry.mood || '');
            } else {
                setEntry(null);
                setContent('');
                setMood('');
            }
        } catch (error) {
            console.error('Error fetching entry:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session, date]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchEntry();
        }
    }, [status, router, fetchEntry]);

    const saveEntry = async () => {
        setIsSaving(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            if (entry) {
                // Update existing
                await fetch('/api/notes', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: entry._id,
                        content,
                        mood,
                    }),
                });
            } else {
                // Create new
                const res = await fetch('/api/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: `Journal - ${formattedDate}`,
                        content,
                        mood,
                        type: 'journal',
                        date: dateStr,
                    }),
                });
                const data = await res.json();
                setEntry(data.note);
            }
            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving entry:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const changeDate = (delta: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + delta);
        setDate(newDate);
    };

    const goToToday = () => {
        setDate(new Date());
    };

    const wordCount = content.trim().split(/\s+/).filter(x => x).length;

    if (status === 'loading') {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Loading journal...</span>
                <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: #555; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="journal-page">
            <header className="journal-header">
                <div className="header-left">
                    <div className="type-badge">Personal Journal</div>
                    <h1 className="text-gradient">Daily Reflection</h1>
                </div>

                <div className="date-controller glass-panel">
                    <button className="nav-btn" onClick={() => changeDate(-1)}><ChevronLeft size={18} /></button>
                    <div className="current-date" onClick={goToToday}>
                        <CalendarIcon size={16} />
                        <span>{formattedDate}</span>
                    </div>
                    <button className="nav-btn" onClick={() => changeDate(1)}><ChevronRight size={18} /></button>
                </div>

                <div className="header-actions">
                    <button className="save-btn" onClick={saveEntry} disabled={isSaving}>
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="loading-editor">
                    <Loader2 size={24} className="animate-spin" />
                </div>
            ) : (
                <div className="editor-container premium-card glass-panel">
                    <div className="editor-top">
                        <div className="mood-selector">
                            <Sparkles size={16} className="text-muted" />
                            <select value={mood} onChange={e => setMood(e.target.value)}>
                                <option value="">How are you feeling?</option>
                                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="word-count">{wordCount} words</div>
                    </div>

                    <textarea
                        placeholder="Release your thoughts into the void..."
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="journal-field"
                    />

                    <div className="editor-footer">
                        <div className="tags">#reflection #productivity #mindset</div>
                        {lastSaved && (
                            <div className="auto-save">
                                Last saved: {lastSaved.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
        .journal-page { max-width: 820px; margin: 0 auto; padding: 1.5rem; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .journal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .type-badge { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: #555; letter-spacing: 0.1em; margin-bottom: 0.375rem; }
        .header-left h1 { font-size: 1.75rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .date-controller { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem; background: #0a0a0a; border: 1px solid #181818; border-radius: 10px; }
        .nav-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 6px; color: #666; transition: all 0.15s; }
        .nav-btn:hover { background: #151515; color: #fff; }
        .current-date { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.75rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; border-radius: 6px; color: #999; transition: all 0.15s; }
        .current-date:hover { background: #0f0f0f; color: #fff; }
        .save-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #fff; color: #000; font-weight: 600; border-radius: 8px; font-size: 0.8125rem; transition: all 0.15s; }
        .save-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .loading-editor { display: flex; align-items: center; justify-content: center; min-height: 400px; color: #444; }
        .editor-container { background: #0a0a0a; border: 1px solid #181818; padding: 1.5rem; border-radius: 14px; display: flex; flex-direction: column; min-height: 450px; }
        .editor-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.875rem; border-bottom: 1px solid #151515; }
        .mood-selector { display: flex; align-items: center; gap: 0.5rem; }
        .mood-selector select { background: #080808; border: 1px solid #1f1f1f; border-radius: 8px; padding: 0.5rem 0.875rem; color: #fff; font-size: 0.8125rem; outline: none; transition: border-color 0.15s; }
        .mood-selector select:focus { border-color: #333; }
        .text-muted { color: #555; }
        .word-count { font-size: 0.75rem; color: #555; background: #111; padding: 0.25rem 0.625rem; border-radius: 4px; }
        .journal-field { flex: 1; background: none; border: none; resize: none; font-size: 1rem; line-height: 1.9; color: #eee; font-family: inherit; outline: none; }
        .journal-field::placeholder { color: #333; }
        .editor-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; padding-top: 0.875rem; border-top: 1px solid #151515; }
        .tags { font-size: 0.75rem; color: #444; }
        .auto-save { font-size: 0.6875rem; color: #444; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .journal-header { flex-direction: column; align-items: flex-start; }
          .header-left h1 { font-size: 1.5rem; }
          .editor-container { padding: 1.25rem; }
        }
      `}</style>
        </div>
    );
}
