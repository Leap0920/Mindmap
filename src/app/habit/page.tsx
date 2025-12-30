"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    X,
    Calendar as CalIcon,
    Check,
    Loader2,
    MoreHorizontal,
    Filter,
    ArrowUpDown,
    Zap,
    Search,
    Maximize2,
    CheckCircle2,
    CalendarDays,
    PenTool
} from 'lucide-react';

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
    const [showDefModal, setShowDefModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [newHabitName, setNewHabitName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingDef, setEditingDef] = useState<HabitDefinition | null>(null);

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
            // Adjust to local date string to avoid timezone issues
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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

    const saveHabitDefinition = async () => {
        if (!newHabitName.trim()) return;
        setIsSaving(true);
        try {
            const action = editingDef ? 'updateDefinition' : 'createDefinition';
            const body = editingDef
                ? { action, habitId: editingDef._id, name: newHabitName }
                : { action, name: newHabitName };

            const res = await fetch('/api/habits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                if (editingDef) {
                    setDefinitions(prev => prev.map(d => d._id === editingDef._id ? data.definition : d));
                } else {
                    setDefinitions(prev => [...prev, data.definition]);
                }
                setNewHabitName('');
                setEditingDef(null);
                setShowDefModal(false);
            }
        } catch (error) {
            console.error('Error saving habit:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteHabitDefinition = async (habitId: string) => {
        if (!confirm('Are you sure you want to delete this habit? History will be kept but it will no longer appear in new days.')) return;
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

    // Calendar logic
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];

        // Prev month days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                currentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({
                date: new Date(year, month, i),
                currentMonth: true
            });
        }

        // Next month days to fill 6 rows (42 cells)
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                currentMonth: false
            });
        }

        return days;
    }, [currentDate]);

    if (status === 'loading') {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="spinner" />
            </div>
        );
    }

    return (
        <div className="habit-workspace">
            {/* Calendar Controls */}
            <div className="calendar-nav">
                <div className="month-display">
                    <h2>{monthName} {currentYear}</h2>
                </div>
                <div className="nav-actions">
                    <div className="step-controls">
                        <button className="nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                        <button className="today-txt" onClick={goToToday}>Today</button>
                        <button className="nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                    </div>
                    <button className="new-btn" onClick={() => setShowDefModal(true)}>
                        New Habit <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-board">
                <div className="grid-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="header-cell">{d}</div>
                    ))}
                </div>
                <div className="grid-body">
                    {calendarDays.map((day, idx) => {
                        const isToday = day.date.toDateString() === today.toDateString();

                        // Check if this day has any completed habits
                        const habitDay = habitDays.find(hd =>
                            new Date(hd.date).toDateString() === day.date.toDateString()
                        );
                        const hasCompleted = habitDay?.entries.some(e => e.completed) || false;

                        return (
                            <div
                                key={idx}
                                className={`calendar-cell ${!day.currentMonth ? 'off-month' : ''} ${isToday ? 'is-today' : ''}`}
                                onClick={() => setSelectedDay(day.date)}
                            >
                                <div className="cell-header">
                                    <span className="day-number">{day.date.getDate()}</span>
                                </div>

                                {hasCompleted && day.currentMonth && (
                                    <div className="habit-card">
                                        <div className="habit-card-header">
                                            <div className="status-box">
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                            </div>
                                            <span className="card-title">Daily Habits</span>
                                        </div>
                                        <div className="habit-mini-list">
                                            {habitDay?.entries.filter(e => e.completed).slice(0, 3).map(entry => (
                                                <div key={entry.habitId} className="mini-item">
                                                    <div className="mini-check checked">
                                                        <Check size={8} strokeWidth={4} />
                                                    </div>
                                                    <span>{entry.name}</span>
                                                </div>
                                            ))}
                                            {(habitDay?.entries.filter(e => e.completed).length || 0) > 3 && (
                                                <div className="more-count">+{(habitDay?.entries.filter(e => e.completed).length || 0) - 3} more</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Day Detail Modal */}
            {selectedDay && (
                <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
                    <div className="detail-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="status-box" style={{ width: '48px', height: '48px', borderRadius: '16px' }}>
                                <Check size={24} strokeWidth={3} />
                            </div>
                            <button className="close-btn" onClick={() => setSelectedDay(null)}><X size={24} /></button>
                        </div>

                        <div className="modal-content">
                            <h1 className="editable-title">Daily Habits</h1>
                            <div style={{ color: '#444', fontSize: '0.875rem', fontWeight: '800', marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>

                            <div className="habit-grid">
                                {definitions.length === 0 ? (
                                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '3rem', color: '#333' }}>
                                        <p>No habits defined yet.</p>
                                    </div>
                                ) : (
                                    definitions.map(def => {
                                        const completed = getHabitStatus(selectedDay, def._id);
                                        return (
                                            <div
                                                key={def._id}
                                                className={`entry-card ${completed ? 'completed' : ''}`}
                                                onClick={() => toggleHabit(selectedDay, def._id, completed)}
                                            >
                                                <div className="entry-info">
                                                    <CheckCircle2 size={18} />
                                                    <span className="entry-name">{def.name}</span>
                                                </div>
                                                <div className={`mini-check ${completed ? 'checked' : ''}`}>
                                                    {completed && <Check size={10} strokeWidth={4} />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Habit Definition Modal */}
            {showDefModal && (
                <div className="modal-overlay" onClick={() => { setShowDefModal(false); setEditingDef(null); setNewHabitName(''); }}>
                    <div className="detail-modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '900' }}>{editingDef ? 'Edit Habit' : 'New Habit'}</h2>
                            <button className="close-btn" onClick={() => { setShowDefModal(false); setEditingDef(null); setNewHabitName(''); }}><X size={20} /></button>
                        </div>
                        <div className="modal-content">
                            <div className="def-management">
                                <div className="def-input-group">
                                    <label>Habit Name</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. Morning Meditation"
                                        value={newHabitName}
                                        onChange={e => setNewHabitName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && saveHabitDefinition()}
                                        autoFocus
                                    />
                                </div>

                                <button className="add-def-btn" onClick={saveHabitDefinition} disabled={isSaving}>
                                    {isSaving ? <Loader2 size={16} className="spinner" /> : (editingDef ? 'Update Habit' : 'Create Habit')}
                                </button>

                                {!editingDef && definitions.length > 0 && (
                                    <div className="existing-defs">
                                        <h3>Active Habits</h3>
                                        <div className="def-list">
                                            {definitions.map(def => (
                                                <div key={def._id} className="def-item">
                                                    <span>{def.name}</span>
                                                    <div className="def-actions">
                                                        <button onClick={() => { setEditingDef(def); setNewHabitName(def.name); }} title="Edit"><PenTool size={14} /></button>
                                                        <button onClick={() => deleteHabitDefinition(def._id)} title="Delete"><X size={14} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .habit-workspace {
                    min-height: 100vh;
                    background: #000;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .calendar-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 2.5rem 2rem 1.5rem;
                    background: #000;
                }

                .month-display h2 {
                    font-size: 1.75rem;
                    font-weight: 900;
                    letter-spacing: -0.05em;
                    color: #fff;
                }

                .nav-actions {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .step-controls {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: rgba(255,255,255,0.02);
                    padding: 0.5rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                }

                .nav-btn {
                    color: #333;
                    transition: all 0.3s;
                    padding: 8px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    cursor: pointer;
                }

                .nav-btn:hover {
                    color: #fff;
                    background: rgba(255,255,255,0.05);
                }

                .today-txt {
                    font-size: 0.7rem;
                    font-weight: 900;
                    color: #333 !important;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    margin: 0 0.5rem;
                    cursor: pointer;
                    transition: color 0.3s;
                }
                .today-txt:hover { color: #fff !important; }

                .new-btn {
                    background: #fff;
                    color: #000;
                    padding: 0.6rem 1.25rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 10px 20px rgba(255,255,255,0.1);
                    border: none;
                    cursor: pointer;
                }

                .new-btn:hover {
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(255,255,255,0.2);
                }

                .calendar-board {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 0 2rem 2rem;
                }

                .grid-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    margin-bottom: 0.25rem;
                }

                .header-cell {
                    padding: 0.75rem;
                    text-align: center;
                    font-size: 0.6rem;
                    color: #333;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.25em;
                }

                .grid-body {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-auto-rows: minmax(105px, 1fr);
                    gap: 0.5rem;
                }

                .calendar-cell {
                    position: relative;
                    border-radius: 10px;
                    padding: 0.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    background: rgba(255,255,255,0.01);
                    border: 1px solid rgba(255,255,255,0.2);
                }

                .calendar-cell:hover {
                    background: rgba(255,255,255,0.02);
                    border-color: rgba(255,255,255,0.1);
                    transform: translateY(-8px);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.8);
                }

                .off-month {
                    opacity: 0.1;
                    pointer-events: none;
                    background: none;
                    border-style: dashed;
                }

                .is-today {
                    background: rgba(255,255,255,0.02);
                    border-color: rgba(255,255,255,0.2);
                }
                .is-today::before {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    border: 1px solid #fff;
                    border-radius: 26px;
                    opacity: 0.1;
                }

                .is-today .day-number {
                    color: #fff;
                    font-weight: 900;
                }

                .day-number {
                    font-size: 1rem;
                    font-weight: 800;
                    color: #333;
                    letter-spacing: -0.02em;
                    transition: color 0.3s;
                }
                .calendar-cell:hover .day-number { color: #555; }

                .habit-card {
                    background: #000;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    padding: 0.5rem;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    position: relative;
                    overflow: hidden;
                }
                .habit-card::after {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%; height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.02), transparent);
                    transform: rotate(45deg);
                    transition: all 0.6s;
                }
                .habit-card:hover::after { transform: rotate(45deg) translateY(-20%); }

                .habit-card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 0.5rem;
                }

                .status-box {
                    width: 24px;
                    height: 24px;
                    background: #fff;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                    box-shadow: 0 4px 12px rgba(255,255,255,0.1);
                }

                .card-title {
                    font-size: 0.75rem;
                    font-weight: 900;
                    color: #fff;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .habit-mini-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }

                .mini-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.6rem;
                    color: #333;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .mini-item:hover { color: #888; }

                .mini-check {
                    width: 14px;
                    height: 14px;
                    border: 1px solid #1a1a1a;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #050505;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .mini-check.checked {
                    background: #fff;
                    border-color: #fff;
                    color: #000;
                    transform: scale(1.1);
                    box-shadow: 0 0 15px rgba(255,255,255,0.1);
                }

                .more-count {
                    font-size: 0.65rem;
                    color: #222;
                    font-weight: 900;
                    text-align: center;
                    margin-top: 0.5rem;
                }

                /* Modal Unified Design */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(20px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: modalFadeIn 0.4s ease;
                }
                @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }

                .detail-modal {
                    background: #000;
                    border: 1px solid rgba(255,255,255,0.1);
                    width: 600px;
                    max-width: 95%;
                    border-radius: 40px;
                    box-shadow: 0 50px 100px rgba(0,0,0,1);
                    animation: modalIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow: hidden;
                }
                @keyframes modalIn { from { transform: translateY(40px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 3rem 4rem 2rem;
                }

                .close-btn {
                    color: #222;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .close-btn:hover { color: #fff; transform: rotate(90deg); }

                .modal-content {
                    padding: 0 4rem 4rem;
                }

                .editable-title {
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: #fff;
                    letter-spacing: -0.05em;
                    margin-bottom: 2rem;
                    background: none;
                    border: none;
                    outline: none;
                    width: 100%;
                }

                .habit-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-top: 2rem;
                }

                .entry-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 20px;
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .entry-card:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); }
                .entry-card.completed { background: #fff; color: #000; border-color: #fff; }

                .entry-info { display: flex; align-items: center; gap: 1rem; }
                .entry-name { font-weight: 700; font-size: 0.9375rem; }

                /* Definition Management Modal */
                .def-management { display: flex; flex-direction: column; gap: 2rem; }
                .def-input-group { display: flex; flex-direction: column; gap: 0.75rem; }
                .def-input-group label { font-size: 0.75rem; color: #444; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; }
                .def-input-group input { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 1.25rem; border-radius: 16px; color: #fff; font-size: 1.125rem; outline: none; transition: border-color 0.3s; }
                .def-input-group input:focus { border-color: #333; }

                .add-def-btn { background: #fff; color: #000; padding: 1.25rem; border-radius: 16px; font-weight: 900; border: none; cursor: pointer; transition: all 0.3s; }
                .add-def-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 40px rgba(255,255,255,0.1); }

                .existing-defs { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem; margin-top: 1rem; }
                .existing-defs h3 { font-size: 0.75rem; color: #444; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; margin-bottom: 1.5rem; }
                .def-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .def-item { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem 1.5rem; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; }
                .def-item span { font-weight: 700; color: #fff; }
                .def-actions { display: flex; gap: 0.5rem; }
                .def-actions button { color: #222; transition: all 0.2s; background: none; border: none; cursor: pointer; }
                .def-actions button:hover { color: #fff; transform: scale(1.2); }

                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 1200px) {
                    .grid-body { grid-template-columns: repeat(4, 1fr); }
                    .grid-header { grid-template-columns: repeat(4, 1fr); }
                    .header-cell:nth-child(n+5) { display: none; }
                }

                @media (max-width: 1024px) {
                    .calendar-nav { padding: 3rem 2rem 1.5rem; flex-direction: column; gap: 2rem; align-items: flex-start; }
                    .calendar-board { padding: 0 2rem 2rem; }
                    .grid-body { grid-template-columns: repeat(3, 1fr); grid-auto-rows: minmax(140px, auto); gap: 1rem; }
                    .grid-header { grid-template-columns: repeat(3, 1fr); }
                    .header-cell:nth-child(n+4) { display: none; }
                    .calendar-cell { padding: 1.25rem; }
                    .month-display h2 { font-size: 2rem; }
                    .nav-actions { width: 100%; justify-content: space-between; gap: 1rem; }
                }

                @media (max-width: 768px) {
                    .grid-body { grid-template-columns: 1fr; gap: 1rem; }
                    .grid-header { display: none; }
                    .calendar-cell { min-height: auto; }
                    .detail-modal { border-radius: 24px; }
                    .modal-header { padding: 2rem 2rem 1rem; }
                    .modal-content { padding: 0 2rem 2rem; }
                    .editable-title { font-size: 1.75rem; }
                    .habit-grid { grid-template-columns: 1fr; }
                }

                @media (max-width: 480px) {
                    .calendar-nav { padding: 2rem 1rem 1rem; }
                    .nav-actions { flex-direction: column; align-items: stretch; }
                    .step-controls { justify-content: center; }
                    .new-btn { justify-content: center; }
                    .calendar-board { padding: 0 1rem 1rem; }
                }
            `}</style>
        </div>
    );
}
