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
        .schedule-page { 
            min-height: 100vh;
            background: #080808;
            color: #fff;
            padding: 40px;
            animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeUp { 
            from { opacity: 0; transform: translateY(16px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .page-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-bottom: 48px;
            max-width: 1400px;
            margin-left: auto;
            margin-right: auto;
        }

        .breadcrumb { 
            font-size: 0.75rem; 
            color: #444; 
            text-transform: uppercase; 
            letter-spacing: 0.12em; 
            font-weight: 700;
            display: block;
            margin-bottom: 8px;
        }

        .page-header h1 { 
            font-size: 2.5rem; 
            font-weight: 800; 
            margin: 0; 
            color: #fff; 
            letter-spacing: -0.04em; 
        }

        .page-header p { 
            color: #555; 
            font-size: 1rem; 
            font-weight: 500;
            margin-top: 4px;
        }

        .add-btn { 
            background: #fff; 
            color: #000; 
            padding: 10px 20px; 
            border-radius: 8px; 
            font-weight: 700; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .add-btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(255,255,255,0.2);
        }

        .grid { 
            display: grid; 
            grid-template-columns: repeat(5, 1fr); 
            gap: 24px; 
            max-width: 1400px;
            margin-left: auto;
            margin-right: auto;
        }

        .column { 
            display: flex; 
            flex-direction: column; 
            gap: 16px; 
        }

        .col-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            border-bottom: 1px solid #151515; 
            padding-bottom: 12px;
            margin-bottom: 8px;
        }

        .day-name { 
            font-size: 0.75rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 0.15em; 
            color: #444; 
        }

        .count { 
            font-size: 0.6875rem; 
            color: #888; 
            background: #111; 
            padding: 2px 8px; 
            border-radius: 4px;
            font-weight: 700;
        }

        .cards { 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
        }

        .card { 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            padding: 16px; 
            border-radius: 12px; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .card:hover { 
            border-color: #252525; 
            background: #0d0d0d;
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .card-top { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 12px; 
        }

        .time { 
            font-size: 0.625rem; 
            color: #888; 
            font-weight: 800; 
            background: #151515; 
            padding: 4px 8px; 
            border-radius: 6px;
            letter-spacing: 0.05em;
        }

        .del { 
            color: #333; 
            opacity: 0; 
            transition: all 0.2s; 
            padding: 4px; 
            border-radius: 6px; 
        }

        .card:hover .del { 
            opacity: 1; 
        }

        .del:hover { 
            color: #ff4444; 
            background: rgba(255, 68, 68, 0.1); 
        }
        
        .card h4 { 
            font-size: 0.9375rem; 
            font-weight: 700; 
            margin-bottom: 12px; 
            line-height: 1.4; 
            color: #fff; 
            letter-spacing: -0.01em;
        }

        .meta { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 6px; 
        }

        .tag { 
            font-size: 0.625rem; 
            color: #555; 
            background: #080808; 
            border: 1px solid #151515;
            padding: 3px 8px; 
            border-radius: 6px; 
            text-transform: uppercase; 
            letter-spacing: 0.05em;
            font-weight: 700;
        }

        .empty { 
            text-align: center; 
            font-size: 0.6875rem; 
            color: #1a1a1a; 
            padding: 40px 0; 
            text-transform: uppercase; 
            letter-spacing: 4px;
            font-weight: 800;
        }

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
            padding: 40px; 
            border-radius: 20px; 
            width: 440px; 
            animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
            box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }

        @keyframes modalIn { 
            from { opacity: 0; transform: translateY(24px) scale(0.95); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .modal-box h3 { 
            font-size: 1.25rem; 
            font-weight: 800;
            margin-bottom: 32px; 
            color: #fff; 
            letter-spacing: -0.02em;
        }

        .fields { 
            display: flex; 
            flex-direction: column; 
            gap: 20px; 
        }

        .fields label { 
            font-size: 0.75rem; 
            color: #333; 
            text-transform: uppercase; 
            font-weight: 800; 
            letter-spacing: 0.1em; 
        }

        .fields input { 
            background: #050505; 
            border: 1px solid #151515; 
            padding: 12px 16px; 
            border-radius: 10px; 
            color: #fff; 
            outline: none; 
            font-size: 0.9375rem; 
            transition: all 0.2s; 
            font-weight: 500;
        }

        .fields input:focus { 
            border-color: #333; 
            background: #080808;
        }

        .fields input::placeholder { color: #222; }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 8px; }

        .day-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip { 
            background: #050505; 
            border: 1px solid #151515; 
            padding: 8px 14px; 
            border-radius: 8px; 
            font-size: 0.8125rem; 
            color: #444; 
            transition: all 0.2s; 
            font-weight: 700;
        }

        .chip:hover { border-color: #333; color: #888; }
        .chip.active { background: #fff; color: #000; border-color: #fff; }

        .color-selector { display: flex; gap: 10px; }
        .color-dot { 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            border: 2px solid transparent; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
            cursor: pointer; 
        }

        .color-dot:hover { transform: scale(1.2); }
        .color-dot.active { border-color: #fff; transform: scale(1.3); }

        .modal-footer { 
            display: flex; 
            justify-content: flex-end; 
            margin-top: 40px; 
        }

        .save-btn { 
            background: #fff; 
            color: #000; 
            padding: 12px 32px; 
            border-radius: 10px; 
            font-weight: 800; 
            font-size: 0.9375rem; 
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .save-btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 24px rgba(255,255,255,0.2);
        }

        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        @media (max-width: 1200px) { .grid { grid-template-columns: repeat(3, 1fr); padding: 0 20px; } }
        @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: flex-start; gap: 24px; padding: 0 20px; } }
      `}</style>
        </div>
    );
}
