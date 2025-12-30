"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, Trash2, CheckCircle2, Circle, Sunrise, Sun, Moon, Loader2, X, RotateCcw } from 'lucide-react';

interface RoutineItem {
    _id: string;
    title: string;
    time: string;
    period: 'morning' | 'afternoon' | 'evening';
    order: number;
}

interface RoutineLog {
    _id: string;
    itemId: string;
    date: string;
    completed: boolean;
}

const PERIODS = [
    { key: 'morning', label: 'Morning', icon: Sunrise, color: '#fbbf24' },
    { key: 'afternoon', label: 'Afternoon', icon: Sun, color: '#f97316' },
    { key: 'evening', label: 'Evening', icon: Moon, color: '#8b5cf6' },
];

export default function RoutinePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [logs, setLogs] = useState<RoutineLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newRoutine, setNewRoutine] = useState({
        title: '',
        time: '08:00',
        period: 'morning' as const,
    });

    const today = new Date().toISOString().split('T')[0];

    const fetchRoutines = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/routines?date=${today}`);
            const data = await res.json();
            setRoutines(data.routines || []);
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Error fetching routines:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session, today]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchRoutines();
        }
    }, [status, router, fetchRoutines]);

    const addRoutine = async () => {
        if (!newRoutine.title.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/routines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newRoutine, order: routines.length }),
            });
            const data = await res.json();
            if (res.ok) {
                setRoutines(prev => [...prev, data.routine]);
                setNewRoutine({ title: '', time: '08:00', period: 'morning' });
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error adding routine:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleComplete = async (itemId: string) => {
        const existingLog = logs.find(l => l.itemId === itemId && l.date === today);
        try {
            const res = await fetch('/api/routines', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    itemId,
                    date: today,
                    completed: existingLog ? !existingLog.completed : true,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                if (existingLog) {
                    setLogs(prev => prev.map(l => l._id === existingLog._id ? { ...l, completed: !l.completed } : l));
                } else {
                    setLogs(prev => [...prev, data.log]);
                }
            }
        } catch (error) {
            console.error('Error toggling completion:', error);
        }
    };

    const deleteRoutine = async (id: string) => {
        try {
            await fetch('/api/routines', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setRoutines(prev => prev.filter(r => r._id !== id));
        } catch (error) {
            console.error('Error deleting routine:', error);
        }
    };

    const resetToday = async () => {
        try {
            await fetch('/api/routines', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetDate: today }),
            });
            setLogs(prev => prev.filter(l => l.date !== today));
        } catch (error) {
            console.error('Error resetting day:', error);
        }
    };

    const isCompleted = (itemId: string) => {
        const log = logs.find(l => l.itemId === itemId && l.date === today);
        return log?.completed || false;
    };

    const completedCount = routines.filter(r => isCompleted(r._id)).length;
    const progressPercent = routines.length > 0 ? Math.round((completedCount / routines.length) * 100) : 0;

    const groupedRoutines = PERIODS.map(period => ({
        ...period,
        items: routines.filter(r => r.period === period.key).sort((a, b) => a.time.localeCompare(b.time)),
    }));

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Loading routine...</span>
                <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: #555; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="routine-page">
            <header className="page-header">
                <div className="header-left">
                    <div className="page-badge">Daily Habits</div>
                    <h1 className="text-gradient">Routine Tracker</h1>
                    <p className="header-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="progress-ring glass-panel">
                    <svg viewBox="0 0 100 100" className="ring-svg">
                        <circle cx="50" cy="50" r="40" className="ring-bg" />
                        <circle cx="50" cy="50" r="40" className="ring-progress" style={{ strokeDasharray: `${progressPercent * 2.51} 251` }} />
                    </svg>
                    <div className="ring-text">
                        <span className="ring-percent">{progressPercent}%</span>
                        <span className="ring-label">{completedCount}/{routines.length}</span>
                    </div>
                </div>

                <div className="header-actions">
                    <button className="reset-btn glass-panel" onClick={resetToday}>
                        <RotateCcw size={16} />
                        Reset
                    </button>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Add Task
                    </button>
                </div>
            </header>

            <div className="routine-timeline">
                {groupedRoutines.map(group => (
                    <div key={group.key} className="period-section">
                        <div className="period-header" style={{ '--accent': group.color } as any}>
                            <group.icon size={20} />
                            <h2>{group.label}</h2>
                            <span className="period-count">{group.items.filter(i => isCompleted(i._id)).length}/{group.items.length}</span>
                        </div>

                        {group.items.length === 0 ? (
                            <div className="empty-period">No tasks scheduled</div>
                        ) : (
                            <div className="period-items">
                                {group.items.map((item, idx) => (
                                    <div key={item._id} className={`routine-item glass-panel ${isCompleted(item._id) ? 'completed' : ''}`}>
                                        <button className="check-btn" onClick={() => toggleComplete(item._id)}>
                                            {isCompleted(item._id) ? (
                                                <CheckCircle2 size={24} className="checked" />
                                            ) : (
                                                <Circle size={24} />
                                            )}
                                        </button>
                                        <div className="item-content">
                                            <span className="item-time">{item.time}</span>
                                            <span className="item-title">{item.title}</span>
                                        </div>
                                        <button className="delete-btn" onClick={() => deleteRoutine(item._id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Clock size={18} /> New Routine Task</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className="form-group">
                            <label>Task Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Morning meditation"
                                value={newRoutine.title}
                                onChange={e => setNewRoutine({ ...newRoutine, title: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    value={newRoutine.time}
                                    onChange={e => setNewRoutine({ ...newRoutine, time: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Period</label>
                                <select value={newRoutine.period} onChange={e => setNewRoutine({ ...newRoutine, period: e.target.value as any })}>
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                    <option value="evening">Evening</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={addRoutine} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Add Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .routine-page { max-width: 740px; margin: 0 auto; padding: 1.5rem; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1.25rem; }
        .page-badge { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: #555; letter-spacing: 0.1em; margin-bottom: 0.375rem; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; color: #fff; letter-spacing: -0.02em; }
        .header-date { font-size: 0.8125rem; color: #666; }
        .progress-ring { position: relative; width: 90px; height: 90px; padding: 0; background: #0a0a0a; border: 1px solid #181818; border-radius: 50%; }
        .ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: #1a1a1a; stroke-width: 8; }
        .ring-progress { fill: none; stroke: #fff; stroke-width: 8; stroke-linecap: round; transition: stroke-dasharray 0.5s ease; }
        .ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-percent { font-size: 1.125rem; font-weight: 700; color: #fff; }
        .ring-label { font-size: 0.625rem; color: #555; }
        .header-actions { display: flex; gap: 0.625rem; }
        .reset-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; font-size: 0.8125rem; color: #666; background: #0a0a0a; border: 1px solid #181818; border-radius: 8px; transition: all 0.15s; }
        .reset-btn:hover { border-color: #252525; color: #999; }
        .add-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #fff; color: #000; font-weight: 600; border-radius: 8px; font-size: 0.8125rem; transition: all 0.15s; }
        .add-btn:hover { transform: translateY(-1px); }
        .routine-timeline { display: flex; flex-direction: column; gap: 1.5rem; }
        .period-section { position: relative; }
        .period-header { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.875rem; color: var(--accent); }
        .period-header svg { color: var(--accent); }
        .period-header h2 { font-size: 1rem; font-weight: 600; color: #fff; }
        .period-count { font-size: 0.6875rem; padding: 0.1875rem 0.5rem; background: #111; border-radius: 4px; color: #666; }
        .empty-period { padding: 1.25rem; text-align: center; color: #444; font-size: 0.8125rem; border: 1px dashed #1f1f1f; border-radius: 10px; }
        .period-items { display: flex; flex-direction: column; gap: 0.375rem; }
        .routine-item { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1rem; background: #0a0a0a; border: 1px solid #181818; border-radius: 10px; transition: all 0.15s; }
        .routine-item:hover { border-color: #252525; background: #0c0c0c; }
        .routine-item.completed { opacity: 0.5; }
        .routine-item.completed .item-title { text-decoration: line-through; color: #555; }
        .check-btn { color: #444; transition: all 0.15s; }
        .check-btn:hover { color: #666; }
        .check-btn .checked { color: #10b981; }
        .item-content { flex: 1; display: flex; align-items: center; gap: 0.875rem; }
        .item-time { font-size: 0.75rem; font-weight: 600; color: #666; min-width: 48px; background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; text-align: center; }
        .item-title { font-size: 0.875rem; color: #eee; }
        .delete-btn { color: #333; padding: 0.375rem; border-radius: 6px; opacity: 0; transition: all 0.15s; }
        .routine-item:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 14px; padding: 1.5rem; width: 90%; max-width: 380px; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
        .modal-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; color: #fff; }
        .modal-header button { color: #555; padding: 0.25rem; }
        .modal-header button:hover { color: #999; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 0.875rem; }
        .form-group label { font-size: 0.6875rem; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input, .form-group select { padding: 0.625rem 0.875rem; background: #080808; border: 1px solid #1f1f1f; border-radius: 8px; color: #fff; font-size: 0.875rem; outline: none; transition: border-color 0.15s; }
        .form-group input:focus, .form-group select:focus { border-color: #333; }
        .form-group input::placeholder { color: #444; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.625rem; margin-top: 1.25rem; }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #fff; color: #000; font-weight: 600; border-radius: 8px; font-size: 0.8125rem; transition: all 0.15s; }
        .primary-btn:hover { transform: translateY(-1px); }
        .secondary-btn { padding: 0.5rem 1rem; background: transparent; border: 1px solid #1f1f1f; color: #777; border-radius: 8px; font-size: 0.8125rem; transition: all 0.15s; }
        .secondary-btn:hover { border-color: #333; color: #999; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; }
          .progress-ring { width: 70px; height: 70px; }
        }
      `}</style>
        </div>
    );
}
