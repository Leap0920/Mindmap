"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Book, Search, Plus, Star, Trash2, Loader2, X, BookOpen } from 'lucide-react';

interface BookItem {
    _id: string;
    title: string;
    author: string;
    category: string;
    progress: number;
    rating: number;
    status: 'wishlist' | 'reading' | 'completed';
}

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Self-Help', 'Business', 'Science', 'Biography', 'Other'];
const STATUSES = [
    { key: 'all', label: 'All' },
    { key: 'reading', label: 'Reading' },
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
        title: '', author: '', category: 'Non-Fiction', status: 'wishlist' as const, progress: 0, rating: 0,
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
        if (authStatus === 'unauthenticated') router.push('/login');
        else if (authStatus === 'authenticated') fetchBooks();
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
            setBooks(prev => prev.map(b => b._id === id ? { ...b, progress, status: progress >= 100 ? 'completed' : 'reading' } : b));
        } catch (error) { console.error('Error:', error); }
    };

    const updateRating = async (id: string, rating: number) => {
        try {
            await fetch('/api/books', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, rating }) });
            setBooks(prev => prev.map(b => b._id === id ? { ...b, rating } : b));
        } catch (error) { console.error('Error:', error); }
    };

    const deleteBook = async (id: string) => {
        try {
            await fetch('/api/books', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            setBooks(prev => prev.filter(b => b._id !== id));
        } catch (error) { console.error('Error:', error); }
    };

    const filteredBooks = books.filter(b => {
        const matchesFilter = filter === 'all' || b.status === filter;
        const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = { reading: books.filter(b => b.status === 'reading').length, completed: books.filter(b => b.status === 'completed').length };

    if (authStatus === 'loading' || isLoading) {
        return <div className="loading-screen"><Loader2 size={24} className="animate-spin" /><style jsx>{`.loading-screen { display: flex; align-items: center; justify-content: center; min-height: 60vh; color: #555; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style></div>;
    }

    return (
        <div className="page animate-slide">
            <header className="header">
                <div>
                    <h1 className="title">Book Hub</h1>
                    <p className="subtitle">{stats.reading} reading · {stats.completed} completed</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Add Book
                </button>
            </header>

            <div className="toolbar">
                <div className="tabs">
                    {STATUSES.map(s => (
                        <button key={s.key} className={`tab ${filter === s.key ? 'active' : ''}`} onClick={() => setFilter(s.key)}>
                            {s.label}
                        </button>
                    ))}
                </div>
                <div className="search">
                    <Search size={16} />
                    <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
            </div>

            {filteredBooks.length === 0 ? (
                <div className="empty-state">
                    <Book size={40} strokeWidth={1} />
                    <p>No books found</p>
                    <button className="btn btn-secondary" onClick={() => setShowModal(true)}>Add your first book</button>
                </div>
            ) : (
                <div className="grid">
                    {filteredBooks.map(book => (
                        <div key={book._id} className="card book-card">
                            <div className="book-header">
                                <span className={`status ${book.status}`}>{book.status}</span>
                                <button className="btn btn-ghost btn-danger" onClick={() => deleteBook(book._id)}><Trash2 size={14} /></button>
                            </div>
                            <h3 className="book-title">{book.title}</h3>
                            <p className="book-author">{book.author}</p>
                            <span className="book-category">{book.category}</span>

                            {book.status !== 'wishlist' && (
                                <div className="progress-section">
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${book.progress}%` }} />
                                    </div>
                                    <input type="range" min="0" max="100" value={book.progress} onChange={e => updateProgress(book._id, parseInt(e.target.value))} />
                                    <span className="progress-text">{book.progress}%</span>
                                </div>
                            )}

                            <div className="book-footer">
                                <div className="rating">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <button key={s} onClick={() => updateRating(book._id, s)} className={book.rating >= s ? 'filled' : ''}>
                                            <Star size={14} fill={book.rating >= s ? 'currentColor' : 'none'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add Book</h3>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input type="text" placeholder="Book title" value={newBook.title} onChange={e => setNewBook({ ...newBook, title: e.target.value })} autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Author</label>
                                <input type="text" placeholder="Author name" value={newBook.author} onChange={e => setNewBook({ ...newBook, author: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select value={newBook.category} onChange={e => setNewBook({ ...newBook, category: e.target.value })}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select value={newBook.status} onChange={e => setNewBook({ ...newBook, status: e.target.value as any })}>
                                        <option value="wishlist">Wishlist</option>
                                        <option value="reading">Reading</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={addBook} disabled={isSaving}>
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Add Book'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .page { max-width: 900px; margin: 0 auto; padding: 1.5rem; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .title { font-size: 1.75rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .subtitle { font-size: 0.75rem; color: #666; margin-top: 0.25rem; }
        
        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; gap: 0.875rem; flex-wrap: wrap; }
        .tabs { display: flex; gap: 0.125rem; background: #0a0a0a; padding: 0.25rem; border-radius: 8px; border: 1px solid #181818; }
        .tab { padding: 0.4375rem 0.75rem; font-size: 0.75rem; color: #666; border-radius: 6px; transition: all 0.15s; font-weight: 500; }
        .tab:hover { color: #999; }
        .tab.active { background: #151515; color: #fff; }
        .search { display: flex; align-items: center; gap: 0.5rem; padding: 0.4375rem 0.75rem; background: #0a0a0a; border: 1px solid #181818; border-radius: 8px; }
        .search svg { color: #555; }
        .search input { background: none; border: none; color: #fff; width: 130px; font-size: 0.75rem; outline: none; }
        .search input::placeholder { color: #444; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.75rem; }
        .card { background: #0a0a0a; border: 1px solid #181818; border-radius: 10px; padding: 1rem; transition: all 0.15s; }
        .card:hover { border-color: #252525; background: #0c0c0c; }
        .book-card { display: flex; flex-direction: column; gap: 0.375rem; }
        .book-header { display: flex; justify-content: space-between; align-items: center; }
        .status { font-size: 0.5625rem; font-weight: 600; padding: 0.1875rem 0.4375rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
        .status.wishlist { background: rgba(245,158,11,0.15); color: #f59e0b; }
        .status.reading { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .status.completed { background: rgba(16,185,129,0.15); color: #10b981; }
        .book-title { font-size: 0.875rem; font-weight: 600; color: #eee; margin-top: 0.25rem; }
        .book-author { font-size: 0.75rem; color: #666; }
        .book-category { font-size: 0.625rem; color: #444; text-transform: uppercase; letter-spacing: 0.03em; margin-top: 0.25rem; }
        
        .progress-section { margin-top: 0.625rem; }
        .progress-bar { height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: #fff; transition: width 0.2s; }
        .progress-section input[type="range"] { width: 100%; margin: 0.375rem 0; accent-color: #fff; height: 3px; }
        .progress-text { font-size: 0.625rem; color: #555; }
        
        .book-footer { margin-top: auto; padding-top: 0.375rem; }
        .rating { display: flex; gap: 0.0625rem; }
        .rating button { color: #333; padding: 0.0625rem; transition: all 0.15s; }
        .rating button:hover { color: #555; }
        .rating button.filled { color: #f59e0b; }
        
        .btn { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; font-weight: 600; transition: all 0.15s; }
        .btn-primary { background: #fff; color: #000; padding: 0.4375rem 0.875rem; border-radius: 8px; }
        .btn-primary:hover { transform: translateY(-1px); }
        .btn-secondary { background: transparent; border: 1px solid #1f1f1f; color: #777; padding: 0.4375rem 0.875rem; border-radius: 8px; }
        .btn-secondary:hover { border-color: #333; color: #999; }
        .btn-ghost { color: #555; padding: 0.25rem; }
        .btn-ghost:hover { color: #999; }
        .btn-danger:hover { color: #ef4444; }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; gap: 0.75rem; color: #444; }
        .empty-state svg { color: #333; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 14px; width: 90%; max-width: 380px; animation: slideUp 0.2s ease-out; overflow: hidden; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.25rem 0; }
        .modal-title { font-size: 1rem; font-weight: 600; color: #fff; }
        .modal-body { padding: 1rem 1.25rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.625rem; padding: 0 1.25rem 1.25rem; }
        
        .form-group { margin-bottom: 0.875rem; }
        .form-label { display: block; font-size: 0.6875rem; font-weight: 600; color: #666; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input, .form-group select { width: 100%; padding: 0.5625rem 0.75rem; background: #080808; border: 1px solid #1f1f1f; border-radius: 8px; color: #fff; font-size: 0.8125rem; outline: none; transition: border-color 0.15s; }
        .form-group input:focus, .form-group select:focus { border-color: #333; }
        .form-group input::placeholder { color: #444; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        
        @media (max-width: 600px) {
          .toolbar { flex-direction: column; align-items: stretch; }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
        </div>
    );
}
