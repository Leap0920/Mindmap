"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Clock, User as UserIcon, MapPin, Plus, X, Loader2, Trash2, CalendarDays } from 'lucide-react';

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
const COLORS = ['#ffffff', '#a3a3a3', '#737373', '#404040', '#262626', '#171717'];

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
        <div className="schedule-page">
            <header className="page-header">
                <div className="title-area">
                    <span className="breadcrumb">Academic / Time Management</span>
                    <h1>Schedule</h1>
                    <p>Optimizing your weekly classes.</p>
                </div>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    <span>Record Class</span>
                </button>
            </header>

            <div className="grid">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <div key={day} className="column">
                        <div className="col-header">
                            <span className="day-name">{day}</span>
                            <span className="count">{getClassesForDay(day).length}</span>
                        </div>
                        <div className="cards">
                            {getClassesForDay(day).length === 0 ? (
                                <div className="empty">Void</div>
                            ) : (
                                getClassesForDay(day).map(cls => (
                                    <div key={cls._id} className="card" style={{ borderLeft: `2px solid ${cls.color}` }}>
                                        <div className="card-top">
                                            <span className="time">{cls.time}</span>
                                            <button className="del" onClick={() => deleteSchedule(cls._id)}><X size={12} /></button>
                                        </div>
                                        <h4>{cls.subject}</h4>
                                        <div className="meta">
                                            {cls.room && <span className="tag">{cls.room}</span>}
                                            {cls.teacher && <span className="tag">{cls.teacher}</span>}
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
                        <h3>Initialize Class</h3>
                        <div className="fields">
                            <label>Subject</label>
                            <input
                                placeholder="Mathematics..."
                                value={newSchedule.subject}
                                onChange={e => setNewSchedule({ ...newSchedule, subject: e.target.value })}
                                autoFocus
                            />

                            <div className="row">
                                <div className="field">
                                    <label>Instructor</label>
                                    <input value={newSchedule.teacher} onChange={e => setNewSchedule({ ...newSchedule, teacher: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Location</label>
                                    <input value={newSchedule.room} onChange={e => setNewSchedule({ ...newSchedule, room: e.target.value })} />
                                </div>
                            </div>

                            <label>Time Block</label>
                            <input placeholder="09:00 - 10:30" value={newSchedule.time} onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })} />

                            <label>Days</label>
                            <div className="day-chips">
                                {DAYS.map(day => (
                                    <button
                                        key={day}
                                        className={`chip ${newSchedule.days.includes(day) ? 'active' : ''}`}
                                        onClick={() => toggleDay(day)}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>

                            <label>Designation</label>
                            <div className="color-selector">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={`color-dot ${newSchedule.color === c ? 'active' : ''}`}
                                        style={{ background: c }}
                                        onClick={() => setNewSchedule({ ...newSchedule, color: c })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="save-btn" onClick={addSchedule} disabled={isSaving}>
                                {isSaving ? '...' : 'Commit Class'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .schedule-page { max-width: 1200px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3.5rem; }
        .breadcrumb { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
        .page-header h1 { font-size: 2.5rem; font-weight: 700; margin: 0.25rem 0; }
        .page-header p { color: var(--text-muted); }

        .add-btn { background: #fff; color: #000; padding: 0.7rem 1.25rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }

        .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1.5rem; }
        .column { display: flex; flex-direction: column; gap: 1.25rem; }
        .col-header { display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-dim); padding-bottom: 0.75rem; margin-bottom: 0.5rem; }
        .day-name { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); }
        .count { font-size: 0.75rem; color: var(--text-dim); }

        .cards { display: flex; flex-direction: column; gap: 0.75rem; }
        .card { background: #0a0a0a; border: 1px solid var(--border-main); padding: 1rem; border-radius: 8px; transition: border-color 0.2s; }
        .card:hover { border-color: var(--border-bright); }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .time { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
        .del { color: var(--text-dim); opacity: 0; transition: opacity 0.2s; }
        .card:hover .del { opacity: 1; }
        
        .card h4 { font-size: 0.85rem; font-weight: 700; margin-bottom: 0.6rem; line-height: 1.4; }
        .meta { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .tag { font-size: 0.65rem; color: var(--text-dim); background: #111; padding: 0.15rem 0.4rem; border-radius: 4px; }
        .empty { text-align: center; font-size: 0.75rem; color: #222; padding: 3rem 0; text-transform: uppercase; letter-spacing: 2px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #111; border: 1px solid var(--border-main); padding: 2rem; border-radius: 12px; width: 440px; }
        .fields { display: flex; flex-direction: column; gap: 0.75rem; }
        .fields label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 0.5rem; }
        .fields input { background: #000; border: 1px solid var(--border-main); padding: 0.75rem 1rem; border-radius: 8px; color: #fff; outline: none; font-size: 0.9rem; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .field { display: flex; flex-direction: column; gap: 0.5rem; }

        .day-chips { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .chip { background: #000; border: 1px solid var(--border-main); padding: 0.4rem 0.6rem; border-radius: 6px; font-size: 0.75rem; color: var(--text-muted); transition: all 0.2s; }
        .chip.active { background: #fff; color: #000; border-color: #fff; font-weight: 700; }

        .color-selector { display: flex; gap: 0.6rem; margin-top: 0.25rem; }
        .color-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; transition: transform 0.2s; }
        .color-dot.active { border-color: #fff; transform: scale(1.1); }

        .modal-footer { display: flex; justify-content: flex-end; margin-top: 2rem; }
        .save-btn { background: #fff; color: #000; padding: 0.7rem 2rem; border-radius: 8px; font-weight: 700; }

        @media (max-width: 1000px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; } }
      `}</style>
        </div>
    );
}
