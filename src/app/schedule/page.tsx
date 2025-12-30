"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, User as UserIcon, MapPin, Plus, X, Loader2, Trash2 } from 'lucide-react';

interface Schedule {
    _id: string;
    subject: string;
    teacher: string;
    room: string;
    time: string;
    days: string[];
    color: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const COLORS = ['#ffffff', '#f87171', '#fbbf24', '#4ade80', '#60a5fa', '#a78bfa'];

export default function SchedulePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newSchedule, setNewSchedule] = useState({
        subject: '',
        teacher: '',
        room: '',
        time: '',
        days: [] as string[],
        color: '#ffffff',
    });

    const fetchSchedules = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/schedules');
            const data = await res.json();
            setSchedules(data.schedules || []);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchSchedules();
        }
    }, [status, router, fetchSchedules]);

    const addSchedule = async () => {
        if (!newSchedule.subject.trim() || !newSchedule.time.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSchedule),
            });
            if (res.ok) {
                const data = await res.json();
                setSchedules(prev => [...prev, data.schedule]);
                setNewSchedule({ subject: '', teacher: '', room: '', time: '', days: [], color: '#ffffff' });
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error adding schedule:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteSchedule = async (id: string) => {
        try {
            await fetch('/api/schedules', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setSchedules(prev => prev.filter(s => s._id !== id));
        } catch (error) {
            console.error('Error deleting schedule:', error);
        }
    };

    const toggleDay = (day: string) => {
        setNewSchedule(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day],
        }));
    };

    const getClassesForDay = (dayFull: string) => {
        const dayShort = dayFull.substring(0, 3);
        return schedules.filter(s => s.days.includes(dayShort)).sort((a, b) => a.time.localeCompare(b.time));
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Loading schedule...</span>
                <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: var(--text-muted); }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="schedule-page">
            <header className="page-header">
                <div className="title-area">
                    <h1 className="text-gradient">School Schedule</h1>
                    <p>Your weekly class timetable</p>
                </div>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} /><span>Add Class</span>
                </button>
            </header>

            <div className="schedule-grid">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <div key={day} className="day-column">
                        <h3>{day}</h3>
                        <div className="class-cards">
                            {getClassesForDay(day).length === 0 ? (
                                <div className="empty-slot">No classes</div>
                            ) : (
                                getClassesForDay(day).map(cls => (
                                    <div key={cls._id} className="class-card glass-panel" style={{ borderLeftColor: cls.color }}>
                                        <div className="card-header">
                                            <span className="time"><Clock size={12} /> {cls.time}</span>
                                            <button className="delete-btn" onClick={() => deleteSchedule(cls._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <h4>{cls.subject}</h4>
                                        <div className="class-meta">
                                            {cls.teacher && (
                                                <div className="meta-item">
                                                    <UserIcon size={12} />
                                                    <span>{cls.teacher}</span>
                                                </div>
                                            )}
                                            {cls.room && (
                                                <div className="meta-item">
                                                    <MapPin size={12} />
                                                    <span>{cls.room}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Class</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className="form-group">
                            <label>Subject *</label>
                            <input
                                type="text"
                                placeholder="e.g., Advanced Mathematics"
                                value={newSchedule.subject}
                                onChange={e => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Teacher</label>
                                <input
                                    type="text"
                                    placeholder="Dr. Smith"
                                    value={newSchedule.teacher}
                                    onChange={e => setNewSchedule({ ...newSchedule, teacher: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Room</label>
                                <input
                                    type="text"
                                    placeholder="B-204"
                                    value={newSchedule.room}
                                    onChange={e => setNewSchedule({ ...newSchedule, room: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Time *</label>
                            <input
                                type="text"
                                placeholder="08:00 - 09:30"
                                value={newSchedule.time}
                                onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Days *</label>
                            <div className="days-selector">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        className={`day-btn ${newSchedule.days.includes(day) ? 'active' : ''}`}
                                        onClick={() => toggleDay(day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Color</label>
                            <div className="color-picker">
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-btn ${newSchedule.color === color ? 'active' : ''}`}
                                        style={{ background: color }}
                                        onClick={() => setNewSchedule({ ...newSchedule, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={addSchedule} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Add Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .schedule-page { max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.25rem; }
        .page-header p { color: var(--text-muted); }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); font-weight: 600; border-radius: 10px; }
        .primary-btn:hover { transform: translateY(-2px); }
        .secondary-btn { padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border-main); color: var(--text-secondary); border-radius: 10px; font-weight: 500; }
        .schedule-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; }
        .day-column h3 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 1rem; text-align: center; font-weight: 700; }
        .class-cards { display: flex; flex-direction: column; gap: 0.75rem; min-height: 200px; }
        .empty-slot { text-align: center; padding: 2rem 1rem; color: var(--text-dim); font-size: 0.85rem; border: 1px dashed var(--border-dim); border-radius: 12px; }
        .class-card { padding: 1rem; border-radius: 12px; border-left: 3px solid; transition: transform 0.2s; }
        .class-card:hover { transform: translateY(-4px); }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .time { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--text-dim); }
        .delete-btn { color: var(--text-dim); padding: 0.25rem; opacity: 0; transition: opacity 0.2s; }
        .class-card:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: #f87171; }
        .class-card h4 { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; }
        .class-meta { display: flex; flex-direction: column; gap: 0.25rem; }
        .meta-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--text-muted); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 1.5rem; width: 90%; max-width: 480px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-header h3 { font-size: 1.25rem; }
        .close-btn { color: var(--text-muted); padding: 0.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
        .form-group input { padding: 0.75rem 1rem; background: var(--bg-deep); border: 1px solid var(--border-main); border-radius: 10px; color: var(--text-primary); }
        .form-group input:focus { border-color: var(--border-bright); outline: none; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .days-selector { display: flex; gap: 0.5rem; }
        .day-btn { padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; border: 1px solid var(--border-main); color: var(--text-muted); transition: all 0.15s; }
        .day-btn.active { background: var(--text-primary); color: var(--bg-deep); border-color: transparent; }
        .color-picker { display: flex; gap: 0.5rem; }
        .color-btn { width: 28px; height: 28px; border-radius: 8px; border: 2px solid transparent; transition: transform 0.15s; }
        .color-btn.active { border-color: var(--text-primary); transform: scale(1.1); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 900px) { .schedule-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .schedule-grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; } }
      `}</style>
        </div>
    );
}
