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
        .schedule-page { max-width: 1100px; margin: 0 auto; padding: 1.5rem; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
        .breadcrumb { font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0.25rem 0; color: #fff; letter-spacing: -0.02em; }
        .page-header p { color: #666; font-size: 0.875rem; }

        .add-btn { background: #fff; color: #000; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; transition: all 0.15s ease; }
        .add-btn:hover { transform: translateY(-1px); }

        .grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; }
        .column { display: flex; flex-direction: column; gap: 1rem; }
        .col-header { display: flex; justify-content: space-between; border-bottom: 1px solid #1a1a1a; padding-bottom: 0.625rem; margin-bottom: 0.375rem; }
        .day-name { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #555; }
        .count { font-size: 0.6875rem; color: #444; background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; }

        .cards { display: flex; flex-direction: column; gap: 0.5rem; }
        .card { background: #0a0a0a; border: 1px solid #181818; padding: 0.875rem; border-radius: 10px; transition: all 0.15s; }
        .card:hover { border-color: #252525; background: #0c0c0c; }
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; }
        .time { font-size: 0.625rem; color: #666; font-weight: 600; background: #111; padding: 0.125rem 0.375rem; border-radius: 4px; }
        .del { color: #444; opacity: 0; transition: all 0.15s; padding: 0.125rem; border-radius: 4px; }
        .card:hover .del { opacity: 1; }
        .del:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
        
        .card h4 { font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.5rem; line-height: 1.4; color: #eee; }
        .meta { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .tag { font-size: 0.5625rem; color: #555; background: #111; padding: 0.125rem 0.375rem; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.03em; }
        .empty { text-align: center; font-size: 0.6875rem; color: #2a2a2a; padding: 2.5rem 0; text-transform: uppercase; letter-spacing: 2px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #0f0f0f; border: 1px solid #1f1f1f; padding: 1.5rem; border-radius: 14px; width: 400px; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-box h3 { font-size: 1rem; margin-bottom: 1.25rem; color: #fff; }
        .fields { display: flex; flex-direction: column; gap: 0.625rem; }
        .fields label { font-size: 0.6875rem; color: #666; text-transform: uppercase; font-weight: 600; margin-top: 0.375rem; letter-spacing: 0.05em; }
        .fields input { background: #080808; border: 1px solid #1f1f1f; padding: 0.625rem 0.875rem; border-radius: 8px; color: #fff; outline: none; font-size: 0.875rem; transition: border-color 0.15s; }
        .fields input:focus { border-color: #333; }
        .fields input::placeholder { color: #444; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .field { display: flex; flex-direction: column; gap: 0.375rem; }

        .day-chips { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .chip { background: #080808; border: 1px solid #1f1f1f; padding: 0.375rem 0.625rem; border-radius: 6px; font-size: 0.75rem; color: #666; transition: all 0.15s; }
        .chip:hover { border-color: #333; color: #999; }
        .chip.active { background: #fff; color: #000; border-color: #fff; font-weight: 600; }

        .color-selector { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
        .color-dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid transparent; transition: all 0.15s; cursor: pointer; }
        .color-dot:hover { transform: scale(1.1); }
        .color-dot.active { border-color: #fff; transform: scale(1.15); }

        .modal-footer { display: flex; justify-content: flex-end; margin-top: 1.5rem; }
        .save-btn { background: #fff; color: #000; padding: 0.5rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.8125rem; transition: all 0.15s; }
        .save-btn:hover { transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 1000px) { .grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; } }
      `}</style>
        </div>
    );
}
