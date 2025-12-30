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
    CalendarDays
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

    const addHabitDefinition = async () => {
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
                setShowDefModal(false);
            }
        } catch (error) {
            console.error('Error adding habit:', error);
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
                        <button onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                        <button className="today-txt" onClick={goToToday}>Today</button>
                        <button onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
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
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                            <span className="card-title">Daily Habits</span>
                                        </div>
                                        <div className="habit-mini-list">
                                            {habitDay?.entries.filter(e => e.completed).slice(0, 3).map(entry => (
                                                <div key={entry.habitId} className="mini-item">
                                                    <div className="mini-check checked" />
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
                        <div className="modal-top">
                            <div className="large-check-icon">
                                <Check size={32} strokeWidth={3} />
                            </div>
                            <button className="close-btn" onClick={() => setSelectedDay(null)}><X size={20} /></button>
                        </div>

                        <div className="modal-content">
                            <h1 className="editable-title">Daily Habits</h1>

                            <div className="info-row">
                                <div className="info-label">
                                    <CalIcon size={16} />
                                    <span>Date</span>
                                </div>
                                <div className="info-value">
                                    {selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>

                            <div className="habit-checklist">
                                {definitions.length === 0 ? (
                                    <div className="no-habits">
                                        <p>No habits defined yet.</p>
                                        <button onClick={() => { setShowDefModal(true); setSelectedDay(null); }}>Create your first habit</button>
                                    </div>
                                ) : (
                                    definitions.map(def => {
                                        const completed = getHabitStatus(selectedDay, def._id);
                                        return (
                                            <div key={def._id} className="checklist-item">
                                                <div className="item-label">
                                                    <CalIcon size={16} className="item-icon" />
                                                    <span>{def.name}</span>
                                                </div>
                                                <div
                                                    className={`item-checkbox ${completed ? 'checked' : ''}`}
                                                    onClick={() => toggleHabit(selectedDay, def._id, completed)}
                                                >
                                                    {completed && <Check size={12} strokeWidth={4} />}
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
                <div className="modal-overlay" onClick={() => setShowDefModal(false)}>
                    <div className="definition-modal" onClick={e => e.stopPropagation()}>
                        <h2>New Habit Definition</h2>
                        <p className="modal-sub">This will add a new habit to your daily list.</p>
                        <input
                            type="text"
                            placeholder="What's the habit?"
                            value={newHabitName}
                            onChange={e => setNewHabitName(e.target.value)}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowDefModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={addHabitDefinition} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="spinner" /> : 'Create Habit'}
                            </button>
                        </div>

                        {definitions.length > 0 && (
                            <div className="existing-defs">
                                <h3>Active Habits</h3>
                                <div className="def-list">
                                    {definitions.map(def => (
                                        <div key={def._id} className="def-item">
                                            <span>{def.name}</span>
                                            <button onClick={() => deleteHabitDefinition(def._id)}><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .habit-workspace {
                    min-height: 100vh;
                    background: #111;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                }

                /* Workspace Header */
                .workspace-header {
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                    border-bottom: 1px solid #1f1f1f;
                    background: #111;
                }

                .view-switcher {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #191919;
                    border: 1px solid #2a2a2a;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 500;
                }

                .right-controls {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .icon-tool {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #777;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .icon-tool:hover {
                    background: #1f1f1f;
                    color: #fff;
                }

                .new-btn {
                    margin-left: 8px;
                    background: #2383e2;
                    color: #fff;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* Calendar Nav */
                .calendar-nav {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 32px 24px 16px;
                }

                .month-display h2 {
                    font-size: 20px;
                    font-weight: 700;
                }

                .nav-actions {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }

                .manage-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: #777;
                }

                .manage-btn:hover {
                    color: #fff;
                }

                .step-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .step-controls button {
                    color: #777;
                }

                .step-controls button:hover {
                    color: #fff;
                }

                .today-txt {
                    font-size: 13px;
                    font-weight: 600;
                    color: #fff !important;
                }

                /* Calendar Grid */
                .calendar-board {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 0 24px 24px;
                }

                .grid-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    border-bottom: 1px solid #1f1f1f;
                }

                .header-cell {
                    padding: 8px;
                    text-align: right;
                    font-size: 12px;
                    color: #777;
                    font-weight: 500;
                }

                .grid-body {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-auto-rows: minmax(140px, 1fr);
                    border-left: 1px solid #1f1f1f;
                    border-top: 1px solid #1f1f1f;
                }

                .calendar-cell {
                    border-right: 1px solid #1f1f1f;
                    border-bottom: 1px solid #1f1f1f;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    cursor: pointer;
                    transition: background 0.1s;
                }

                .calendar-cell:hover {
                    background: #191919;
                }

                .off-month {
                    color: #444;
                }

                .is-today .day-number {
                    background: #e25555;
                    color: #fff;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }

                .day-number {
                    font-size: 12px;
                    font-weight: 600;
                }

                /* Habit Card in Cell */
                .habit-card {
                    background: #191919;
                    border: 1px solid #2a2a2a;
                    border-radius: 6px;
                    padding: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .habit-card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }

                .status-box {
                    width: 18px;
                    height: 18px;
                    background: #4a9e4a;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }

                .card-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #fff;
                }

                .habit-mini-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .mini-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #999;
                }

                .mini-check {
                    width: 12px;
                    height: 12px;
                    border: 1px solid #444;
                    border-radius: 2px;
                }

                .mini-check.checked {
                    background: #2383e2;
                    border-color: #2383e2;
                }

                .more-count {
                    font-size: 10px;
                    color: #555;
                    margin-top: 2px;
                }

                /* Modal UI */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                /* Detail Modal */
                .detail-modal {
                    background: #191919;
                    width: 100%;
                    max-width: 600px;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                @keyframes modalPop {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                .modal-top {
                    display: flex;
                    justify-content: space-between;
                    padding: 16px 24px;
                }

                .large-check-icon {
                    width: 64px;
                    height: 64px;
                    background: #73b373;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }

                .close-btn {
                    align-self: flex-start;
                    color: #777;
                }

                .modal-content {
                    padding: 0 64px 64px;
                }

                .editable-title {
                    font-size: 42px;
                    font-weight: 800;
                    margin-bottom: 24px;
                    letter-spacing: -1px;
                }

                .info-row {
                    display: flex;
                    align-items: center;
                    gap: 48px;
                    margin-bottom: 24px;
                }

                .info-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #777;
                    font-size: 14px;
                    width: 100px;
                }

                .info-value {
                    font-size: 14px;
                    font-weight: 500;
                }

                .habit-checklist {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 32px;
                }

                .checklist-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 0;
                }

                .item-label {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .item-icon {
                    color: #555;
                }

                .item-checkbox {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #333;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .item-checkbox.checked {
                    background: #2383e2;
                    border-color: #2383e2;
                    color: #fff;
                }

                /* Definition Modal */
                .definition-modal {
                    background: #191919;
                    padding: 32px;
                    border-radius: 12px;
                    width: 100%;
                    max-width: 440px;
                }

                .definition-modal h2 {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }

                .modal-sub {
                    color: #777;
                    font-size: 14px;
                    margin-bottom: 24px;
                }

                .definition-modal input {
                    width: 100%;
                    background: #111;
                    border: 1px solid #333;
                    padding: 12px;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 15px;
                    margin-bottom: 24px;
                    outline: none;
                }

                .definition-modal input:focus {
                    border-color: #2383e2;
                }

                .secondary-btn {
                    color: #777;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 8px 16px;
                }

                .primary-btn {
                    background: #fff;
                    color: #000;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                }

                .existing-defs {
                    margin-top: 32px;
                    border-top: 1px solid #333;
                    padding-top: 24px;
                }

                .existing-defs h3 {
                    font-size: 12px;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 12px;
                }

                .def-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: #111;
                    border: 1px solid #222;
                    border-radius: 6px;
                    margin-bottom: 6px;
                    font-size: 14px;
                }

                .def-item button {
                    color: #444;
                }

                .def-item button:hover {
                    color: #e25555;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 1024px) {
                    .calendar-board { padding: 0 16px 16px; }
                    .grid-body { grid-auto-rows: minmax(100px, 1fr); }
                    .detail-modal { max-width: 90%; }
                    .modal-content { padding: 0 32px 32px; }
                    .editable-title { font-size: 32px; }
                }
            `}</style>
        </div>
    );
}
