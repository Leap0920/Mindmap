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
            const [todosRes, categoriesRes] = await Promise.all([
                fetch('/api/todos'),
                fetch('/api/categories?type=todo')
            ]);

            const todosData = await todosRes.json();
            const categoriesData = await categoriesRes.json();

            setTodos(todosData.todos || []);

            if (categoriesData.categories && categoriesData.categories.length > 0) {
                setCategories(categoriesData.categories.map((c: any) => c.name));
            } else {
                setCategories(INITIAL_CATEGORIES);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const addCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategoryName.trim(), type: 'todo' }),
            });
            if (res.ok) {
                setCategories(prev => [...prev, newCategoryName.trim()]);
                setNewCategoryName('');
                setShowCategoryInput(false);
            }
        } catch (err) {
            console.error('Add category error:', err);
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
            const res = await fetch('/api/categories', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldName, name: tempCatName.trim() }),
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
            const res = await fetch('/api/categories', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: catName }),
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingTodo) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                const newAttachment = {
                    name: uploadData.name,
                    url: uploadData.url,
                    fileType: uploadData.fileType
                };

                const updatedAttachments = [...(editingTodo.attachments || []), newAttachment];
                const updateTodoRes = await fetch('/api/todos', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: editingTodo._id, attachments: updatedAttachments }),
                });

                if (updateTodoRes.ok) {
                    const data = await updateTodoRes.json();
                    setTodos(prev => prev.map(t => t._id === editingTodo._id ? data.todo : t));
                    setEditingTodo(data.todo);
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
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
                <span className="breadcrumb">System / Core / Tasks</span>
                <div className="header-main">
                    <div>
                        <h1>Action Center</h1>
                        <p>Coordinate your objectives and systems.</p>
                    </div>
                    <button className="add-btn" onClick={handleOpenAddModal}>
                        <Plus size={20} strokeWidth={3} />
                        <span>Commit Task</span>
                    </button>
                </div>
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
                                    <div className="item-status">
                                        <button className="check-btn" onClick={(e) => { e.stopPropagation(); toggleTodo(todo._id, todo.completed); }}>
                                            {todo.completed ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <Circle size={20} strokeWidth={2} />}
                                        </button>
                                    </div>

                                    <div className="todo-body">
                                        <h4>{todo.task}</h4>
                                        <div className="tags">
                                            <div className="tag-group">
                                                <span className="tag project">{todo.category}</span>
                                                <span className={`tag priority ${todo.priority.toLowerCase()}`}>{todo.priority}</span>
                                            </div>
                                            {todo.dueDate && (
                                                <span className="tag date">
                                                    <Calendar size={12} strokeWidth={2.5} />
                                                    {new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="item-indicators">
                                        {todo.description && <FileText size={14} className="indicator-icon" />}
                                        {todo.attachments && todo.attachments.length > 0 && <Paperclip size={14} className="indicator-icon" />}
                                    </div>

                                    <div className="actions">
                                        <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteTodo(todo._id); }}>
                                            <Trash2 size={18} />
                                        </button>
                                        <ChevronRight size={20} className="arrow-icon" />
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
                                        <input
                                            type="file"
                                            id="file-upload"
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />
                                        <button className="add-attachment" onClick={() => document.getElementById('file-upload')?.click()} title="Add Attachment">
                                            <Paperclip size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="attachments-grid">
                                    {editingTodo.attachments && editingTodo.attachments.length > 0 ? (
                                        editingTodo.attachments.map((file, i) => (
                                            <div key={i} className="attachment-card" onClick={() => file.url !== '#' && window.open(file.url)}>
                                                {file.fileType?.startsWith('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                                                <div className="file-info">
                                                    <span className="file-name">{file.name}</span>
                                                    <span className="file-size">{file.fileType || 'File'}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="attachments-empty" onClick={() => document.getElementById('file-upload')?.click()}>
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
        .todo-page { width: 100%; padding: 4rem 2.5rem; animation: fadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); color: #fff; position: relative; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .page-header { margin-bottom: 3.5rem; display: flex; flex-direction: column; align-items: flex-start; }
        .breadcrumb { font-size: 0.6rem; color: #fff; text-transform: uppercase; letter-spacing: 0.4rem; font-weight: 900; margin-bottom: 1.25rem; display: block; }
        .header-main { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; gap: 2rem; }
        .header-main > div { text-align: left; }
        .page-header h1 { font-size: 2.75rem; font-weight: 900; margin: 0; color: #fff; letter-spacing: -0.06em; line-height: 0.9; text-align: left; }
        .page-header p { color: #555; font-size: 0.8125rem; margin-top: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }

        .add-btn { background: #fff; color: #000; padding: 0.625rem 1.25rem; border-radius: 12px; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 10px 20px rgba(255,255,255,0.1); border: none; cursor: pointer; }
        .add-btn:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 30px rgba(255,255,255,0.15); }
        .add-btn:active { transform: translateY(-1px); }

        .main-layout { display: grid; grid-template-columns: 220px 1fr; gap: 3.5rem; }
        
        .search-box { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 2rem; transition: all 0.3s; }
        .search-box:focus-within { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.04); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .search-box input { background: none; border: none; font-size: 0.875rem; color: #fff; outline: none; width: 100%; font-weight: 600; }
        .search-box input::placeholder { color: #222; }
        .search-icon { color: #222; transition: color 0.3s; }
        .search-box:focus-within .search-icon { color: #fff; }

        .filter-group label { display: block; font-size: 0.65rem; color: #444; text-transform: uppercase; font-weight: 900; letter-spacing: 0.2em; margin-bottom: 1.5rem; padding-left: 0.5rem; }
        .filter-nav { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; }
        
        .filter-item { position: relative; display: flex; align-items: center; justify-content: space-between; border-radius: 10px; transition: all 0.3s; }
        .filter-item:hover { background: rgba(255,255,255,0.03); }
        .filter-link { flex: 1; text-align: left; padding: 0.75rem 0.875rem; font-size: 0.8125rem; color: #444; transition: all 0.3s; font-weight: 700; border: none; background: none; cursor: pointer; }
        .filter-link:hover { color: #888; }
        .filter-link.active { color: #fff; background: rgba(255,255,255,0.05); }
        
        .filter-actions { display: flex; gap: 0.5rem; opacity: 0; padding-right: 1rem; transition: opacity 0.2s; }
        .filter-item:hover .filter-actions { opacity: 1; }
        .filter-actions button { color: #222; transition: all 0.2s; background: none; border: none; cursor: pointer; }
        .filter-actions button:hover { color: #fff; transform: scale(1.2); }
        
        .cat-rename-input { background: #000; border: 1px solid #222; border-radius: 8px; color: #fff; padding: 6px 10px; font-size: 0.8125rem; font-weight: 700; width: 100%; outline: none; box-shadow: 0 0 20px rgba(255,255,255,0.05); }

        .add-category-section { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 2rem; margin-top: 1rem; }
        .add-cat-btn { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8125rem; color: #333; font-weight: 800; padding: 0.75rem 1rem; border-radius: 12px; transition: all 0.3s; background: none; border: 1px dashed rgba(255,255,255,0.05); width: 100%; cursor: pointer; }
        .add-cat-btn:hover { color: #fff; background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.2); }
        
        .category-input-group { display: flex; flex-direction: column; gap: 0.75rem; }
        .category-input-group input { background: #000; border: 1px solid #222; padding: 0.875rem 1rem; border-radius: 12px; color: #fff; font-size: 0.875rem; outline: none; font-weight: 600; }
        .cat-btn-group { display: flex; gap: 0.75rem; }
        .cat-confirm { flex: 1; background: #fff; color: #000; border-radius: 10px; padding: 0.625rem; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; }
        .cat-cancel { flex: 1; background: #111; color: #444; border-radius: 10px; padding: 0.625rem; font-size: 0.75rem; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s; }
        .cat-cancel:hover { color: #fff; }

        .todo-stack { display: flex; flex-direction: column; gap: 0.75rem; }
        .todo-item { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; background: #050505; border: 1px solid #111; border-radius: 16px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; position: relative; overflow: hidden; }
        .todo-item:hover { border-color: #333; transform: translateX(5px); background: #080808; box-shadow: 0 15px 40px rgba(0,0,0,0.6); }
        .todo-item.selected { border-color: #fff; background: #0c0c0c; box-shadow: 0 0 40px rgba(255,255,255,0.03); }
        .todo-item.done { opacity: 0.2; transform: scale(0.99); }

        .check-btn { color: #111; transition: all 0.3s; flex-shrink: 0; background: none; border: none; cursor: pointer; }
        .check-btn:hover { color: #fff; transform: scale(1.2); }
        .done .check-btn { color: #fff; }

        .todo-body { flex: 1; min-width: 0; }
        .todo-body h4 { font-size: 1rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff; letter-spacing: -0.01em; transition: all 0.3s; }
        .done h4 { text-decoration: line-through; color: #333; }

        .tags { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
        .tag { font-size: 0.6rem; color: #555; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 0.375rem 0.875rem; border-radius: 100px; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 900; transition: all 0.3s; }
        .todo-item:hover .tag { border-color: rgba(255,255,255,0.1); color: #888; }
        .tag-icon { color: #222; display: flex; align-items: center; transition: color 0.3s; }
        .todo-item:hover .tag-icon { color: #fff; }
        
        .tag.priority.high { color: #fff; background: rgba(255,255,255,0.1); border-color: #fff; }
        .tag.priority.medium { color: #888; }
        .tag.priority.low { color: #222; }

        .actions { display: flex; align-items: center; gap: 1.5rem; opacity: 0; transition: all 0.3s; }
        .todo-item:hover .actions { opacity: 1; }
        .delete-btn { color: #1a1a1a; transition: all 0.3s; padding: 0.75rem; border-radius: 14px; background: none; border: none; cursor: pointer; }
        .delete-btn:hover { color: #ff4444; background: rgba(255,68,68,0.05); transform: rotate(15deg); }
        .arrow-icon { color: #111; transition: all 0.3s; }
        .todo-item:hover .arrow-icon { transform: translateX(5px); color: #fff; }

        .detail-sidebar {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            bottom: 1.5rem;
            width: 560px;
            background: #000;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 32px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            animation: slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 0 100px rgba(255,255,255,0.02);
            backdrop-filter: blur(20px);
        }
        @keyframes slideIn { from { transform: translateX(100%) scale(0.9); opacity: 0; } to { transform: translateX(0) scale(1); opacity: 1; } }

        .detail-header { display: flex; justify-content: space-between; align-items: center; padding: 2.5rem 3rem; }
        .close-sidebar { color: #222; transition: all 0.3s; background: rgba(255,255,255,0.02); pading: 12px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
        .close-sidebar:hover { color: #fff; background: #111; transform: rotate(90deg); }
        .detail-delete { color: #222; transition: all 0.3s; background: none; border: none; cursor: pointer; }
        .detail-delete:hover { color: #ff4444; transform: scale(1.2); }

        .detail-content { flex: 1; overflow-y: auto; padding: 0 4rem 4rem; scrollbar-width: none; }
        .detail-content::-webkit-scrollbar { display: none; }
        
        .detail-title-input {
            width: 100%;
            background: none;
            border: none;
            font-size: 2rem;
            font-weight: 900;
            color: #fff;
            letter-spacing: -0.05em;
            margin-bottom: 2rem;
            outline: none;
            resize: none;
            min-height: 2.5rem;
            line-height: 1.1;
        }
        .detail-title-input::placeholder { color: #111; }

        .detail-meta { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 4rem; padding: 2rem; background: rgba(255,255,255,0.02); border-radius: 24px; border: 1px solid rgba(255,255,255,0.04); }
        .meta-row { display: grid; grid-template-columns: 160px 1fr; align-items: center; }
        .meta-row label { display: flex; align-items: center; gap: 12px; color: #333; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; }
        .meta-row select, .meta-row input { background: none; border: none; color: #fff; font-size: 1rem; font-weight: 700; outline: none; padding: 8px 0; border-bottom: 1px solid transparent; transition: all 0.3s; cursor: pointer; }
        .meta-row select:hover, .meta-row input:hover { color: #fff; border-bottom: 1px solid #222; }
        .meta-row select option { background: #000; color: #fff; }

        .detail-section { margin-bottom: 3rem; }
        .section-label { display: block; font-size: 0.7rem; color: #333; text-transform: uppercase; font-weight: 900; letter-spacing: 0.25em; margin-bottom: 1rem; }
        .description-area { width: 100%; height: 200px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 20px; padding: 1.5rem; color: #888; font-size: 0.9375rem; line-height: 1.7; outline: none; transition: all 0.4s; resize: none; font-weight: 500; }
        .description-area:focus { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); color: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.4); }

        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .attachment-actions { display: flex; gap: 1rem; }
        .add-attachment { color: #222; transition: all 0.3s; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
        .add-attachment:hover { color: #fff; border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); transform: translateY(-2px); }

        .attachments-grid { display: flex; flex-direction: column; gap: 0.75rem; }
        .attachment-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem 1.5rem; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 20px; color: #444; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .attachment-card:hover { border-color: rgba(255,255,255,0.1); color: #fff; background: rgba(255,255,255,0.03); transform: scale(1.02) translateX(5px); }
        .file-info { display: flex; flex-direction: column; gap: 2px; }
        .file-name { font-size: 0.875rem; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
        .file-size { font-size: 0.7rem; color: #222; font-weight: 700; text-transform: uppercase; }
        
        .attachments-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; background: rgba(255,255,255,0.01); border: 2px dashed rgba(255,255,255,0.03); border-radius: 32px; color: #111; width: 100%; cursor: pointer; transition: all 0.4s; }
        .attachments-empty:hover { border-color: rgba(255,255,255,0.1); color: #444; background: rgba(255,255,255,0.02); }
        .attachments-empty p { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 1.25rem; }

        .empty { text-align: center; padding: 10rem 0; color: #111; font-size: 1.25rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 2000; animation: fadeIn 0.4s ease; }
        .modal-box { background: #000; border: 1px solid rgba(255,255,255,0.1); padding: 4rem; border-radius: 40px; width: 500px; animation: modalIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 50px 100px rgba(0,0,0,1); }
        @keyframes modalIn { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3.5rem; }
        .modal-header h3 { font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: -0.04em; }
        .modal-header button { color: #222; transition: all 0.3s; background: none; border: none; cursor: pointer; }
        .modal-header button:hover { color: #fff; transform: rotate(90deg); }

        .input-field { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
        .input-field label { font-size: 0.75rem; color: #444; text-transform: uppercase; font-weight: 900; letter-spacing: 0.2rem; }
        .input-field input, .input-field select { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 1rem 1.25rem; border-radius: 14px; color: #fff; outline: none; font-size: 1rem; transition: all 0.3s; font-weight: 600; }
        .input-field input:focus, .input-field select:focus { border-color: #333; background: #0f0f0f; }
        .input-field select option { background: #0a0a0a; color: #fff; padding: 10px; }
        
        .grid-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; margin-top: 3rem; }
        .save-btn { background: #fff; color: #000; padding: 1.25rem 3.5rem; border-radius: 18px; font-weight: 900; font-size: 1.125rem; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 10px 40px rgba(255,255,255,0.1); border: none; cursor: pointer; }
        .save-btn:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(255,255,255,0.2); }
        .save-btn:disabled { opacity: 0.5; transform: none; box-shadow: none; cursor: not-allowed; }

        @media (max-width: 1100px) {
          .main-layout { grid-template-columns: 1fr; gap: 4rem; }
          .filters { order: 2; border: none; padding: 0; }
          .filter-nav { flex-direction: row; flex-wrap: wrap; gap: 0.75rem; }
          .filter-link { padding: 0.6rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); }
          .filter-link.active::before { display: none; }
          .header-main { flex-direction: column; align-items: flex-start; gap: 2rem; }
          .detail-sidebar { width: calc(100% - 2rem); right: 1rem; left: 1rem; height: calc(100% - 2rem); }
          .content { order: 1; }
        }

        @media (max-width: 768px) {
          .todo-page { padding: 1.5rem 0.75rem; max-width: 100%; margin: 0; }
          .page-header h1 { font-size: 2.25rem; text-align: left; width: 100%; }
          .page-header p { margin-top: 0.5rem; font-size: 0.75rem; text-align: left; width: 100%; }
          .breadcrumb { letter-spacing: 0.2rem; margin-bottom: 0.75rem; text-align: left; width: 100%; }
          .main-layout { gap: 2rem; display: block; }
          .filters { margin-bottom: 2rem; }
          .todo-item { padding: 1rem; gap: 0.75rem; border-radius: 12px; }
          .todo-body h4 { font-size: 0.95rem; margin-bottom: 0.25rem; }
          .modal-box { width: 95%; padding: 2.5rem 1.5rem; border-radius: 24px; }
          .grid-fields { grid-template-columns: 1fr; }
          .detail-sidebar { width: 100%; right: 0; left: 0; bottom: 0; top: auto; height: 85vh; border-radius: 24px 24px 0 0; }
          .header-main { align-items: flex-start; }
          .add-btn { width: 100%; justify-content: center; margin-top: 1rem; }
        }
          .detail-header { padding: 2rem 2rem 1rem; }
          .detail-content { padding: 0 2rem 2rem; }
          .detail-title-input { font-size: 1.5rem; }
          .add-btn { width: 100%; justify-content: center; }
        }

        @media (max-width: 480px) {
          .todo-page { padding: 1.5rem 1rem; }
          .page-header h1 { font-size: 1.75rem; }
          .page-header p { font-size: 0.75rem; }
          .breadcrumb { font-size: 0.5rem; letter-spacing: 0.15rem; }
          .todo-item { padding: 1rem; border-radius: 12px; }
          .todo-body h4 { font-size: 0.9rem; margin-bottom: 0.375rem; }
          .tag { font-size: 0.55rem; padding: 0.3rem 0.6rem; }
          .check-btn svg { width: 18px; height: 18px; }
          .modal-box { padding: 2rem 1.25rem; border-radius: 20px; }
          .modal-header h3 { font-size: 1.5rem; }
          .input-field input, .input-field select { padding: 0.875rem 1rem; font-size: 0.9375rem; }
          .save-btn { padding: 1rem 2.5rem; font-size: 1rem; }
          .filter-link { padding: 0.5rem 0.75rem; font-size: 0.75rem; }
          .detail-sidebar { height: 90vh; }
          .detail-title-input { font-size: 1.25rem; }
          .description-area { height: 150px; padding: 1.25rem; }
        }
      `}</style>
        </div>
    );
}
