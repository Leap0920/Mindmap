"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Search, Loader2, X } from 'lucide-react';

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
        <div className="todo-page">
            <header className="page-header">
                <div className="title-area">
                    <span className="breadcrumb">Workspace / Focus</span>
                    <h1>Tasks</h1>
                    <p>{todos.filter(t => !t.completed).length} pending actions.</p>
                </div>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    <span>Next Task</span>
                </button>
            </header>

            <div className="main-layout">
                <aside className="filters">
                    <div className="search-box">
                        <Search size={14} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Find..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <nav className="filter-nav">
                        <button
                            className={`filter-link ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All Tasks
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                className={`filter-link ${filter === cat ? 'active' : ''}`}
                                onClick={() => setFilter(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="content">
                    {filteredTodos.length === 0 ? (
                        <div className="empty">Clear slate.</div>
                    ) : (
                        <div className="todo-stack">
                            {filteredTodos.map(todo => (
                                <div key={todo._id} className={`todo-item ${todo.completed ? 'done' : ''}`}>
                                    <button className="check-btn" onClick={() => toggleTodo(todo._id, todo.completed)}>
                                        {todo.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                    </button>

                                    <div className="todo-body">
                                        <h4>{todo.task}</h4>
                                        <div className="tags">
                                            <span className="tag">{todo.category}</span>
                                            <span className={`tag priority ${todo.priority.toLowerCase()}`}>{todo.priority}</span>
                                            {todo.dueDate && (
                                                <span className="tag">
                                                    <Calendar size={10} /> {new Date(todo.dueDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button className="delete-btn" onClick={() => deleteTodo(todo._id)}>
                                        <Trash2 size={16} />
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
                            <h3>Record Task</h3>
                            <button onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>

                        <div className="input-field">
                            <label>Description</label>
                            <input
                                type="text"
                                value={newTodo.task}
                                onChange={e => setNewTodo({ ...newTodo, task: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="grid-fields">
                            <div className="input-field">
                                <label>Project</label>
                                <select value={newTodo.category} onChange={e => setNewTodo({ ...newTodo, category: e.target.value })}>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="input-field">
                                <label>Level</label>
                                <select value={newTodo.priority} onChange={e => setNewTodo({ ...newTodo, priority: e.target.value as any })}>
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="save-btn" onClick={addTodo} disabled={isSaving}>
                                {isSaving ? '...' : 'Commit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .todo-page { max-width: 960px; margin: 0 auto; padding: 1.5rem; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
        .breadcrumb { font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; margin: 0.25rem 0; color: #fff; letter-spacing: -0.02em; }
        .page-header p { color: #666; font-size: 0.875rem; }

        .add-btn { background: #fff; color: #000; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; transition: all 0.15s ease; }
        .add-btn:hover { transform: translateY(-1px); }

        .main-layout { display: grid; grid-template-columns: 200px 1fr; gap: 2rem; }
        
        .search-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 8px; margin-bottom: 1.25rem; }
        .search-box input { background: none; border: none; font-size: 0.8125rem; color: #fff; outline: none; width: 100%; }
        .search-box input::placeholder { color: #555; }
        .search-icon { color: #555; }

        .filter-nav { display: flex; flex-direction: column; gap: 0.125rem; }
        .filter-link { text-align: left; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8125rem; color: #777; transition: all 0.15s; }
        .filter-link:hover { background: #0f0f0f; color: #bbb; }
        .filter-link.active { background: #111; color: #fff; font-weight: 600; border-left: 2px solid #fff; border-radius: 0 6px 6px 0; }

        .todo-stack { display: flex; flex-direction: column; gap: 0.5rem; }
        .todo-item { display: flex; align-items: center; gap: 0.875rem; padding: 1rem 1.125rem; background: #0a0a0a; border: 1px solid #181818; border-radius: 10px; transition: all 0.15s; }
        .todo-item:hover { border-color: #252525; background: #0c0c0c; }
        .todo-item.done { opacity: 0.45; }

        .check-btn { color: #444; transition: all 0.15s; flex-shrink: 0; }
        .check-btn:hover { color: #666; }
        .done .check-btn { color: #10b981; }

        .todo-body { flex: 1; min-width: 0; }
        .todo-body h4 { font-size: 0.9375rem; font-weight: 500; margin-bottom: 0.375rem; color: #eee; }
        .done h4 { text-decoration: line-through; color: #555; }

        .tags { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .tag { font-size: 0.625rem; color: #666; background: #111; padding: 0.1875rem 0.5rem; border-radius: 4px; display: flex; align-items: center; gap: 0.25rem; text-transform: uppercase; letter-spacing: 0.03em; font-weight: 500; }
        
        .tag.priority.high { color: #ef4444; background: rgba(239,68,68,0.1); font-weight: 600; }
        .tag.priority.medium { color: #f59e0b; background: rgba(245,158,11,0.1); }
        .tag.priority.low { color: #555; }

        .delete-btn { color: #333; transition: all 0.15s; flex-shrink: 0; padding: 0.25rem; border-radius: 4px; }
        .delete-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

        .empty { text-align: center; padding-top: 4rem; color: #444; font-size: 0.875rem; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #0f0f0f; border: 1px solid #1f1f1f; padding: 1.5rem; border-radius: 14px; width: 400px; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-header h3 { font-size: 1rem; color: #fff; }
        .modal-header button { color: #555; padding: 0.25rem; }
        .modal-header button:hover { color: #999; }
        .input-field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
        .input-field label { font-size: 0.6875rem; color: #666; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }
        .input-field input, .input-field select { background: #080808; border: 1px solid #1f1f1f; padding: 0.625rem 0.875rem; border-radius: 8px; color: #fff; outline: none; font-size: 0.875rem; transition: border-color 0.15s; }
        .input-field input:focus, .input-field select:focus { border-color: #333; }
        .grid-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .modal-footer { display: flex; justify-content: flex-end; margin-top: 1.25rem; }
        .save-btn { background: #fff; color: #000; padding: 0.5rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.8125rem; transition: all 0.15s; }
        .save-btn:hover { transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 800px) {
          .main-layout { grid-template-columns: 1fr; }
          .filters { display: none; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        }
      `}</style>
        </div>
    );
}
