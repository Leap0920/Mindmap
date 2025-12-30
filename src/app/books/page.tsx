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
        .page { 
            min-height: 100vh;
            background: #080808;
            color: #fff;
            padding: 48px;
            animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeUp { 
            from { opacity: 0; transform: translateY(16px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-bottom: 48px;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }

        .title { 
            font-size: 2.5rem; 
            font-weight: 800; 
            margin: 0; 
            color: #fff; 
            letter-spacing: -0.04em; 
        }

        .subtitle { 
            color: #555; 
            font-size: 1rem; 
            font-weight: 500;
            margin-top: 4px;
        }
        
        .toolbar { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 32px; 
            gap: 16px; 
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }

        .tabs { 
            display: flex; 
            gap: 4px; 
            background: #0a0a0a; 
            padding: 4px; 
            border-radius: 10px; 
            border: 1px solid #1a1a1a; 
        }

        .tab { 
            padding: 8px 16px; 
            font-size: 0.8125rem; 
            color: #444; 
            border-radius: 8px; 
            transition: all 0.2s; 
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .tab:hover { color: #888; }
        .tab.active { background: #151515; color: #fff; }

        .search { 
            display: flex; 
            align-items: center; 
            gap: 10px; 
            padding: 10px 16px; 
            background: #0a0a0a; 
            border: 1px solid #1a1a1a; 
            border-radius: 10px; 
            transition: border-color 0.2s;
        }

        .search:focus-within { border-color: #333; }
        .search svg { color: #333; }
        .search input { 
            background: none; 
            border: none; 
            color: #fff; 
            width: 200px; 
            font-size: 0.875rem; 
            outline: none; 
            font-weight: 500;
        }

        .search input::placeholder { color: #222; }
        
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
            gap: 24px; 
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
        }

        .card { 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            border-radius: 16px; 
            padding: 24px; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card:hover { 
            border-color: #252525; 
            background: #0d0d0d;
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }

        .book-card { display: flex; flex-direction: column; gap: 8px; }
        .book-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        
        .status { 
            font-size: 0.625rem; 
            font-weight: 800; 
            padding: 3px 8px; 
            border-radius: 6px; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
        }

        .status.wishlist { background: #1a1a1a; color: #555; }
        .status.reading { background: rgba(255,255,255,0.1); color: #fff; }
        .status.completed { background: #fff; color: #000; }

        .book-title { 
            font-size: 1.125rem; 
            font-weight: 700; 
            color: #fff; 
            margin-top: 4px; 
            letter-spacing: -0.01em;
        }

        .book-author { font-size: 0.875rem; color: #555; font-weight: 500; }
        
        .book-category { 
            font-size: 0.6875rem; 
            color: #333; 
            text-transform: uppercase; 
            letter-spacing: 0.1em; 
            margin-top: 8px;
            font-weight: 800;
        }
        
        .progress-section { 
            margin-top: 24px; 
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .progress-bar { 
            height: 4px; 
            background: #151515; 
            border-radius: 2px; 
            overflow: hidden; 
        }

        .progress-fill { 
            height: 100%; 
            background: #fff; 
            transition: width 0.3s ease; 
        }

        .progress-section input[type="range"] { 
            width: 100%; 
            margin: 8px 0; 
            accent-color: #fff; 
            height: 4px; 
            background: none;
        }

        .progress-text { 
            font-size: 0.75rem; 
            color: #444; 
            font-weight: 700;
        }
        
        .book-footer { 
            margin-top: 24px; 
            padding-top: 16px; 
            border-top: 1px solid #151515;
        }

        .rating { display: flex; gap: 4px; }
        .rating button { color: #1a1a1a; padding: 2px; transition: all 0.2s; }
        .rating button:hover { color: #333; transform: scale(1.2); }
        .rating button.filled { color: #fff; }
        
        .btn { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 0.875rem; 
            font-weight: 700; 
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        }

        .btn-primary { 
            background: #fff; 
            color: #000; 
            padding: 10px 20px; 
            border-radius: 10px; 
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .btn-primary:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 20px rgba(255,255,255,0.2);
        }

        .btn-secondary { 
            background: transparent; 
            border: 1px solid #1a1a1a; 
            color: #444; 
            padding: 10px 20px; 
            border-radius: 10px; 
        }

        .btn-secondary:hover { border-color: #333; color: #888; }
        .btn-ghost { color: #222; padding: 6px; border-radius: 8px; }
        .btn-ghost:hover { color: #fff; background: #111; }
        .btn-danger:hover { color: #ff4444; background: rgba(255, 68, 68, 0.1); }
        
        .empty-state { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            padding: 80px 0; 
            gap: 24px; 
            color: #222; 
        }

        .empty-state p {
            font-size: 1rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }

        .empty-state svg { color: #111; }
        
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

        .modal-content { 
            background: #080808; 
            border: 1px solid #151515; 
            border-radius: 20px; 
            width: 440px; 
            animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
            overflow: hidden; 
            box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }

        @keyframes modalIn { 
            from { opacity: 0; transform: translateY(24px) scale(0.95); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 40px 40px 0; }
        .modal-title { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .modal-body { padding: 32px 40px; display: flex; flex-direction: column; gap: 24px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 0 40px 40px; }
        
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-label { font-size: 0.75rem; font-weight: 800; color: #333; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .form-group input, .form-group select { 
            width: 100%; 
            padding: 12px 16px; 
            background: #050505; 
            border: 1px solid #151515; 
            border-radius: 10px; 
            color: #fff; 
            font-size: 0.9375rem; 
            outline: none; 
            transition: all 0.2s; 
            font-weight: 500;
        }

        .form-group input:focus, .form-group select:focus { border-color: #333; background: #080808; }
        .form-group input::placeholder { color: #222; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @media (max-width: 800px) {
            .page { padding: 32px 20px; }
            .toolbar { flex-direction: column; align-items: stretch; }
            .grid { grid-template-columns: 1fr; }
            .header { flex-direction: column; align-items: flex-start; gap: 24px; }
        }
      `}</style>
        </div>
    );
}
