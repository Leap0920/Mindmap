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
        .journal-page { 
            max-width: 900px; 
            margin: 0 auto; 
            padding: 48px 24px; 
            animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        
        @keyframes fadeUp { 
            from { opacity: 0; transform: translateY(16px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .journal-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-bottom: 48px; 
            flex-wrap: wrap; 
            gap: 24px; 
        }

        .type-badge { 
            font-size: 0.75rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            color: #444; 
            letter-spacing: 0.15em; 
            margin-bottom: 8px; 
            display: block;
        }

        .header-left h1 { 
            font-size: 2.5rem; 
            font-weight: 800; 
            color: #fff; 
            letter-spacing: -0.04em; 
            margin: 0;
        }

        .date-controller { 
            display: flex; 
            align-items: center; 
            gap: 6px; 
            padding: 6px; 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            border-radius: 12px; 
        }

        .nav-btn { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            width: 36px; 
            height: 36px; 
            border-radius: 8px; 
            color: #444; 
            transition: all 0.2s; 
        }

        .nav-btn:hover { 
            background: #151515; 
            color: #fff; 
        }

        .current-date { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 6px 16px; 
            font-size: 0.875rem; 
            font-weight: 700; 
            cursor: pointer; 
            border-radius: 8px; 
            color: #888; 
            transition: all 0.2s; 
        }

        .current-date:hover { 
            background: #111; 
            color: #fff; 
        }

        .save-btn { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 12px 24px; 
            background: #fff; 
            color: #000; 
            font-weight: 800; 
            border-radius: 10px; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .save-btn:hover:not(:disabled) { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 24px rgba(255,255,255,0.2);
        }

        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .loading-editor { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 500px; 
            color: #222; 
        }

        .editor-container { 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            padding: 40px; 
            border-radius: 20px; 
            display: flex; 
            flex-direction: column; 
            min-height: 550px; 
            transition: all 0.3s ease;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .editor-top { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 32px; 
            padding-bottom: 24px; 
            border-bottom: 1px solid #151515; 
        }

        .mood-selector { display: flex; align-items: center; gap: 12px; }
        .mood-selector select { 
            background: #050505; 
            border: 1px solid #151515; 
            border-radius: 10px; 
            padding: 10px 16px; 
            color: #fff; 
            font-size: 0.875rem; 
            outline: none; 
            transition: all 0.2s; 
            font-weight: 600;
        }

        .mood-selector select:focus { border-color: #333; }
        .text-muted { color: #333; }

        .word-count { 
            font-size: 0.75rem; 
            color: #555; 
            background: #151515; 
            padding: 4px 12px; 
            border-radius: 6px; 
            font-weight: 800;
        }

        .journal-field { 
            flex: 1; 
            background: none; 
            border: none; 
            resize: none; 
            font-size: 1.125rem; 
            line-height: 1.9; 
            color: #aaa; 
            font-family: inherit; 
            outline: none; 
            font-weight: 400;
        }

        .journal-field::placeholder { color: #1a1a1a; }

        .editor-footer { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-top: 32px; 
            padding-top: 24px; 
            border-top: 1px solid #151515; 
        }

        .tags { 
            font-size: 0.75rem; 
            color: #333; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .auto-save { 
            font-size: 0.6875rem; 
            color: #333; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }

        @media (max-width: 1024px) {
            .journal-page { padding: 40px 24px; }
            .editor-container { padding: 32px; }
        }

        @media (max-width: 768px) {
            .journal-page { padding: 24px 16px; }
            .journal-header { flex-direction: column; align-items: flex-start; gap: 20px; }
            .header-left h1 { font-size: 1.75rem; }
            .type-badge { font-size: 0.65rem; }
            .date-controller { width: 100%; justify-content: center; }
            .header-actions { width: 100%; }
            .save-btn { width: 100%; justify-content: center; }
            .editor-container { padding: 20px; min-height: 450px; border-radius: 16px; }
            .editor-top { flex-direction: column; gap: 16px; align-items: stretch; }
            .mood-selector { justify-content: center; }
            .mood-selector select { width: 100%; }
            .word-count { text-align: center; }
            .journal-field { font-size: 1rem; }
            .editor-footer { flex-direction: column; gap: 16px; text-align: center; }
        }

        @media (max-width: 480px) {
            .journal-page { padding: 16px 12px; }
            .header-left h1 { font-size: 1.5rem; }
            .current-date span { font-size: 0.75rem; }
            .nav-btn { width: 32px; height: 32px; }
            .editor-container { padding: 16px; min-height: 400px; }
            .journal-field { font-size: 0.9375rem; line-height: 1.8; }
            .save-btn { padding: 10px 20px; font-size: 0.8rem; }
        }
      `}</style>
        </div>
    );
}
