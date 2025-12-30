"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Book, Search, Plus, Star, Trash2, ChevronDown, Loader2, X, BookOpen, Target } from 'lucide-react';

interface BookItem {
    _id: string;
    title: string;
    author: string;
    category: string;
    progress: number;
    rating: number;
    status: 'wishlist' | 'reading' | 'completed';
    notes?: string;
}

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Self-Help', 'Business', 'Science', 'Biography', 'Other'];
const STATUSES = [
    { key: 'all', label: 'All Books' },
    { key: 'reading', label: 'Currently Reading' },
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'completed', label: 'Completed' }
];

export default function BooksPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [books, setBooks] = useState<BookItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        category: 'Non-Fiction',
        status: 'wishlist' as const,
        progress: 0,
        rating: 0,
    });

    const fetchBooks = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/books');
            const data = await res.json();
            setBooks(data.books || []);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (authStatus === 'unauthenticated') {
            router.push('/login');
        } else if (authStatus === 'authenticated') {
            fetchBooks();
        }
    }, [authStatus, router, fetchBooks]);

    const addBook = async () => {
        if (!newBook.title.trim() || !newBook.author.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBook),
            });
            const data = await res.json();
            if (res.ok) {
                setBooks(prev => [data.book, ...prev]);
                setNewBook({ title: '', author: '', category: 'Non-Fiction', status: 'wishlist', progress: 0, rating: 0 });
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error adding book:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateProgress = async (id: string, progress: number) => {
        try {
            await fetch('/api/books', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, progress, status: progress >= 100 ? 'completed' : 'reading' }),
            });
            setBooks(prev => prev.map(b =>
                b._id === id ? { ...b, progress, status: progress >= 100 ? 'completed' : 'reading' } : b
            ));
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const updateRating = async (id: string, rating: number) => {
        try {
            await fetch('/api/books', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, rating }),
            });
            setBooks(prev => prev.map(b => b._id === id ? { ...b, rating } : b));
        } catch (error) {
            console.error('Error updating rating:', error);
        }
    };

    const deleteBook = async (id: string) => {
        try {
            await fetch('/api/books', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setBooks(prev => prev.filter(b => b._id !== id));
        } catch (error) {
            console.error('Error deleting book:', error);
        }
    };

    const filteredBooks = books.filter(b => {
        const matchesFilter = filter === 'all' || b.status === filter;
        const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: books.length,
        reading: books.filter(b => b.status === 'reading').length,
        completed: books.filter(b => b.status === 'completed').length,
    };

    if (authStatus === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Loading library...</span>
                <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: var(--text-muted); }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

    return (
        <div className="books-page">
            <header className="page-header">
                <div>
                    <div className="page-badge">Personal Library</div>
                    <h1 className="text-gradient">Book Hub</h1>
                </div>

                <div className="header-stats">
                    <div className="stat-card glass-panel">
                        <BookOpen size={18} />
                        <span>{stats.reading}</span>
                        <label>Reading</label>
                    </div>
                    <div className="stat-card glass-panel">
                        <Target size={18} />
                        <span>{stats.completed}</span>
                        <label>Finished</label>
                    </div>
                </div>

                <button className="add-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    <span>Add Book</span>
                </button>
            </header>

            <div className="filter-bar glass-panel">
                <div className="tabs">
                    {STATUSES.map(s => (
                        <button key={s.key} className={`tab ${filter === s.key ? 'active' : ''}`} onClick={() => setFilter(s.key)}>
                            {s.label}
                            {s.key !== 'all' && <span className="tab-count">{books.filter(b => s.key === 'all' || b.status === s.key).length}</span>}
                        </button>
                    ))}
                </div>
                <div className="search-box">
                    <Search size={16} />
                    <input placeholder="Search books..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {filteredBooks.length === 0 ? (
                <div className="empty-state glass-panel">
                    <Book size={48} strokeWidth={1} />
                    <p>No books yet. Start building your library!</p>
                    <button onClick={() => setShowModal(true)}>Add your first book</button>
                </div>
            ) : (
                <div className="books-grid">
                    {filteredBooks.map(book => (
                        <div key={book._id} className="book-card glass-panel">
                            <div className="book-cover">
                                <Book size={32} />
                            </div>
                            <div className="book-info">
                                <div className="book-meta">
                                    <span className="category-tag">{book.category}</span>
                                    <span className={`status-badge ${book.status}`}>{book.status}</span>
                                </div>
                                <h3 className="book-title">{book.title}</h3>
                                <p className="book-author">by {book.author}</p>

                                {book.status !== 'wishlist' && (
                                    <div className="progress-section">
                                        <div className="progress-header">
                                            <span>Progress</span>
                                            <span>{book.progress}%</span>
                                        </div>
                                        <div className="progress-track">
                                            <div className="progress-fill" style={{ width: `${book.progress}%` }} />
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={book.progress}
                                            onChange={e => updateProgress(book._id, parseInt(e.target.value))}
                                            className="progress-slider"
                                        />
                                    </div>
                                )}

                                <div className="book-footer">
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} onClick={() => updateRating(book._id, star)} className={book.rating >= star ? 'filled' : ''}>
                                                <Star size={14} fill={book.rating >= star ? 'currentColor' : 'none'} />
                                            </button>
                                        ))}
                                    </div>
                                    <button className="delete-btn" onClick={() => deleteBook(book._id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Book size={18} /> Add New Book</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className="form-group">
                            <label>Title *</label>
                            <input type="text" placeholder="Book title" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} autoFocus />
                        </div>

                        <div className="form-group">
                            <label>Author *</label>
                            <input type="text" placeholder="Author name" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category</label>
                                <select value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={newBook.status} onChange={e => setNewBook({ ...newBook, status: e.target.value as any })}>
                                    <option value="wishlist">Wishlist</option>
                                    <option value="reading">Reading</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={addBook} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Add Book'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .books-page { max-width: 1200px; margin: 0 auto; animation: fadeUp 0.5s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .page-badge { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-dim); letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .page-header h1 { font-size: 2.5rem; }
        .header-stats { display: flex; gap: 1rem; }
        .stat-card { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1.5rem; border-radius: 12px; min-width: 80px; }
        .stat-card span { font-size: 1.5rem; font-weight: 700; }
        .stat-card label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
        .add-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); font-weight: 600; border-radius: 10px; }
        .filter-bar { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 12px; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .tabs { display: flex; gap: 0.25rem; }
        .tab { padding: 0.5rem 1rem; font-size: 0.85rem; color: var(--text-muted); border-radius: 8px; display: flex; align-items: center; gap: 0.5rem; }
        .tab:hover { color: var(--text-primary); }
        .tab.active { background: var(--bg-deep); color: var(--text-primary); }
        .tab-count { font-size: 0.7rem; background: rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 4px; }
        .search-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--bg-deep); border: 1px solid var(--border-main); border-radius: 8px; }
        .search-box input { background: none; border: none; color: var(--text-primary); width: 150px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; gap: 1rem; color: var(--text-muted); border-radius: 16px; }
        .empty-state button { color: var(--text-primary); text-decoration: underline; }
        .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .book-card { display: flex; gap: 1rem; padding: 1.25rem; border-radius: 16px; }
        .book-cover { width: 60px; height: 80px; background: var(--bg-deep); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-dim); flex-shrink: 0; }
        .book-info { flex: 1; display: flex; flex-direction: column; }
        .book-meta { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
        .category-tag { font-size: 0.65rem; padding: 0.15rem 0.5rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: var(--text-muted); }
        .status-badge { font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 4px; text-transform: capitalize; }
        .status-badge.wishlist { background: rgba(234,179,8,0.15); color: #facc15; }
        .status-badge.reading { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .status-badge.completed { background: rgba(34,197,94,0.15); color: #22c55e; }
        .book-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
        .book-author { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem; }
        .progress-section { margin-bottom: 0.75rem; }
        .progress-header { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; }
        .progress-track { height: 4px; background: var(--bg-deep); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--text-primary); border-radius: 2px; transition: width 0.3s; }
        .progress-slider { width: 100%; margin-top: 0.5rem; accent-color: var(--text-primary); }
        .book-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
        .star-rating { display: flex; gap: 0.1rem; }
        .star-rating button { color: var(--text-dim); padding: 0.1rem; }
        .star-rating button.filled { color: #facc15; }
        .delete-btn { color: var(--text-dim); padding: 0.25rem; border-radius: 4px; }
        .delete-btn:hover { color: #f87171; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 16px; padding: 1.5rem; width: 90%; max-width: 450px; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); }
        .form-group input, .form-group select { padding: 0.75rem 1rem; background: var(--bg-deep); border: 1px solid var(--border-main); border-radius: 10px; color: var(--text-primary); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--text-primary); color: var(--bg-deep); font-weight: 600; border-radius: 10px; }
        .secondary-btn { padding: 0.75rem 1.25rem; background: transparent; border: 1px solid var(--border-main); color: var(--text-secondary); border-radius: 10px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; }
          .books-grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
}
