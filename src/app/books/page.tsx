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
    return <div className="loading-screen"><Loader2 size={24} className="animate-spin" /></div>;
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
        .page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .title { font-size: 1.5rem; font-weight: 700; }
        .subtitle { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }
        
        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
        .tabs { display: flex; gap: 0.25rem; background: var(--bg-card); padding: 0.25rem; border-radius: var(--radius-md); }
        .tab { padding: 0.5rem 0.875rem; font-size: 0.8rem; color: var(--text-muted); border-radius: var(--radius-sm); transition: all var(--transition-fast); }
        .tab:hover { color: var(--text-primary); }
        .tab.active { background: var(--bg-elevated); color: var(--text-primary); }
        .search { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-md); }
        .search input { background: none; border: none; color: var(--text-primary); width: 140px; font-size: 0.8rem; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .book-card { display: flex; flex-direction: column; gap: 0.5rem; }
        .book-header { display: flex; justify-content: space-between; align-items: center; }
        .status { font-size: 0.65rem; font-weight: 500; padding: 0.2rem 0.5rem; border-radius: 4px; text-transform: capitalize; }
        .status.wishlist { background: var(--warning-muted); color: var(--warning); }
        .status.reading { background: rgba(59,130,246,0.15); color: #3b82f6; }
        .status.completed { background: var(--success-muted); color: var(--success); }
        .book-title { font-size: 0.95rem; font-weight: 600; }
        .book-author { font-size: 0.8rem; color: var(--text-muted); }
        .book-category { font-size: 0.7rem; color: var(--text-dim); }
        
        .progress-section { margin-top: 0.75rem; }
        .progress-bar { height: 4px; background: var(--bg-elevated); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--text-primary); transition: width 0.2s; }
        .progress-section input[type="range"] { width: 100%; margin: 0.5rem 0; accent-color: var(--text-primary); }
        .progress-text { font-size: 0.7rem; color: var(--text-muted); }
        
        .book-footer { margin-top: auto; padding-top: 0.5rem; }
        .rating { display: flex; gap: 0.1rem; }
        .rating button { color: var(--text-dim); padding: 0.1rem; }
        .rating button.filled { color: #facc15; }
        
        @media (max-width: 600px) {
          .toolbar { flex-direction: column; align-items: stretch; }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
