"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Hash, Search, Loader2, X } from 'lucide-react';

interface Todo {
    _id: string;
    task: string;
    category: string;
    priority: 'Low' | 'Medium' | 'High';
    dueDate?: string;
    completed: boolean;
}

const CATEGORIES = ['General', 'Academic', 'Technical', 'Personal', 'Essential'];
const PRIORITIES = ['Low', 'Medium', 'High'] as const;

export default function TodoPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newTodo, setNewTodo] = useState({
        task: '',
        category: 'General',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        dueDate: '',
    });

    const fetchTodos = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/todos');
            const data = await res.json();
            setTodos(data.todos || []);
        } catch (error) {
            console.error('Error fetching todos:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchTodos();
        }
    }, [status, router, fetchTodos]);

    const addTodo = async () => {
        if (!newTodo.task.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTodo),
            });
            if (res.ok) {
                const data = await res.json();
                setTodos(prev => [data.todo, ...prev]);
                setNewTodo({ task: '', category: 'General', priority: 'Medium', dueDate: '' });
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTodo = async (id: string, completed: boolean) => {
        try {
            const res = await fetch('/api/todos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, completed: !completed }),
            });
            if (res.ok) {
                setTodos(prev => prev.map(t => t._id === id ? { ...t, completed: !completed } : t));
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    };

    const deleteTodo = async (id: string) => {
        try {
            await fetch('/api/todos', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setTodos(prev => prev.filter(t => t._id !== id));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const filteredTodos = todos.filter(todo => {
        const matchesFilter = filter === 'all' || todo.category === filter;
        const matchesSearch = todo.task.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const completedCount = todos.filter(t => t.completed).length;

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Loading tasks...</span>
                <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: var(--text-muted); }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="todo-page">
            <header className="page-header">
                <div className="title-area">
                    <div className="status-badge">{todos.length} Tasks • {completedCount} Done</div>
                    <h1 className="text-gradient">Task Matrix</h1>
                    <p>Prioritize your focus and eliminate distractions.</p>
                </div>
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    <span>New Task</span>
                </button>
            </header>

            <div className="todo-layout">
                <aside className="todo-nav">
                    <div className="search-bar glass-panel">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Filter tasks..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="nav-section">
                        <span className="section-label">Category</span>
                        <button
                            className={`nav-btn ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Tasks
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`nav-btn ${filter === cat ? 'active' : ''}`}
                                onClick={() => setFilter(cat)}
                            >
                                <Hash size={14} /> {cat}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="todo-content">
                    {filteredTodos.length === 0 ? (
                        <div className="empty-state">
                            <p>No tasks found.</p>
                            <button className="primary-btn" onClick={() => setShowModal(true)}>
                                <Plus size={18} /> Add your first task
                            </button>
                        </div>
                    ) : (
                        <div className="todo-list">
                            {filteredTodos.map(todo => (
                                <div
                                    key={todo._id}
                                    className={`todo-row premium-card ${todo.completed ? 'is-done' : ''}`}
                                >
                                    <div className="check-zone" onClick={() => toggleTodo(todo._id, todo.completed)}>
                                        {todo.completed ? (
                                            <CheckCircle2 size={24} className="check-success" />
                                        ) : (
                                            <Circle size={24} className="check-idle" />
                                        )}
                                    </div>
                                    <div className="todo-info">
                                        <h4>{todo.task}</h4>
                                        <div className="meta-info">
                                            <span className="category-tag">{todo.category}</span>
                                            <span className={`priority-tag ${todo.priority.toLowerCase()}`}>{todo.priority}</span>
                                            {todo.dueDate && (
                                                <span className="due-tag">
                                                    <Calendar size={12} /> {new Date(todo.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button className="delete-btn" onClick={() => deleteTodo(todo._id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>New Task</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className="form-group">
                            <label>Task</label>
                            <input
                                type="text"
                                placeholder="What needs to be done?"
                                value={newTodo.task}
                                onChange={e => setNewTodo({ ...newTodo, task: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={newTodo.category}
                                    onChange={e => setNewTodo({ ...newTodo, category: e.target.value })}
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={newTodo.priority}
                                    onChange={e => setNewTodo({ ...newTodo, priority: e.target.value as any })}
                                >
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Due Date (Optional)</label>
                            <input
                                type="date"
                                value={newTodo.dueDate}
                                onChange={e => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={addTodo} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .todo-page { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
        .status-badge { font-size: 0.75rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-header p { color: var(--text-muted); }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); font-weight: 600; border-radius: 10px; }
        .primary-btn:hover { transform: translateY(-2px); }
        .secondary-btn { padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border-main); color: var(--text-secondary); border-radius: 10px; font-weight: 500; }
        .todo-layout { display: grid; grid-template-columns: 260px 1fr; gap: 2rem; }
        .todo-nav { display: flex; flex-direction: column; gap: 1.5rem; }
        .search-bar { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 10px; }
        .search-bar input { flex: 1; background: none; border: none; color: var(--text-primary); }
        .search-bar input::placeholder { color: var(--text-muted); }
        .nav-section { display: flex; flex-direction: column; gap: 0.25rem; }
        .section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 0.5rem; padding: 0 0.5rem; }
        .nav-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.75rem; border-radius: 8px; color: var(--text-secondary); font-size: 0.9rem; text-align: left; transition: all 0.15s; }
        .nav-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .nav-btn.active { background: var(--accent-soft); color: var(--text-primary); font-weight: 600; }
        .todo-content { min-height: 400px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 1rem; color: var(--text-muted); }
        .todo-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .todo-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-radius: 12px; transition: all 0.2s; }
        .todo-row:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .todo-row.is-done { opacity: 0.6; }
        .check-zone { cursor: pointer; flex-shrink: 0; }
        .check-success { color: #4ade80; }
        .check-idle { color: var(--text-dim); }
        .todo-info { flex: 1; min-width: 0; }
        .todo-info h4 { font-size: 1rem; font-weight: 500; margin-bottom: 0.5rem; }
        .is-done .todo-info h4 { text-decoration: line-through; color: var(--text-muted); }
        .meta-info { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .category-tag { font-size: 0.75rem; padding: 0.2rem 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: var(--text-muted); }
        .priority-tag { font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; }
        .priority-tag.high { background: rgba(239, 68, 68, 0.2); color: #f87171; }
        .priority-tag.medium { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
        .priority-tag.low { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .due-tag { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--text-dim); }
        .delete-btn { padding: 0.5rem; color: var(--text-dim); border-radius: 8px; transition: all 0.15s; }
        .delete-btn:hover { color: #f87171; background: rgba(239, 68, 68, 0.1); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 1.5rem; width: 90%; max-width: 480px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-header h3 { font-size: 1.25rem; }
        .close-btn { color: var(--text-muted); padding: 0.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
        .form-group input, .form-group select { padding: 0.75rem 1rem; background: var(--bg-deep); border: 1px solid var(--border-main); border-radius: 10px; color: var(--text-primary); }
        .form-group input:focus, .form-group select:focus { border-color: var(--border-bright); outline: none; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .todo-layout { grid-template-columns: 1fr; }
          .todo-nav { display: none; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        }
      `}</style>
        </div>
    );
}
