"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, Plus, Trash2, CheckCircle2, Circle, Sunrise, Sun, Moon, Loader2, X, RotateCcw } from 'lucide-react';

interface RoutineItem {
    _id: string;
    name: string;
    time: string;
    period: 'morning' | 'afternoon' | 'evening';
    order: number;
    completed: boolean;
    isActive: boolean;
}

const PERIODS = [
    { key: 'morning', label: 'Morning', icon: Sunrise, color: '#fbbf24' },
    { key: 'afternoon', label: 'Afternoon', icon: Sun, color: '#f97316' },
    { key: 'evening', label: 'Evening', icon: Moon, color: '#8b5cf6' },
];

// Helper to determine period based on time
const getPeriodFromTime = (time: string): 'morning' | 'afternoon' | 'evening' => {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
};

export default function RoutinePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [routines, setRoutines] = useState<RoutineItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newRoutine, setNewRoutine] = useState({
        name: '',
        time: '08:00',
    });

    const today = new Date().toISOString().split('T')[0];

    const fetchRoutines = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/routines?date=${today}`);
            const data = await res.json();
            // API returns routines with completion status already merged
            const routinesWithPeriod = (data.routines || []).map((r: any) => ({
                ...r,
                period: getPeriodFromTime(r.time),
            }));
            setRoutines(routinesWithPeriod);
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
        if (!newRoutine.name.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/routines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    name: newRoutine.name,
                    time: newRoutine.time,
                }),
            });
            const data = await res.json();
            if (res.ok && data.routineItem) {
                const newItem = {
                    ...data.routineItem,
                    period: getPeriodFromTime(data.routineItem.time),
                    completed: false,
                };
                setRoutines(prev => [...prev, newItem]);
                setNewRoutine({ name: '', time: '08:00' });
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error adding routine:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleComplete = async (itemId: string) => {
        const routine = routines.find(r => r._id === itemId);
        if (!routine) return;

        const newCompleted = !routine.completed;

        // Optimistic update
        setRoutines(prev => prev.map(r =>
            r._id === itemId ? { ...r, completed: newCompleted } : r
        ));

        try {
            const res = await fetch('/api/routines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle',
                    routineItemId: itemId,
                    date: today,
                    completed: newCompleted,
                }),
            });
            if (!res.ok) {
                // Revert on failure
                setRoutines(prev => prev.map(r =>
                    r._id === itemId ? { ...r, completed: !newCompleted } : r
                ));
            }
        } catch (error) {
            console.error('Error toggling completion:', error);
            // Revert on error
            setRoutines(prev => prev.map(r =>
                r._id === itemId ? { ...r, completed: !newCompleted } : r
            ));
        }
    };

    const deleteRoutine = async (id: string) => {
        // Optimistic update
        setRoutines(prev => prev.filter(r => r._id !== id));
        try {
            const res = await fetch('/api/routines', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                // Refetch on failure
                fetchRoutines();
            }
        } catch (error) {
            console.error('Error deleting routine:', error);
            fetchRoutines();
        }
    };

    const resetToday = async () => {
        // Optimistic update - set all to incomplete
        setRoutines(prev => prev.map(r => ({ ...r, completed: false })));

        try {
            // Reset each routine's completion for today
            const resetPromises = routines.map(r =>
                fetch('/api/routines', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'toggle',
                        routineItemId: r._id,
                        date: today,
                        completed: false,
                    }),
                })
            );
            await Promise.all(resetPromises);
        } catch (error) {
            console.error('Error resetting day:', error);
            fetchRoutines();
        }
    };

    const completedCount = routines.filter(r => r.completed).length;
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
                            <span className="period-count">{group.items.filter(i => i.completed).length}/{group.items.length}</span>
                        </div>

                        {group.items.length === 0 ? (
                            <div className="empty-period">No tasks scheduled</div>
                        ) : (
                            <div className="period-items">
                                {group.items.map((item, idx) => (
                                    <div key={item._id} className={`routine-item glass-panel ${item.completed ? 'completed' : ''}`}>
                                        <button className="check-btn" onClick={() => toggleComplete(item._id)}>
                                            {item.completed ? (
                                                <CheckCircle2 size={24} className="checked" />
                                            ) : (
                                                <Circle size={24} />
                                            )}
                                        </button>
                                        <div className="item-content">
                                            <span className="item-time">{item.time}</span>
                                            <span className="item-title">{item.name}</span>
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
                                value={newRoutine.name}
                                onChange={e => setNewRoutine({ ...newRoutine, name: e.target.value })}
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
        .routine-page { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 48px 24px; 
            animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        
        @keyframes fadeUp { 
            from { opacity: 0; transform: translateY(16px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .page-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 48px; 
            flex-wrap: wrap; 
            gap: 24px; 
        }

        .page-badge { 
            font-size: 0.75rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            color: #444; 
            letter-spacing: 0.15em; 
            margin-bottom: 8px; 
            display: block;
        }

        .page-header h1 { 
            font-size: 2.5rem; 
            font-weight: 800; 
            margin: 0; 
            color: #fff; 
            letter-spacing: -0.04em; 
        }

        .header-date { 
            font-size: 1rem; 
            color: #555; 
            font-weight: 500;
            margin-top: 4px;
        }

        .progress-ring { 
            position: relative; 
            width: 100px; 
            height: 100px; 
            padding: 0; 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            border-radius: 50%; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
        .ring-bg { fill: none; stroke: #151515; stroke-width: 6; }
        .ring-progress { 
            fill: none; 
            stroke: #fff; 
            stroke-width: 6; 
            stroke-linecap: round; 
            transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1); 
        }

        .ring-text { 
            position: absolute; 
            inset: 0; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
        }

        .ring-percent { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .ring-label { font-size: 0.625rem; color: #444; font-weight: 800; text-transform: uppercase; }

        .header-actions { display: flex; gap: 12px; }

        .reset-btn { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 10px 20px; 
            font-size: 0.8125rem; 
            color: #444; 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            border-radius: 10px; 
            transition: all 0.2s; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .reset-btn:hover { border-color: #333; color: #888; }

        .add-btn { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 12px 24px; 
            background: #fff; 
            color: #000; 
            font-weight: 800; 
            border-radius: 10px; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .add-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,0.2); }

        .routine-timeline { display: flex; flex-direction: column; gap: 40px; }
        .period-section { position: relative; }

        .period-header { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            margin-bottom: 20px; 
            color: #fff; 
        }

        .period-header svg { color: #555; }
        .period-header h2 { font-size: 1.125rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        
        .period-count { 
            font-size: 0.6875rem; 
            padding: 3px 8px; 
            background: #111; 
            border-radius: 6px; 
            color: #444; 
            font-weight: 800;
        }

        .empty-period { 
            padding: 24px; 
            text-align: center; 
            color: #222; 
            font-size: 0.8125rem; 
            border: 1px dashed #151515; 
            border-radius: 16px; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .period-items { display: flex; flex-direction: column; gap: 8px; }

        .routine-item { 
            display: flex; 
            align-items: center; 
            gap: 16px; 
            padding: 16px 20px; 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            border-radius: 16px; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }

        .routine-item:hover { 
            border-color: #252525; 
            background: #0d0d0d;
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        }

        .routine-item.completed { opacity: 0.4; }
        .routine-item.completed .item-title { text-decoration: line-through; color: #444; }

        .check-btn { color: #222; transition: all 0.2s; }
        .check-btn:hover { color: #444; transform: scale(1.1); }
        .check-btn .checked { color: #fff; }

        .item-content { flex: 1; display: flex; align-items: center; gap: 16px; }

        .item-time { 
            font-size: 0.75rem; 
            font-weight: 800; 
            color: #555; 
            min-width: 60px; 
            background: #151515; 
            padding: 4px 8px; 
            border-radius: 6px; 
            text-align: center; 
            letter-spacing: 0.05em;
        }

        .item-title { font-size: 0.9375rem; color: #fff; font-weight: 600; }

        .delete-btn { color: #222; padding: 6px; border-radius: 8px; opacity: 0; transition: all 0.2s; }
        .routine-item:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: #ff4444; background: rgba(255,68,68,0.1); }

        .modal-overlay { 
            position: fixed; 
            inset: 0; 
            background: rgba(0, 0, 0, 0.9); 
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

        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
        .form-group label { font-size: 0.75rem; font-weight: 800; color: #333; text-transform: uppercase; letter-spacing: 0.1em; }

        .form-group input, .form-group select { 
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

        .form-group input:focus, .form-group select:focus { border-color: #333; background: #080808; }
        .form-group input::placeholder { color: #222; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }

        .primary-btn { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 12px 24px; 
            background: #fff; 
            color: #000; 
            font-weight: 800; 
            border-radius: 10px; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }

        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(255,255,255,0.2); }

        .secondary-btn { 
            padding: 12px 24px; 
            background: transparent; 
            border: 1px solid #1a1a1a; 
            color: #444; 
            border-radius: 10px; 
            font-size: 0.875rem; 
            font-weight: 700;
            transition: all 0.2s; 
        }

        .secondary-btn:hover { border-color: #333; color: #888; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }

        @media (max-width: 768px) {
            .routine-page { padding: 32px 20px; }
            .page-header { flex-direction: column; align-items: flex-start; gap: 32px; }
            .header-date { margin-bottom: 8px; }
            .progress-ring { width: 80px; height: 80px; }
        }
      `}</style>
        </div>
    );
}
