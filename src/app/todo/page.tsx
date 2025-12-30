"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Search, Loader2, X, Edit2, Settings, Paperclip, Image as ImageIcon, FileText, ChevronRight } from 'lucide-react';

interface Todo {
    _id: string;
    task: string;
    category: string;
    priority: 'Low' | 'Medium' | 'High';
    dueDate?: string;
    completed: boolean;
    description?: string;
    attachments?: { name: string; url: string; fileType: string }[];
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
    const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
    const [tempCatName, setTempCatName] = useState('');
    const [todoForm, setTodoForm] = useState({
        task: '',
        category: 'General',
        priority: 'Medium' as 'Low' | 'Medium' | 'High',
        dueDate: '',
        description: '',
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
        setTodoForm({ task: '', category: 'General', priority: 'Medium', dueDate: '', description: '' });
        setShowModal(true);
    };

    const handleOpenEditModal = (todo: Todo) => {
        setEditingTodo(todo);
        setTodoForm({
            task: todo.task,
            category: todo.category,
            priority: todo.priority,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
            description: todo.description || '',
        });
        setShowModal(true);
    };

    const openDetails = (todo: Todo) => {
        setEditingTodo(todo);
        setTodoForm({
            task: todo.task,
            category: todo.category,
            priority: todo.priority,
            dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
            description: todo.description || '',
        });
        setSelectedTodoId(todo._id);
    };

    const saveTodo = async (overrideForm?: any) => {
        const currentForm = overrideForm || todoForm;
        if (!currentForm.task.trim()) return;
        setIsSaving(true);
        try {
            const method = editingTodo ? 'PATCH' : 'POST';
            const payload = editingTodo
                ? { ...currentForm, id: editingTodo._id }
                : currentForm;

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

    const startRename = (cat: string) => {
        setEditingCategoryName(cat);
        setTempCatName(cat);
    };

    const finalizeRename = async (oldName: string) => {
        if (!tempCatName.trim() || tempCatName === oldName) {
            setEditingCategoryName(null);
            return;
        }

        try {
            const res = await fetch('/api/todos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'renameCategory', oldName, newName: tempCatName.trim() }),
            });

            if (res.ok) {
                setCategories(prev => prev.map(c => c === oldName ? tempCatName.trim() : c));
                setTodos(prev => prev.map(t => t.category === oldName ? { ...t, category: tempCatName.trim() } : t));
                if (filter === oldName) setFilter(tempCatName.trim());
            }
        } catch (err) {
            console.error('Rename error:', err);
        } finally {
            setEditingCategoryName(null);
        }
    };

    const handleDeleteCategory = async (catName: string) => {
        if (!confirm(`Delete "${catName}"? Todos will be moved to General.`)) return;

        try {
            const res = await fetch('/api/todos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'deleteCategory', oldName: catName }),
            });

            if (res.ok) {
                setCategories(prev => prev.filter(c => c !== catName));
                setTodos(prev => prev.map(t => t.category === catName ? { ...t, category: 'General' } : t));
                if (filter === catName) setFilter('all');
            }
        } catch (err) {
            console.error('Delete error:', err);
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
            if (selectedTodoId === id) setSelectedTodoId(null);
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    const addMockAttachment = async (type: 'image' | 'file') => {
        if (!editingTodo) return;
        const newAttachment = type === 'image'
            ? { name: 'Dashboard_Mockup.png', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', fileType: 'image/png' }
            : { name: 'Project_Requirements.pdf', url: '#', fileType: 'application/pdf' };

        const updatedAttachments = [...(editingTodo.attachments || []), newAttachment];
        const res = await fetch('/api/todos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingTodo._id, attachments: updatedAttachments }),
        });

        if (res.ok) {
            const data = await res.json();
            setTodos(prev => prev.map(t => t._id === editingTodo._id ? data.todo : t));
            setEditingTodo(data.todo);
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
                                <div key={cat} className="filter-item">
                                    <button
                                        className={`filter-link ${filter === cat ? 'active' : ''}`}
                                        onClick={() => setFilter(cat)}
                                    >
                                        {editingCategoryName === cat ? (
                                            <input
                                                className="cat-rename-input"
                                                value={tempCatName}
                                                onChange={e => setTempCatName(e.target.value)}
                                                onBlur={() => finalizeRename(cat)}
                                                onKeyDown={e => e.key === 'Enter' && finalizeRename(cat)}
                                                onClick={e => e.stopPropagation()}
                                                autoFocus
                                            />
                                        ) : (
                                            <span>{cat}</span>
                                        )}
                                    </button>
                                    {cat !== 'General' && editingCategoryName !== cat && (
                                        <div className="filter-actions">
                                            <button onClick={(e) => { e.stopPropagation(); startRename(cat); }}><Edit2 size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}><Trash2 size={12} /></button>
                                        </div>
                                    )}
                                </div>
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
                                <div
                                    key={todo._id}
                                    className={`todo-item ${todo.completed ? 'done' : ''} ${selectedTodoId === todo._id ? 'selected' : ''}`}
                                    onClick={() => openDetails(todo)}
                                >
                                    <button className="check-btn" onClick={(e) => { e.stopPropagation(); toggleTodo(todo._id, todo.completed); }}>
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
                                            {todo.description && <span className="tag-icon"><FileText size={10} /></span>}
                                            {todo.attachments && todo.attachments.length > 0 && <span className="tag-icon"><Paperclip size={10} /></span>}
                                        </div>
                                    </div>

                                    <div className="actions">
                                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteTodo(todo._id); }}>
                                            <Trash2 size={16} />
                                        </button>
                                        <ChevronRight size={16} className="arrow-icon" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Detail Sidebar */}
                {selectedTodoId && editingTodo && (
                    <aside className="detail-sidebar">
                        <div className="detail-header">
                            <button className="close-sidebar" onClick={() => setSelectedTodoId(null)}>
                                <X size={20} />
                            </button>
                            <div className="header-actions">
                                <button className="detail-delete" onClick={() => deleteTodo(editingTodo._id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="detail-content">
                            <textarea
                                className="detail-title-input"
                                value={todoForm.task}
                                onChange={e => {
                                    const newForm = { ...todoForm, task: e.target.value };
                                    setTodoForm(newForm);
                                    saveTodo(newForm);
                                }}
                                placeholder="Task title..."
                            />

                            <div className="detail-meta">
                                <div className="meta-row">
                                    <label><Settings size={14} /> Project</label>
                                    <select
                                        value={todoForm.category}
                                        onChange={e => {
                                            const newForm = { ...todoForm, category: e.target.value };
                                            setTodoForm(newForm);
                                            saveTodo(newForm);
                                        }}
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="meta-row">
                                    <label><Settings size={14} /> Priority</label>
                                    <select
                                        value={todoForm.priority}
                                        onChange={e => {
                                            const newForm = { ...todoForm, priority: e.target.value as any };
                                            setTodoForm(newForm);
                                            saveTodo(newForm);
                                        }}
                                    >
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="meta-row">
                                    <label><Calendar size={14} /> Due Date</label>
                                    <input
                                        type="date"
                                        value={todoForm.dueDate}
                                        onChange={e => {
                                            const newForm = { ...todoForm, dueDate: e.target.value };
                                            setTodoForm(newForm);
                                            saveTodo(newForm);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="detail-section">
                                <label className="section-label">Description</label>
                                <textarea
                                    className="description-area"
                                    placeholder="Add more details, links, or notes..."
                                    value={todoForm.description}
                                    onChange={e => {
                                        setTodoForm({ ...todoForm, description: e.target.value });
                                    }}
                                    onBlur={() => saveTodo()}
                                />
                            </div>

                            <div className="detail-section">
                                <div className="section-header">
                                    <label className="section-label">Attachments</label>
                                    <div className="attachment-actions">
                                        <button className="add-attachment" onClick={() => addMockAttachment('image')} title="Add Image">
                                            <ImageIcon size={14} />
                                        </button>
                                        <button className="add-attachment" onClick={() => addMockAttachment('file')} title="Add File">
                                            <Paperclip size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="attachments-grid">
                                    {editingTodo.attachments && editingTodo.attachments.length > 0 ? (
                                        editingTodo.attachments.map((file, i) => (
                                            <div key={i} className="attachment-card" onClick={() => file.url !== '#' && window.open(file.url)}>
                                                {file.fileType.startsWith('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                                                <div className="file-info">
                                                    <span className="file-name">{file.name}</span>
                                                    <span className="file-size">2.4 MB</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="attachments-empty" onClick={() => addMockAttachment('image')}>
                                            <Paperclip size={24} />
                                            <p>No files attached. Click to add.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                )}
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
        .search-box input::placeholder { color: #555; }
        .search-icon { color: #555; }

        .filter-group label { display: block; font-size: 0.6875rem; color: #666; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; margin-bottom: 1rem; }
        .filter-nav { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 1.5rem; }
        .filter-item { position: relative; group; display: flex; align-items: center; justify-content: space-between; border-radius: 8px; transition: background 0.2s; }
        .filter-item:hover { background: #0d0d0d; }
        .filter-link { flex: 1; text-align: left; padding: 0.625rem 1rem; font-size: 0.875rem; color: #444; transition: all 0.2s; font-weight: 600; border: none; background: none; cursor: pointer; }
        .filter-link:hover { color: #888; }
        .filter-link.active { background: #111; color: #fff; border-left: 3px solid #fff; border-radius: 2px 8px 8px 2px; }
        
        .filter-actions { display: flex; gap: 0.5rem; opacity: 0; padding-right: 0.75rem; transition: opacity 0.2s; }
        .filter-item:hover .filter-actions { opacity: 1; }
        .filter-actions button { color: #333; transition: color 0.2s; }
        .filter-actions button:hover { color: #fff; }
        
        .cat-rename-input { background: #111; border: 1px solid #333; border-radius: 4px; color: #fff; padding: 2px 6px; font-size: 0.8125rem; font-weight: 600; width: 100%; outline: none; }

        .add-category-section { border-top: 1px solid #111; padding-top: 1.5rem; }
        .add-cat-btn { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: #333; font-weight: 600; padding: 0.5rem 1rem; border-radius: 6px; transition: color 0.2s; }
        .add-cat-btn:hover { color: #888; }
        
        .category-input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .category-input-group input { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 0.5rem 0.75rem; border-radius: 6px; color: #fff; font-size: 0.8125rem; outline: none; }
        .cat-btn-group { display: flex; gap: 0.5rem; }
        .cat-confirm { background: #222; color: #fff; border-radius: 4px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; }
        .cat-cancel { color: #444; font-size: 0.75rem; font-weight: 600; }

        .todo-stack { display: flex; flex-direction: column; gap: 0.75rem; }
        .todo-item { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem 1.5rem; background: #080808; border: 1px solid #111; border-radius: 12px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .todo-item:hover { border-color: #333; transform: translateX(4px); background: #0a0a0a; }
        .todo-item.selected { border-color: #666; background: #0c0c0c; }
        .todo-item.done { opacity: 0.3; }

        .check-btn { color: #222; transition: all 0.2s; flex-shrink: 0; }
        .check-btn:hover { color: #fff; transform: scale(1.1); }
        .done .check-btn { color: #fff; }

        .todo-body { flex: 1; min-width: 0; }
        .todo-body h4 { font-size: 1.0625rem; font-weight: 600; margin-bottom: 0.5rem; color: #fff; letter-spacing: -0.01em; transition: color 0.2s; }
        .todo-item:hover h4 { color: #fff; }
        .done h4 { text-decoration: line-through; color: #444; }

        .tags { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
        .tag { font-size: 0.6875rem; color: #555; background: #0d0d0d; border: 1px solid #111; padding: 0.25rem 0.625rem; border-radius: 6px; display: flex; align-items: center; gap: 0.375rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; }
        .tag-icon { color: #333; display: flex; align-items: center; }
        
        .tag.priority.high { color: #fff; background: #222; border-color: #444; }
        .tag.priority.medium { color: #888; background: #111; }
        .tag.priority.low { color: #444; background: #050505; }

        .actions { display: flex; align-items: center; gap: 1rem; opacity: 0; transition: all 0.2s; }
        .todo-item:hover .actions { opacity: 1; }
        .delete-btn { color: #222; transition: all 0.2s; padding: 0.5rem; border-radius: 8px; }
        .delete-btn:hover { color: #ff4444; background: rgba(255,68,68,0.1); }
        .arrow-icon { color: #222; transition: transform 0.2s; }
        .todo-item:hover .arrow-icon { transform: translateX(2px); color: #fff; }

        .detail-sidebar {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 500px;
            background: #080808;
            border-left: 1px solid #151515;
            z-index: 100;
            display: flex;
            flex-direction: column;
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: -20px 0 50px rgba(0,0,0,0.5);
        }

        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .detail-header { display: flex; justify-content: space-between; align-items: center; padding: 32px; }
        .close-sidebar { color: #666; transition: color 0.2s; cursor: pointer; }
        .close-sidebar:hover { color: #fff; }
        .detail-delete { color: #444; transition: color 0.2s; cursor: pointer; }
        .detail-delete:hover { color: #ff4444; }

        .detail-content { flex: 1; overflow-y: auto; padding: 0 48px 48px; }
        
        .detail-title-input {
            width: 100%;
            background: none;
            border: none;
            font-size: 2.25rem;
            font-weight: 800;
            color: #fff;
            letter-spacing: -0.04em;
            margin-bottom: 40px;
            outline: none;
            resize: none;
            min-height: 2.75rem;
        }

        .detail-meta { display: flex; flex-direction: column; gap: 12px; margin-bottom: 48px; }
        .meta-row { display: grid; grid-template-columns: 140px 1fr; align-items: center; }
        .meta-row label { display: flex; align-items: center; gap: 10px; color: #888; font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .meta-row select, .meta-row input { background: none; border: none; color: #fff; font-size: 0.9375rem; font-weight: 600; outline: none; padding: 8px 0; border-bottom: 1px solid transparent; transition: all 0.2s; }
        .meta-row select:hover, .meta-row input:hover { color: #fff; border-bottom: 1px solid #333; }
        .meta-row select option { background: #080808; color: #fff; }

        .detail-section { margin-bottom: 48px; }
        .section-label { display: block; font-size: 0.75rem; color: #888; text-transform: uppercase; font-weight: 800; letter-spacing: 0.15em; margin-bottom: 16px; }
        .description-area { width: 100%; height: 200px; background: #0a0a0a; border: 1px solid #151515; border-radius: 16px; padding: 20px; color: #aaa; font-size: 1rem; line-height: 1.6; outline: none; transition: all 0.2s; resize: none; }
        .description-area:focus { border-color: #333; background: #0d0d0d; color: #fff; }

        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .attachment-actions { display: flex; gap: 12px; }
        .add-attachment { color: #333; transition: all 0.2s; background: #0d0d0d; padding: 8px; border-radius: 8px; border: 1px solid #151515; }
        .add-attachment:hover { color: #fff; border-color: #333; background: #111; }

        .attachments-grid { display: flex; flex-direction: column; gap: 8px; }
        .attachment-card { display: flex; align-items: center; gap: 16px; padding: 16px; background: #0a0a0a; border: 1px solid #151515; border-radius: 12px; color: #444; cursor: pointer; transition: all 0.2s; }
        .attachment-card:hover { border-color: #333; color: #fff; background: #0d0d0d; transform: scale(1.02); }
        .file-info { display: flex; flex-direction: column; gap: 2px; }
        .file-name { font-size: 0.8125rem; font-weight: 700; color: #fff; }
        .file-size { font-size: 0.6875rem; color: #333; font-weight: 600; }
        
        .attachments-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; background: #0a0a0a; border: 1px dashed #151515; border-radius: 20px; color: #222; width: 100%; cursor: pointer; transition: all 0.2s; }
        .attachments-empty:hover { border-color: #333; color: #444; background: #0d0d0d; }
        .attachments-empty p { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 12px; }

        .empty { text-align: center; padding: 6rem 0; color: #222; font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #080808; border: 1px solid #151515; padding: 2.5rem; border-radius: 20px; width: 440px; animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        @keyframes modalIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
        .modal-header h3 { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .modal-header button { color: #333; transition: color 0.2s; }
        .modal-header button:hover { color: #fff; }

        .input-field { display: flex; flex-direction: column; gap: 0.625rem; margin-bottom: 1.5rem; }
        .input-field label { font-size: 0.75rem; color: #888; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; }
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
