"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Search, Loader2, X, Edit2, Settings } from 'lucide-react';

interface Todo {
    _id: string;
    task: string;
    category: string;
    priority: 'Low' | 'Medium' | 'High';
    dueDate?: string;
    completed: boolean;
}

const INITIAL_CATEGORIES = ['General', 'Academic', 'Technical', 'Personal', 'Essential'];
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
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showCategoryInput, setShowCategoryInput] = useState(false);

    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
    const [todoForm, setTodoForm] = useState({
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
            const fetchedTodos = data.todos || [];
            setTodos(fetchedTodos);

            // Extract unique categories from todos and add to categories list if not already there
            const uniqueCats = Array.from(new Set(fetchedTodos.map((t: Todo) => t.category))) as string[];
            setCategories(prev => {
                const combined = Array.from(new Set([...prev, ...uniqueCats]));
                return combined;
            });
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

    const handleOpenAddModal = () => {
        setEditingTodo(null);
        setTodoForm({ task: '', category: 'General', priority: 'Medium', dueDate: '' });
        setShowModal(true);
    };

    const handleOpenEditModal = (todo: Todo) => {
        setEditingTodo(todo);
        setTodoForm({
            task: todo.task,
            category: todo.category,
            priority: todo.priority,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
        });
        setShowModal(true);
    };

    const saveTodo = async () => {
        if (!todoForm.task.trim()) return;
        setIsSaving(true);
        try {
            const method = editingTodo ? 'PATCH' : 'POST';
            const payload = editingTodo
                ? { ...todoForm, id: editingTodo._id }
                : todoForm;

            const res = await fetch('/api/todos', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json();
                if (editingTodo) {
                    setTodos(prev => prev.map(t => t._id === editingTodo._id ? data.todo : t));
                } else {
                    setTodos(prev => [data.todo, ...prev]);
                }
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error saving todo:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const addCategory = () => {
        if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
            setCategories(prev => [...prev, newCategoryName.trim()]);
            setNewCategoryName('');
            setShowCategoryInput(false);
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
        if (!confirm('Delete this task?')) return;
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
                <button className="add-btn" onClick={handleOpenAddModal}>
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

                    <div className="filter-group">
                        <label>Categories</label>
                        <nav className="filter-nav">
                            <button
                                className={`filter-link ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                All Tasks
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`filter-link ${filter === cat ? 'active' : ''}`}
                                    onClick={() => setFilter(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </nav>

                        <div className="add-category-section">
                            {showCategoryInput ? (
                                <div className="category-input-group">
                                    <input
                                        type="text"
                                        placeholder="Name..."
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                                        autoFocus
                                    />
                                    <div className="cat-btn-group">
                                        <button onClick={addCategory} className="cat-confirm">Add</button>
                                        <button onClick={() => setShowCategoryInput(false)} className="cat-cancel">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button className="add-cat-btn" onClick={() => setShowCategoryInput(true)}>
                                    <Plus size={12} /> New Category
                                </button>
                            )}
                        </div>
                    </div>
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

                                    <div className="actions">
                                        <button className="edit-btn" onClick={() => handleOpenEditModal(todo)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="delete-btn" onClick={() => deleteTodo(todo._id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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
                            <h3>{editingTodo ? 'Edit Task' : 'Record Task'}</h3>
                            <button onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>

                        <div className="input-field">
                            <label>Description</label>
                            <input
                                type="text"
                                value={todoForm.task}
                                onChange={e => setTodoForm({ ...todoForm, task: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="grid-fields">
                            <div className="input-field">
                                <label>Project</label>
                                <select value={todoForm.category} onChange={e => setTodoForm({ ...todoForm, category: e.target.value })}>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="input-field">
                                <label>Level</label>
                                <select value={todoForm.priority} onChange={e => setTodoForm({ ...todoForm, priority: e.target.value as any })}>
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="save-btn" onClick={saveTodo} disabled={isSaving}>
                                {isSaving ? '...' : (editingTodo ? 'Update' : 'Commit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .todo-page { max-width: 1000px; margin: 0 auto; padding: 2.5rem 1.5rem; animation: fadeUp 0.4s ease-out; color: #fff; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3rem; }
        .breadcrumb { font-size: 0.75rem; color: #444; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 0.5rem; display: block; }
        .page-header h1 { font-size: 2.5rem; font-weight: 800; margin: 0; color: #fff; letter-spacing: -0.04em; }
        .page-header p { color: #555; font-size: 0.9375rem; margin-top: 0.25rem; font-weight: 500; }

        .add-btn { background: #fff; color: #000; padding: 0.625rem 1.25rem; border-radius: 8px; font-weight: 700; display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(255,255,255,0.1); }
        .add-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,255,255,0.15); }
        .add-btn:active { transform: translateY(0); }

        .main-layout { display: grid; grid-template-columns: 220px 1fr; gap: 3rem; }
        
        .search-box { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1rem; background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 10px; margin-bottom: 2rem; transition: border-color 0.2s; }
        .search-box:focus-within { border-color: #333; }
        .search-box input { background: none; border: none; font-size: 0.875rem; color: #fff; outline: none; width: 100%; font-weight: 500; }
        .search-box input::placeholder { color: #333; }
        .search-icon { color: #333; }

        .filter-group label { display: block; font-size: 0.6875rem; color: #333; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 1rem; }
        .filter-nav { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1.5rem; }
        .filter-link { text-align: left; padding: 0.625rem 1rem; border-radius: 8px; font-size: 0.875rem; color: #444; transition: all 0.2s; font-weight: 600; }
        .filter-link:hover { background: #0d0d0d; color: #888; }
        .filter-link.active { background: #111; color: #fff; border-left: 3px solid #fff; border-radius: 2px 8px 8px 2px; }

        .add-category-section { border-top: 1px solid #111; padding-top: 1.5rem; }
        .add-cat-btn { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #333; font-weight: 600; padding: 0.5rem 1rem; border-radius: 6px; transition: color 0.2s; }
        .add-cat-btn:hover { color: #888; }
        
        .category-input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .category-input-group input { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; border-radius: 6px; color: #fff; font-size: 0.8125rem; outline: none; }
        .cat-btn-group { display: flex; gap: 0.5rem; }
        .cat-confirm { background: #222; color: #fff; border-radius: 4px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; }
        .cat-cancel { color: #444; font-size: 0.75rem; font-weight: 600; }

        .todo-stack { display: flex; flex-direction: column; gap: 0.75rem; }
        .todo-item { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem 1.5rem; background: #080808; border: 1px solid #111; border-radius: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .todo-item:hover { border-color: #222; transform: translateX(4px); background: #0a0a0a; }
        .todo-item.done { opacity: 0.3; }

        .check-btn { color: #222; transition: all 0.2s; flex-shrink: 0; }
        .check-btn:hover { color: #444; transform: scale(1.1); }
        .done .check-btn { color: #fff; }

        .todo-body { flex: 1; min-width: 0; }
        .todo-body h4 { font-size: 1.0625rem; font-weight: 600; margin-bottom: 0.5rem; color: #fff; letter-spacing: -0.01em; }
        .done h4 { text-decoration: line-through; color: #444; }

        .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .tag { font-size: 0.6875rem; color: #555; background: #0d0d0d; border: 1px solid #111; padding: 0.25rem 0.625rem; border-radius: 6px; display: flex; align-items: center; gap: 0.375rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        
        .tag.priority.high { color: #fff; background: #300; border-color: #500; }
        .tag.priority.medium { color: #888; background: #111; }
        .tag.priority.low { color: #444; background: #050505; }

        .actions { display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.2s; }
        .todo-item:hover .actions { opacity: 1; }
        .edit-btn, .delete-btn { color: #222; transition: all 0.2s; padding: 0.5rem; border-radius: 8px; }
        .edit-btn:hover { color: #fff; background: #111; }
        .delete-btn:hover { color: #ff4444; background: rgba(255,68,68,0.1); }

        .empty { text-align: center; padding: 6rem 0; color: #222; font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #080808; border: 1px solid #151515; padding: 2.5rem; border-radius: 20px; width: 440px; animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        @keyframes modalIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .modal-header h3 { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .modal-header button { color: #333; transition: color 0.2s; }
        .modal-header button:hover { color: #fff; }

        .input-field { display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 1.5rem; }
        .input-field label { font-size: 0.75rem; color: #333; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; }
        .input-field input, .input-field select { background: #050505; border: 1px solid #151515; padding: 0.875rem 1.125rem; border-radius: 10px; color: #fff; outline: none; font-size: 1rem; transition: all 0.2s; font-weight: 500; }
        .input-field input:focus, .input-field select:focus { border-color: #333; background: #080808; }
        
        .grid-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .modal-footer { display: flex; justify-content: flex-end; margin-top: 2rem; }
        .save-btn { background: #fff; color: #000; padding: 0.875rem 2.5rem; border-radius: 10px; font-weight: 800; font-size: 0.9375rem; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255,255,255,0.1); }
        .save-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,0.2); }
        .save-btn:disabled { opacity: 0.5; transform: none; box-shadow: none; }

        @media (max-width: 850px) {
          .main-layout { grid-template-columns: 1fr; gap: 2rem; }
          .filters { display: none; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
        }
      `}</style>
        </div>
    );
}
