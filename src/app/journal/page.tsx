"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen, Calendar as CalendarIcon, Save, ChevronLeft, ChevronRight, Loader2, Sparkles, FileText, List, Edit3 } from 'lucide-react';

interface JournalEntry {
    _id: string;
    title: string;
    content: string;
    mood?: string;
    date: string;
    tags: string[];
    updatedAt?: string;
    createdAt?: string;
}

interface MonthArchive {
    monthKey: string; // "2025-12"
    monthLabel: string; // "December 2025"
    lastModified: Date;
    entryCount: number;
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
    const [viewMode, setViewMode] = useState<'entry' | 'archive'>('archive');
    const [monthArchives, setMonthArchives] = useState<MonthArchive[]>([]);
    const [isLoadingArchive, setIsLoadingArchive] = useState(false);

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Fetch all journal entries and group by month
    const fetchMonthArchives = useCallback(async () => {
        if (!session) return;
        setIsLoadingArchive(true);
        try {
            const res = await fetch('/api/notes?type=journal');
            const data = await res.json();
            const entries: JournalEntry[] = data.notes || [];

            // Group entries by month
            const monthMap = new Map<string, { entries: JournalEntry[], lastModified: Date }>();

            entries.forEach((entry) => {
                const entryDate = new Date(entry.date);
                const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
                const monthLabel = entryDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                const existing = monthMap.get(monthKey);
                const entryUpdated = new Date(entry.updatedAt || entry.createdAt || entry.date);

                if (existing) {
                    existing.entries.push(entry);
                    if (entryUpdated > existing.lastModified) {
                        existing.lastModified = entryUpdated;
                    }
                } else {
                    monthMap.set(monthKey, {
                        entries: [entry],
                        lastModified: entryUpdated
                    });
                }
            });

            // Convert to array and sort by date (newest first)
            const archives: MonthArchive[] = Array.from(monthMap.entries()).map(([monthKey, data]) => {
                const [year, month] = monthKey.split('-');
                const monthLabel = new Date(parseInt(year), parseInt(month) - 1, 1)
                    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return {
                    monthKey,
                    monthLabel,
                    lastModified: data.lastModified,
                    entryCount: data.entries.length
                };
            }).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

            setMonthArchives(archives);
        } catch (error) {
            console.error('Error fetching archives:', error);
        } finally {
            setIsLoadingArchive(false);
        }
    }, [session]);

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
            fetchMonthArchives();
            if (viewMode === 'entry') {
                fetchEntry();
            }
        }
    }, [status, router, fetchMonthArchives, fetchEntry, viewMode]);

    // Open a specific month (goes to first day of that month)
    const openMonth = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        setDate(new Date(parseInt(year), parseInt(month) - 1, 1));
        setViewMode('entry');
    };

    // Format timestamp like Notion
    const formatTimestamp = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

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
                    <h1 className="text-gradient">
                        {viewMode === 'archive' ? 'Monthly Archive' : 'Daily Reflection'}
                    </h1>
                </div>

                <div className="header-center">
                    {/* View Mode Toggle */}
                    <div className="view-toggle glass-panel">
                        <button
                            className={`toggle-btn ${viewMode === 'archive' ? 'active' : ''}`}
                            onClick={() => setViewMode('archive')}
                        >
                            <List size={16} />
                            <span>Archive</span>
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'entry' ? 'active' : ''}`}
                            onClick={() => setViewMode('entry')}
                        >
                            <Edit3 size={16} />
                            <span>Entry</span>
                        </button>
                    </div>
                </div>

                {viewMode === 'entry' && (
                    <>
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
                    </>
                )}
            </header>

            {/* Archive View */}
            {viewMode === 'archive' && (
                <div className="archive-container">
                    {isLoadingArchive ? (
                        <div className="loading-editor">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                    ) : monthArchives.length === 0 ? (
                        <div className="empty-archive">
                            <FileText size={48} />
                            <h3>No Journal Entries Yet</h3>
                            <p>Start writing your first entry to see your monthly archive.</p>
                            <button className="start-btn" onClick={() => setViewMode('entry')}>
                                <Edit3 size={18} />
                                <span>Write First Entry</span>
                            </button>
                        </div>
                    ) : (
                        <div className="archive-list">
                            {monthArchives.map((archive) => (
                                <div key={archive.monthKey} className="archive-row">
                                    <div className="archive-icon">
                                        <FileText size={18} />
                                    </div>
                                    <div className="archive-info">
                                        <span className="archive-month">{archive.monthLabel}</span>
                                        <span className="archive-count">{archive.entryCount} {archive.entryCount === 1 ? 'entry' : 'entries'}</span>
                                    </div>
                                    <button
                                        className="archive-open-btn"
                                        onClick={() => openMonth(archive.monthKey)}
                                    >
                                        Open
                                    </button>
                                    <span className="archive-timestamp">
                                        {formatTimestamp(archive.lastModified)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Entry View */}
            {viewMode === 'entry' && (
                <>
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
                </>
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

        /* View Toggle Styles */
        .header-center {
            display: flex;
            align-items: center;
        }

        .view-toggle {
            display: flex;
            gap: 4px;
            padding: 4px;
            background: #0a0a0a;
            border: 1px solid #151515;
            border-radius: 12px;
        }

        .toggle-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 0.8125rem;
            font-weight: 700;
            color: #555;
            transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .toggle-btn:hover {
            color: #888;
            background: rgba(255,255,255,0.03);
        }

        .toggle-btn.active {
            background: #fff;
            color: #000;
        }

        /* Archive Container Styles */
        .archive-container {
            background: #0a0a0a;
            border: 1px solid #151515;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .archive-list {
            display: flex;
            flex-direction: column;
        }

        .archive-row {
            display: grid;
            grid-template-columns: 40px 1fr auto auto;
            align-items: center;
            gap: 16px;
            padding: 14px 20px;
            border-bottom: 1px solid #1a1a1a;
            transition: background 0.15s ease;
        }

        .archive-row:last-child {
            border-bottom: none;
        }

        .archive-row:hover {
            background: rgba(255,255,255,0.02);
        }

        .archive-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            color: #555;
        }

        .archive-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .archive-month {
            font-size: 0.9375rem;
            font-weight: 600;
            color: #fff;
        }

        .archive-count {
            font-size: 0.6875rem;
            color: #444;
            font-weight: 500;
        }

        .archive-open-btn {
            padding: 6px 16px;
            background: transparent;
            border: 1px solid #2a5a3a;
            border-radius: 6px;
            color: #4a9a5a;
            font-size: 0.75rem;
            font-weight: 700;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .archive-open-btn:hover {
            background: rgba(42, 90, 58, 0.2);
            border-color: #4a9a5a;
        }

        .archive-timestamp {
            font-size: 0.75rem;
            color: #555;
            font-weight: 500;
            min-width: 180px;
            text-align: right;
        }

        /* Empty Archive State */
        .empty-archive {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 80px 40px;
            color: #444;
            text-align: center;
        }

        .empty-archive h3 {
            margin: 24px 0 8px;
            font-size: 1.25rem;
            font-weight: 700;
            color: #666;
        }

        .empty-archive p {
            margin: 0 0 32px;
            font-size: 0.875rem;
            color: #444;
        }

        .start-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 24px;
            background: #fff;
            color: #000;
            font-weight: 700;
            border-radius: 10px;
            font-size: 0.875rem;
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .start-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255,255,255,0.2);
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }

        @media (max-width: 1024px) {
            .journal-page { padding: 40px 24px; }
            .editor-container { padding: 32px; }
            .archive-timestamp { min-width: 160px; }
        }

        @media (max-width: 768px) {
            .journal-page { padding: 24px 16px; }
            .journal-header { flex-direction: column; align-items: flex-start; gap: 20px; }
            .header-left h1 { font-size: 1.75rem; }
            .type-badge { font-size: 0.65rem; }
            .header-center { width: 100%; }
            .view-toggle { width: 100%; justify-content: center; }
            .toggle-btn { flex: 1; justify-content: center; }
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
            
            /* Archive responsive */
            .archive-row {
                grid-template-columns: 32px 1fr auto;
                gap: 12px;
                padding: 12px 16px;
            }
            .archive-timestamp { display: none; }
            .archive-month { font-size: 0.875rem; }
        }

        @media (max-width: 480px) {
            .journal-page { padding: 16px 12px; }
            .header-left h1 { font-size: 1.5rem; }
            .current-date span { font-size: 0.75rem; }
            .nav-btn { width: 32px; height: 32px; }
            .editor-container { padding: 16px; min-height: 400px; }
            .journal-field { font-size: 0.9375rem; line-height: 1.8; }
            .save-btn { padding: 10px 20px; font-size: 0.8rem; }
            .toggle-btn { padding: 8px 12px; font-size: 0.75rem; }
            .toggle-btn span { display: none; }
            
            /* Archive responsive */
            .archive-row {
                grid-template-columns: 28px 1fr auto;
                gap: 10px;
                padding: 10px 12px;
            }
            .archive-open-btn { padding: 5px 12px; font-size: 0.7rem; }
            .empty-archive { padding: 60px 24px; }
            .empty-archive h3 { font-size: 1.1rem; }
        }
      `}</style>
        </div>
    );
}
