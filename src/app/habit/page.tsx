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
                <Loader2 size={32} className="spinner" />
                <style jsx>{`
          .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 80vh; }
          .spinner { animation: spin 1s linear infinite; color: #444; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    return (
        <div className="habit-page">
            <header className="page-header">
                <div className="title-section">
                    <span className="breadcrumb">Productivity / Habits</span>
                    <h1>Journey</h1>
                    <p>Small consistent steps.</p>
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
                    {definitions.map(def => (
                        <div key={def._id} className="habit-tag">
                            <span>{def.name}</span>
                            <button onClick={() => deleteHabit(def._id)}><X size={12} /></button>
                        </div>
                    ))}
                </div>
            )}

            <section className="calendar-container">
                <div className="calendar-toolbar">
                    <div className="month-picker">
                        <button className="nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
                        <div className="current-month">
                            <span>{monthName} {currentYear}</span>
                        </div>
                        <button className="nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
                    </div>
                    <button className="today-btn" onClick={goToToday}>Today</button>
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
                        const allCompleted = definitions.length > 0 && definitions.every(def => getHabitStatus(cellDate, def._id));

                        return (
                            <div key={i} className={`day-card ${isToday ? 'is-today' : ''}`}>
                                <div className="card-header">
                                    <span className="day-num">{i + 1}</span>
                                    {allCompleted && definitions.length > 0 && <Flame size={12} className="flame-icon" />}
                                </div>

                                <div className="habit-dots">
                                    {definitions.map(def => {
                                        const completed = getHabitStatus(cellDate, def._id);
                                        return (
                                            <div
                                                key={def._id}
                                                className={`habit-dot ${completed ? 'done' : ''}`}
                                                onClick={() => toggleHabit(cellDate, def._id, completed)}
                                                title={def.name}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>New Habit</h3>
                        <input
                            type="text"
                            placeholder="Habit name..."
                            value={newHabitName}
                            onChange={e => setNewHabitName(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="confirm-btn" onClick={addHabit} disabled={isSaving}>
                                {isSaving ? '...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .habit-page { max-width: 960px; margin: 0 auto; padding: 1.5rem; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
        .breadcrumb { font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0.25rem 0; color: #fff; letter-spacing: -0.02em; }
        .page-header p { color: #666; font-size: 0.875rem; }

        .primary-btn { background: #fff; color: #000; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; transition: all 0.15s ease; }
        .primary-btn:hover { transform: translateY(-1px); }
        
        .habit-definitions { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .habit-tag { background: #0f0f0f; border: 1px solid #1f1f1f; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; gap: 0.5rem; color: #999; }
        .habit-tag button { color: #555; padding: 2px; }
        .habit-tag button:hover { color: #fff; }

        .calendar-container { background: #0a0a0a; border: 1px solid #181818; border-radius: 14px; padding: 1.25rem; }
        .calendar-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
        .month-picker { display: flex; align-items: center; gap: 1rem; }
        .nav-btn { color: #666; padding: 0.25rem; border-radius: 6px; transition: all 0.15s; }
        .nav-btn:hover { color: #fff; background: #151515; }
        .current-month { font-weight: 600; font-size: 0.9375rem; color: #fff; }
        .today-btn { font-size: 0.8rem; color: #666; border: 1px solid #1f1f1f; padding: 0.375rem 0.75rem; border-radius: 6px; transition: all 0.15s; }
        .today-btn:hover { color: #fff; border-color: #333; }

        .weekday-header { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 0.75rem; }
        .weekday { text-align: center; font-size: 0.6875rem; font-weight: 600; color: #555; text-transform: uppercase; }

        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #151515; border: 1px solid #181818; border-radius: 10px; overflow: hidden; }
        .day-card { background: #0a0a0a; min-height: 90px; padding: 0.625rem; display: flex; flex-direction: column; gap: 0.5rem; transition: background 0.15s; }
        .day-card:hover { background: #0e0e0e; }
        .day-card.is-today { background: #0f0f0f; }
        
        .card-header { display: flex; justify-content: space-between; align-items: center; }
        .day-num { font-size: 0.8rem; font-weight: 500; color: #666; }
        .is-today .day-num { color: #fff; font-weight: 600; }
        .flame-icon { color: #f59e0b; }

        .habit-dots { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; align-content: flex-start; }
        .habit-dot { width: 100%; height: 5px; background: #1a1a1a; border-radius: 2px; cursor: pointer; transition: all 0.15s; }
        .habit-dot:hover { background: #252525; }
        .habit-dot.done { background: #10b981; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #0f0f0f; border: 1px solid #1f1f1f; padding: 1.5rem; border-radius: 14px; width: 340px; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-box h3 { margin-bottom: 1rem; font-size: 1rem; color: #fff; }
        .modal-box input { width: 100%; background: #080808; border: 1px solid #1f1f1f; padding: 0.625rem 0.875rem; border-radius: 8px; color: #fff; margin-bottom: 1.25rem; outline: none; font-size: 0.875rem; }
        .modal-box input:focus { border-color: #333; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
        .cancel-btn { color: #666; font-size: 0.8125rem; padding: 0.5rem 1rem; }
        .cancel-btn:hover { color: #999; }
        .confirm-btn { background: #fff; color: #000; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.8125rem; }
      `}</style>
        </div>
    );
}
