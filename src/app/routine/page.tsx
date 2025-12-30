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
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: var(--text-muted); }
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
        .routine-page { max-width: 800px; margin: 0 auto; animation: fadeUp 0.5s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; flex-wrap: wrap; gap: 1.5rem; }
        .page-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.25rem; }
        .header-date { font-size: 0.9rem; color: var(--text-muted); }
        .progress-ring { position: relative; width: 100px; height: 100px; padding: 0; border-radius: 50%; }
        .ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: var(--border-dim); stroke-width: 8; }
        .ring-progress { fill: none; stroke: var(--text-primary); stroke-width: 8; stroke-linecap: round; transition: stroke-dasharray 0.5s ease; }
        .ring-text { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-percent { font-size: 1.25rem; font-weight: 700; }
        .ring-label { font-size: 0.7rem; color: var(--text-muted); }
        .header-actions { display: flex; gap: 0.75rem; }
        .reset-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; font-size: 0.85rem; color: var(--text-secondary); border-radius: 10px; }
        .add-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); font-weight: 600; border-radius: 10px; }
        .routine-timeline { display: flex; flex-direction: column; gap: 2rem; }
        .period-section { position: relative; }
        .period-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; color: var(--accent); }
        .period-header h2 { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
        .period-count { font-size: 0.75rem; padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: var(--text-muted); }
        .empty-period { padding: 1.5rem; text-align: center; color: var(--text-dim); font-size: 0.9rem; border: 1px dashed var(--border-dim); border-radius: 12px; }
        .period-items { display: flex; flex-direction: column; gap: 0.5rem; }
        .routine-item { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-radius: 12px; transition: all 0.2s; }
        .routine-item.completed { opacity: 0.6; }
        .routine-item.completed .item-title { text-decoration: line-through; }
        .check-btn { color: var(--text-dim); }
        .check-btn .checked { color: #22c55e; }
        .item-content { flex: 1; display: flex; align-items: center; gap: 1rem; }
        .item-time { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); min-width: 50px; }
        .item-title { font-size: 0.95rem; }
        .delete-btn { color: var(--text-dim); padding: 0.4rem; border-radius: 6px; opacity: 0; transition: opacity 0.2s; }
        .routine-item:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: #f87171; background: rgba(239,68,68,0.1); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 1.5rem; width: 90%; max-width: 400px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
        .form-group input, .form-group select { padding: 0.75rem 1rem; background: var(--bg-deep); border: 1px solid var(--border-main); border-radius: 10px; color: var(--text-primary); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); font-weight: 600; border-radius: 10px; }
        .secondary-btn { padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border-main); color: var(--text-secondary); border-radius: 10px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; }
          .progress-ring { width: 80px; height: 80px; }
        }
      `}</style>
        </div>
    );
}
