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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#ffffff', '#a3a3a3', '#737373', '#404040', '#262626', '#171717'];
const TIME_SLOTS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

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

    const [selectedDay, setSelectedDay] = useState(() => {
        // Default to current day if possible
        const dayNum = new Date().getDay(); // 0=Sun, 1=Mon...
        if (dayNum === 0) return 'Mon'; 
        return DAYS[dayNum - 1] || 'Mon';
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

    const getClassesForSlotAndDay = (slotStart: string, dayShort: string) => {
        // Simple check: does the class start within this hour slot?
        // Larger implementation would handle spans, but for the 'modern grid' look we'll start with presence.
        return schedules.filter(s => {
            const isDay = s.days.includes(dayShort);
            if (!isDay) return false;

            // Extract HH from slotStart (e.g. "07:00" -> 7)
            const slotHour = parseInt(slotStart.split(':')[0]);

            // Extract HH from class time (e.g. "07:30 - 09:00" -> 7)
            const scheduleMatch = s.time.match(/(\d{1,2})[:.](\d{2})/);
            if (!scheduleMatch) return false;

            const startHour = parseInt(scheduleMatch[1]);
            // Handle 12-hour vs 24-hour loosely or assume 24-hour/formatted correctly
            // If class starts in this hour, show it
            return startHour === slotHour;
        });
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

            <div className="schedule-workspace">
                <div className="mobile-day-selector">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            className={`mobile-day-btn ${selectedDay === day ? 'active' : ''}`}
                            onClick={() => setSelectedDay(day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                <div className="table-container desktop-view">
                    <div className="grid-table">
                        {/* Header Row */}
                        <div className="grid-header-row">
                            <div className="time-header-cell">TIME</div>
                            {DAYS.map(day => (
                                <div key={day} className="day-header-cell">{day.toUpperCase()}</div>
                            ))}
                        </div>

                        {/* Time Rows */}
                        {TIME_SLOTS.map((slot, sIdx) => {
                            const endSlot = TIME_SLOTS[sIdx + 1] || '20:00';
                            return (
                                <div key={slot} className="grid-row">
                                    <div className="time-label-cell">
                                        <span className="time-range">{slot} - {endSlot}</span>
                                    </div>
                                    {DAYS.map(day => {
                                        const classes = getClassesForSlotAndDay(slot, day);
                                        return (
                                            <div key={`${day}-${slot}`} className="grid-cell">
                                                {classes.map(cls => (
                                                    <div key={cls._id} className="grid-class-card" style={{ borderLeftColor: cls.color }}>
                                                        <div className="class-inner">
                                                            <div className="class-header">
                                                                <span className="exact-time">{cls.time}</span>
                                                                <button className="mini-del" onClick={() => deleteSchedule(cls._id)}><X size={10} /></button>
                                                            </div>
                                                            <h4 className="class-title">{cls.subject}</h4>
                                                            <div className="class-meta">
                                                                {cls.room && <span className="m-tag">{cls.room}</span>}
                                                                {cls.teacher && <span className="m-tag">{cls.teacher}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mobile-schedule-view">
                    {TIME_SLOTS.map((slot, sIdx) => {
                        const endSlot = TIME_SLOTS[sIdx + 1] || '20:00';
                        const classes = getClassesForSlotAndDay(slot, selectedDay);
                        // Skip empty slots in mobile view to save space? 
                        // Or keep them for structure? Let's keep them but make them small.
                        // Actually, users prefer to see "Free Time" or just gaps.
                        // To be "responsive and easy to use", a list of classes is better, but seeing gaps is useful.
                        // I will render all, but empty ones will be minimal.
                        
                        return (
                            <div key={slot} className="mobile-slot-row">
                                <div className="m-slot-time">
                                    <span>{slot}</span>
                                </div>
                                <div className="m-slot-content">
                                    {classes.length > 0 ? (
                                        classes.map(cls => (
                                            <div key={cls._id} className="m-class-card" style={{ borderLeft: `4px solid ${cls.color}` }}>
                                                <div className="m-card-top">
                                                    <span className="m-card-time">{cls.time}</span>
                                                    <button className="mini-del" onClick={() => deleteSchedule(cls._id)}><X size={14} /></button>
                                                </div>
                                                <div className="m-card-subject">{cls.subject}</div>
                                                <div className="m-card-info">
                                                    {cls.room && <span className="m-info-tag">{cls.room}</span>}
                                                    {cls.teacher && <span className="m-info-tag">{cls.teacher}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="m-empty-slot"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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
            background: #000;
            color: #fff;
            padding: 2rem 2rem 2rem 1.5rem;
            animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        @keyframes fadeUp { 
            from { opacity: 0; transform: translateY(24px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .page-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-bottom: 2.5rem;
            width: 100%;
            max-width: 1400px;
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
            font-size: 2rem; 
            font-weight: 800; 
            margin: 0; 
            color: #fff; 
            letter-spacing: -0.04em; 
        }

        .page-header p { 
            color: #555; 
            font-size: 0.875rem; 
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

        .schedule-workspace {
            width: 100%;
            max-width: 1400px;
            border: 1px solid rgba(255,255,255,0.4);
            background: rgba(255,255,255,0.01);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 40px 100px rgba(0,0,0,0.5);
        }

        .table-container {
            width: 100%;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .grid-table {
            display: grid;
            min-width: 900px;
        }

        .grid-header-row {
            display: grid;
            grid-template-columns: 90px repeat(6, 1fr);
            background: rgba(255,255,255,0.08);
            border-bottom: 1px solid rgba(255,255,255,0.4);
        }

        .time-header-cell, .day-header-cell {
            padding: 0.875rem;
            font-size: 0.6rem;
            font-weight: 900;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            text-align: left;
            border-right: 1px solid rgba(255,255,255,0.2);
        }

        .grid-row {
            display: grid;
            grid-template-columns: 90px repeat(6, 1fr);
            border-bottom: 1px solid rgba(255,255,255,0.4);
            min-height: 70px;
        }

        .time-label-cell {
            padding: 0.5rem;
            background: rgba(255,255,255,0.02);
            border-right: 1px solid rgba(255,255,255,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .time-range {
            font-size: 0.55rem;
            font-weight: 900;
            color: #333;
            letter-spacing: 0;
            text-align: center;
        }

        .grid-cell {
            border-right: 1px solid rgba(255,255,255,0.4);
            padding: 0.35rem;
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
        }

        .grid-class-card {
            background: #080808;
            border: 1px solid rgba(255,255,255,0.15);
            border-left: 2px solid #fff;
            border-radius: 8px;
            padding: 0.6rem;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            z-index: 2;
        }

        .grid-class-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255,255,255,0.3);
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            background: #0d0d0d;
        }

        .class-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.4rem;
        }

        .exact-time {
            font-size: 0.5rem;
            font-weight: 900;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .mini-del {
            background: none;
            border: none;
            color: #333;
            cursor: pointer;
            padding: 2px;
            transition: color 0.2s;
        }
        .mini-del:hover { color: #fff; }

        .class-title {
            font-size: 0.75rem;
            font-weight: 800;
            color: #fff;
            margin: 0 0 0.4rem 0;
            line-height: 1.1;
        }

        .class-meta {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .m-tag {
            font-size: 0.5rem;
            color: #444;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
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

        /* Default: Desktop View */
        .mobile-day-selector, .mobile-schedule-view { display: none; }
        .desktop-view { display: block; }

        /* Mobile specific components */
        .mobile-day-selector {
            gap: 12px;
            overflow-x: auto;
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            background: #000;
            scrollbar-width: none;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        .mobile-day-selector::-webkit-scrollbar { display: none; }
        
        .mobile-day-btn {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.2);
            color: #666;
            padding: 8px 16px;
            border-radius: 100px;
            font-size: 0.85rem;
            font-weight: 700;
            white-space: nowrap;
            transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .mobile-day-btn.active {
            background: #fff;
            color: #000;
            border-color: #fff;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(255,255,255,0.2);
        }

        .mobile-schedule-view { padding: 20px; padding-bottom: 100px; }
        .mobile-slot-row { display: flex; gap: 16px; margin-bottom: 0; min-height: 50px; position: relative; }
        
        /* Vertical line guide */
        .mobile-slot-row::before {
            content: '';
            position: absolute;
            left: 58px;
            top: 0;
            bottom: 0;
            width: 1px;
            background: rgba(255,255,255,0.1);
        }

        .m-slot-time { 
            width: 50px; 
            flex-shrink: 0; 
            font-size: 0.75rem; 
            color: #444; 
            font-weight: 700; 
            text-align: right; 
            padding-top: 10px;
            line-height: 1;
        }
        
        .m-slot-content { 
            flex-grow: 1; 
            padding-left: 8px; 
            padding-bottom: 24px;
        }
        
        .m-empty-slot { 
            /* Minimal visual for empty slot */
        }

        .m-class-card {
            background: #0a0a0a;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .m-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .m-card-time { font-size: 0.75rem; color: #888; font-weight: 700; }
        .m-card-subject { font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 8px; line-height: 1.2; }
        .m-card-info { display: flex; gap: 8px; flex-wrap: wrap; }
        .m-info-tag { font-size: 0.7rem; background: rgba(255,255,255,0.08); padding: 6px 10px; border-radius: 6px; color: #ccc; font-weight: 600; display: flex; align-items: center; gap: 4px; }

        @media (max-width: 1024px) {
            .schedule-page { padding: 1.5rem; }
            .grid-table { min-width: 800px; }
        }

        @media (max-width: 768px) {
            .desktop-view { display: none; }
            .mobile-day-selector, .mobile-schedule-view { display: block; }
            .mobile-day-selector { display: flex; }
            
            .schedule-page { padding: 0; background: #000; }
            .page-header { padding: 20px 20px 0 20px; margin-bottom: 10px; flex-direction: row; align-items: center; }
            .page-header h1 { font-size: 1.5rem; }
            .breadcrumb { display: none; } /* simplify header */
            .page-header p { display: none; } 
            
            .schedule-workspace { border: none; background: transparent; box-shadow: none; }
            
            /* Transform Add Button to Floating Action Button */
            .add-btn { 
                position: fixed; 
                bottom: 30px; 
                right: 24px; 
                z-index: 900; 
                width: 60px; 
                height: 60px; 
                border-radius: 50%; 
                padding: 0; 
                justify-content: center;
                box-shadow: 0 8px 30px rgba(255,255,255,0.2);
                background: #fff;
                color: #000;
            }
            .add-btn span { display: none; }
            .add-btn svg { width: 28px; height: 28px; }

            .modal-box { 
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                border-radius: 24px 24px 0 0;
                padding: 32px 24px;
                animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
                border: none;
                border-top: 1px solid rgba(255,255,255,0.2);
            }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            
            .fields input { font-size: 16px; /* prevent zoom on iOS */ }
        }
      `}</style>
        </div>
    );
}
