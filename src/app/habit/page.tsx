"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalIcon, Check, Flame, Loader2 } from 'lucide-react';

interface HabitDefinition {
    _id: string;
    name: string;
    icon?: string;
    color: string;
}

interface HabitEntry {
    habitId: string;
    name: string;
    completed: boolean;
}

interface HabitDay {
    _id: string;
    date: string;
    entries: HabitEntry[];
}

export default function HabitPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [definitions, setDefinitions] = useState<HabitDefinition[]>([]);
    const [habitDays, setHabitDays] = useState<HabitDay[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newHabitName, setNewHabitName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const today = new Date();

    const fetchHabits = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            const res = await fetch(`/api/habits?month=${month}&year=${year}`);
            const data = await res.json();
            setDefinitions(data.definitions || []);
            setHabitDays(data.habitDays || []);
        } catch (error) {
            console.error('Error fetching habits:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session, currentDate]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchHabits();
        }
    }, [status, router, fetchHabits]);

    const toggleHabit = async (date: Date, habitId: string, currentCompleted: boolean) => {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const res = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggleHabit',
                    date: dateStr,
                    habitId,
                    completed: !currentCompleted,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setHabitDays(prev => {
                    const existing = prev.findIndex(hd =>
                        new Date(hd.date).toDateString() === date.toDateString()
                    );
                    if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = data.habitDay;
                        return updated;
                    }
                    return [...prev, data.habitDay];
                });
            }
        } catch (error) {
            console.error('Error toggling habit:', error);
        }
    };

    const addHabit = async () => {
        if (!newHabitName.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'createDefinition',
                    name: newHabitName,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setDefinitions(prev => [...prev, data.definition]);
                setNewHabitName('');
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error adding habit:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteHabit = async (habitId: string) => {
        try {
            await fetch('/api/habits', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitId }),
            });
            setDefinitions(prev => prev.filter(d => d._id !== habitId));
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    const getHabitStatus = (date: Date, habitId: string): boolean => {
        const habitDay = habitDays.find(hd =>
            new Date(hd.date).toDateString() === date.toDateString()
        );
        if (!habitDay) return false;
        const entry = habitDay.entries.find(e => e.habitId === habitId);
        return entry?.completed || false;
    };

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Loading habits...</span>
                <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 1rem;
            color: var(--text-muted);
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="habit-page">
            <header className="page-header">
                <div className="title-section">
                    <div className="breadcrumb">Workspace / Productivity</div>
                    <h1 className="text-gradient">Habit Journey</h1>
                    <p>Small steps lead to big change.</p>
                </div>

                <div className="header-actions">
                    <button className="primary-btn" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        <span>Add Habit</span>
                    </button>
                </div>
            </header>

            {definitions.length > 0 && (
                <div className="habit-definitions">
                    <span className="def-label">Tracking:</span>
                    {definitions.map(def => (
                        <div key={def._id} className="habit-tag">
                            <span>{def.name}</span>
                            <button onClick={() => deleteHabit(def._id)}><X size={12} /></button>
                        </div>
                    ))}
                </div>
            )}

            <section className="calendar-container glass-panel">
                <div className="calendar-toolbar">
                    <div className="month-picker">
                        <button className="nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                        <div className="current-month">
                            <CalIcon size={18} className="text-muted" />
                            <span>{monthName} {currentYear}</span>
                        </div>
                        <button className="nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                    </div>
                    <button className="secondary-btn" onClick={goToToday}>Today</button>
                </div>

                <div className="weekday-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="weekday">{d}</div>
                    ))}
                </div>

                <div className="calendar-grid">
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const cellDate = new Date(currentYear, currentDate.getMonth(), i + 1);
                        const isToday = cellDate.toDateString() === today.toDateString();
                        const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
                        const allCompleted = definitions.length > 0 && definitions.every(def => getHabitStatus(cellDate, def._id));

                        return (
                            <div key={i} className={`habit-card ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
                                <div className="card-top">
                                    <div className="day-info">
                                        <span className="num">{i + 1}</span>
                                        <span className="label">{cellDate.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    </div>
                                    {isToday && <div className="today-badge">Today</div>}
                                </div>

                                <div className="habit-items">
                                    {definitions.map(def => {
                                        const completed = getHabitStatus(cellDate, def._id);
                                        return (
                                            <div
                                                key={def._id}
                                                className={`habit-row ${completed ? 'done' : ''}`}
                                                onClick={() => toggleHabit(cellDate, def._id, completed)}
                                            >
                                                <div className="check-box">
                                                    {completed && <Check size={10} strokeWidth={4} />}
                                                </div>
                                                <span className="name">{def.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {allCompleted && definitions.length > 0 && (
                                    <div className="perfect-day">
                                        <Flame size={12} fill="currentColor" />
                                        <span>Perfect</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>Add New Habit</h3>
                        <input
                            type="text"
                            placeholder="e.g., Reading, Exercise, Meditation"
                            value={newHabitName}
                            onChange={e => setNewHabitName(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={addHabit} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Add Habit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .habit-page { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
        .breadcrumb { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-header p { color: var(--text-muted); }
        .header-actions { display: flex; gap: 0.75rem; }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); font-weight: 600; border-radius: 10px; }
        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,255,255,0.1); }
        .secondary-btn { padding: 0.6rem 1rem; background: transparent; border: 1px solid var(--border-main); color: var(--text-secondary); border-radius: 8px; font-weight: 500; }
        .secondary-btn:hover { background: rgba(255,255,255,0.05); }
        .habit-definitions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .def-label { font-size: 0.85rem; color: var(--text-muted); }
        .habit-tag { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-main); border-radius: 20px; font-size: 0.85rem; }
        .habit-tag button { display: flex; padding: 2px; color: var(--text-dim); transition: color 0.2s; }
        .habit-tag button:hover { color: #ff4444; }
        .calendar-container { padding: 1.5rem; border-radius: 16px; }
        .calendar-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .month-picker { display: flex; align-items: center; gap: 1rem; }
        .nav-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; color: var(--text-secondary); background: rgba(255,255,255,0.05); }
        .nav-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
        .current-month { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 600; }
        .weekday-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; margin-bottom: 0.5rem; }
        .weekday { text-align: center; font-size: 0.75rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; padding: 0.5rem; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; border: 1px solid var(--border-dim); border-radius: 12px; overflow: hidden; }
        .habit-card { padding: 1rem; min-height: 140px; display: flex; flex-direction: column; gap: 0.75rem; background: var(--bg-deep); border-bottom: 1px solid var(--border-dim); border-right: 1px solid var(--border-dim); transition: background 0.2s; }
        .habit-card:hover { background: rgba(255,255,255,0.02); }
        .today { background: rgba(255,255,255,0.03); box-shadow: inset 0 0 0 1px var(--border-main); }
        .weekend .num { color: var(--text-dim); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .day-info { display: flex; flex-direction: column; }
        .day-info .num { font-size: 1.25rem; font-weight: 700; line-height: 1; }
        .day-info .label { font-size: 0.7rem; color: var(--text-dim); margin-top: 2px; }
        .today-badge { font-size: 0.6rem; font-weight: 700; padding: 0.15rem 0.4rem; background: var(--text-primary); color: var(--bg-deep); border-radius: 4px; text-transform: uppercase; }
        .habit-items { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .habit-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
        .habit-row:hover { background: rgba(255,255,255,0.05); }
        .check-box { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--border-bright); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .habit-row.done .check-box { background: var(--text-primary); border-color: var(--text-primary); color: var(--bg-deep); }
        .habit-row .name { font-size: 0.75rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .habit-row.done .name { text-decoration: line-through; color: var(--text-dim); }
        .perfect-day { display: flex; align-items: center; gap: 0.25rem; font-size: 0.65rem; font-weight: 700; color: #fbbf24; margin-top: auto; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 2rem; width: 90%; max-width: 400px; }
        .modal-box h3 { font-size: 1.25rem; margin-bottom: 1rem; }
        .modal-box input { width: 100%; padding: 0.75rem 1rem; background: var(--bg-deep); border: 1px solid var(--border-main); border-radius: 10px; color: var(--text-primary); margin-bottom: 1.5rem; }
        .modal-box input:focus { border-color: var(--border-bright); outline: none; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 900px) {
          .calendar-grid { grid-template-columns: repeat(4, 1fr); }
          .weekday-header { display: none; }
        }
        @media (max-width: 600px) {
          .calendar-grid { grid-template-columns: repeat(2, 1fr); }
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        }
      `}</style>
        </div>
    );
}
