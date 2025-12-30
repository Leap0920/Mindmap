"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Book, Search, Plus, Trash2, Loader2, X, BookOpen, Heart,
    Quote, BookMarked, CheckCircle, Eye, FileText, Sparkles, MessageSquare,
    LayoutDashboard, Library, TrendingUp, Calendar, Trophy, ArrowRight
} from 'lucide-react';

interface QuoteItem {
    _id: string;
    text: string;
    page?: number;
    chapter?: string;
    createdAt?: string;
}

interface BookItem {
    _id: string;
    title: string;
    author: string;
    category: string;
    status: 'wishlist' | 'reading' | 'completed';
    isFavorite: boolean;
    quotes: QuoteItem[];
    notes: string;
    totalPages: number;
    currentPage: number;
    updatedAt: string;
}

interface Stats {
    total: number;
    reading: number;
    completed: number;
    wishlist: number;
    favorites: number;
    totalQuotes: number;
}

const COLUMNS: { key: 'wishlist' | 'reading' | 'completed'; label: string; color: string; bg: string }[] = [
    { key: 'wishlist', label: 'Not started', color: '#888', bg: 'rgba(136, 136, 136, 0.1)' },
    { key: 'reading', label: 'In progress', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { key: 'completed', label: 'Done', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
];

export default function BooksPage() {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const [books, setBooks] = useState<BookItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState<'dashboard' | 'board'>('dashboard');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavorites, setShowFavorites] = useState(false);

    // Quick Add state
    const [activeAddingColumn, setActiveAddingColumn] = useState<'wishlist' | 'reading' | 'completed' | null>(null);
    const [quickTitle, setQuickTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [newQuote, setNewQuote] = useState({ text: '', page: '', chapter: '' });

    const fetchBooks = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const url = showFavorites ? '/api/books?favorite=true' : '/api/books';
            const res = await fetch(url);
            const data = await res.json();
            setBooks(data.books || []);
            setStats(data.stats || null);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session, showFavorites]);

    useEffect(() => {
        if (authStatus === 'unauthenticated') router.push('/login');
        else if (authStatus === 'authenticated') fetchBooks();
    }, [authStatus, router, fetchBooks]);

    const handleAddBook = async (status: 'wishlist' | 'reading' | 'completed') => {
        if (!quickTitle.trim()) {
            setActiveAddingColumn(null);
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: quickTitle,
                    status,
                    category: 'Other'
                }),
            });
            if (res.ok) {
                await fetchBooks();
                setQuickTitle('');
                setActiveAddingColumn(null);
            }
        } catch (error) {
            console.error('Error adding book:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const updateBookStatus = async (id: string, newStatus: 'wishlist' | 'reading' | 'completed') => {
        setBooks(prev => prev.map(b => b._id === id ? { ...b, status: newStatus } : b));
        try {
            await fetch('/api/books', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus }),
            });
            await fetchBooks();
        } catch (error) {
            console.error('Error updating status:', error);
            fetchBooks();
        }
    };

    const updateBook = async (id: string, updates: Record<string, unknown>, action?: string) => {
        try {
            const res = await fetch('/api/books', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, ...updates }),
            });
            if (res.ok) {
                await fetchBooks();
                if (selectedBook && selectedBook._id === id) {
                    const data = await res.json();
                    setSelectedBook(data.book);
                }
            }
        } catch (error) {
            console.error('Error updating book:', error);
        }
    };

    const toggleFavorite = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await updateBook(id, {}, 'toggleFavorite');
    };

    const deleteBook = async (id: string) => {
        if (!confirm('Are you sure you want to delete this book?')) return;
        try {
            const res = await fetch('/api/books', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                setBooks(prev => prev.filter(b => b._id !== id));
                setShowDetailsModal(false);
                setSelectedBook(null);
            }
        } catch (error) {
            console.error('Error deleting book:', error);
        }
    };

    const addQuote = async () => {
        if (!selectedBook || !newQuote.text.trim()) return;
        await updateBook(selectedBook._id, {
            quote: {
                text: newQuote.text,
                page: newQuote.page ? parseInt(newQuote.page) : undefined,
                chapter: newQuote.chapter || undefined
            }
        }, 'addQuote');
        setNewQuote({ text: '', page: '', chapter: '' });
        setShowQuoteModal(false);
    };

    const removeQuote = async (quoteId: string) => {
        if (!selectedBook) return;
        if (!confirm('Remove this quote?')) return;
        await updateBook(selectedBook._id, { quoteId }, 'removeQuote');
    };

    // Drag and Drop Logic
    const onDragStart = (e: React.DragEvent, bookId: string) => {
        e.dataTransfer.setData('bookId', bookId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const onDrop = (e: React.DragEvent, status: 'wishlist' | 'reading' | 'completed') => {
        e.preventDefault();
        const bookId = e.dataTransfer.getData('bookId');
        const book = books.find(b => b._id === bookId);
        if (book && book.status !== status) {
            updateBookStatus(bookId, status);
        }
    };

    const filteredBooks = books.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.author?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
        return matchesSearch;
    });

    // Dashboard Helpers
    const currentReads = books.filter(b => b.status === 'reading').slice(0, 3);
    const recentQuotes = books.flatMap(b => (b.quotes || []).map(q => ({ ...q, bookTitle: b.title, bookId: b._id }))).sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()).slice(0, 4);
    const wishlistPeek = books.filter(b => b.status === 'wishlist').slice(0, 5);

    if (authStatus === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="spin" />
                <style jsx>{`
                    .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #080808; color: #333; }
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="page">
            <header className="header">
                <div className="header-left">
                    <h1 className="header-title">Mindmap Books</h1>
                    <div className="view-switcher">
                        <button className={`view-btn ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
                            <LayoutDashboard size={18} /> Dashboard
                        </button>
                        <button className={`view-btn ${activeView === 'board' ? 'active' : ''}`} onClick={() => setActiveView('board')}>
                            <Library size={18} /> Library
                        </button>
                    </div>
                </div>
                <div className="header-right">
                    <div className="search-bar">
                        <Search size={16} />
                        <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <button className={`fav-toggle ${showFavorites ? 'active' : ''}`} onClick={() => setShowFavorites(!showFavorites)}>
                        <Heart size={18} fill={showFavorites ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </header>

            {activeView === 'dashboard' ? (
                <div className="dashboard-content animate-fade-in">
                    {/* Hero Stats */}
                    <div className="dashboard-grid-top">
                        <div className="main-stats-card glass">
                            <div className="stat-header">
                                <Trophy size={24} className="icon-gold" />
                                <h3>Reading Summary</h3>
                            </div>
                            <div className="stats-row">
                                <div className="stat-unit">
                                    <span className="unit-value">{stats?.total || 0}</span>
                                    <span className="unit-label">Total Books</span>
                                </div>
                                <div className="stat-unit">
                                    <span className="unit-value">{stats?.completed || 0}</span>
                                    <span className="unit-label">Completed</span>
                                </div>
                                <div className="stat-unit">
                                    <span className="unit-value">{stats?.totalQuotes || 0}</span>
                                    <span className="unit-label">Quotes Saved</span>
                                </div>
                            </div>
                            <div className="progress-mini">
                                <div className="bar">
                                    <div className="fill" style={{ width: `${(stats?.completed || 0) / (stats?.total || 1) * 100}%` }} />
                                </div>
                                <span className="label">{(stats?.completed || 0)} / {(stats?.total || 0)} books finished</span>
                            </div>
                        </div>

                        <div className="current-reads-section">
                            <div className="section-header">
                                <h3>Active Reads</h3>
                                <button className="text-btn" onClick={() => setActiveView('board')}>View all <ArrowRight size={14} /></button>
                            </div>
                            <div className="current-grid">
                                {currentReads.length > 0 ? currentReads.map(book => (
                                    <div key={book._id} className="book-card-lite glass" onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}>
                                        <div className="icon-circle reading"><BookOpen size={16} /></div>
                                        <div className="content">
                                            <h4>{book.title}</h4>
                                            <p>{book.author || 'Unknown'}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-current glass">
                                        <BookOpen size={24} color="#333" />
                                        <p>No active books</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-grid-bottom">
                        {/* Quotes Feed */}
                        <div className="quotes-feed glass">
                            <div className="section-header">
                                <h3>Saved Passages</h3>
                                <Sparkles size={18} className="icon-sparkle" />
                            </div>
                            <div className="quotes-stack">
                                {recentQuotes.length > 0 ? recentQuotes.map((q, i) => (
                                    <div key={q._id || i} className="dashboard-quote" onClick={() => { const b = books.find(book => book._id === q.bookId); if (b) { setSelectedBook(b); setShowDetailsModal(true); } }}>
                                        <Quote size={14} className="quote-icon" />
                                        <p>&quot;{q.text}&quot;</p>
                                        <span className="book-origin">{q.bookTitle}</span>
                                    </div>
                                )) : (
                                    <div className="empty-state-lite">
                                        <Quote size={24} color="#222" />
                                        <p>No quotes saved yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Wishlist Sidebar */}
                        <div className="wishlist-sidebar glass">
                            <div className="section-header">
                                <h3>Wishlist Highlights</h3>
                                <BookMarked size={18} color="#666" />
                            </div>
                            <div className="wishlist-list">
                                {wishlistPeek.length > 0 ? wishlistPeek.map(book => (
                                    <div key={book._id} className="wishlist-item" onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}>
                                        <div className="dot" />
                                        <div className="item-info">
                                            <span className="title">{book.title}</span>
                                            <span className="author">{book.author}</span>
                                        </div>
                                        <button className="add-btn" onClick={(e) => { e.stopPropagation(); updateBookStatus(book._id, 'reading'); }}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                )) : (
                                    <p className="no-items">Wishlist is empty</p>
                                )}
                                <button className="full-wishlist-btn" onClick={() => setActiveView('board')}>
                                    Full Wishlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="library-content animate-fade-in">
                    <div className="kanban-board">
                        {COLUMNS.map(col => (
                            <div
                                key={col.key}
                                className="kanban-column"
                                onDragOver={onDragOver}
                                onDrop={(e) => onDrop(e, col.key)}
                            >
                                <div className="column-header">
                                    <div className="header-label">
                                        <span className="dot" style={{ backgroundColor: col.color }} />
                                        {col.label}
                                    </div>
                                    <span className="count">{filteredBooks.filter(b => b.status === col.key).length}</span>
                                </div>

                                <div className="cards-container">
                                    {filteredBooks.filter(b => b.status === col.key).map(book => (
                                        <div
                                            key={book._id}
                                            className="book-card glass"
                                            draggable
                                            onDragStart={(e) => onDragStart(e, book._id)}
                                            onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}
                                        >
                                            <div className="card-top">
                                                {col.key === 'reading' ? (
                                                    <div className="reading-icon"><BookOpen size={16} /></div>
                                                ) : (
                                                    <FileText size={16} className="file-icon" />
                                                )}
                                                <h3 className="card-title">{book.title}</h3>
                                            </div>
                                            <div className="card-meta">
                                                {book.quotes?.length > 0 && (
                                                    <span className="quote-badge">
                                                        <MessageSquare size={12} />
                                                        {book.quotes.length}
                                                    </span>
                                                )}
                                                {book.isFavorite && <Heart size={12} fill="#ff4d4d" color="#ff4d4d" />}
                                                <span className="date-meta">{new Date(book.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {activeAddingColumn === col.key ? (
                                        <div className="quick-add-input">
                                            <input
                                                autoFocus
                                                placeholder="Book title..."
                                                value={quickTitle}
                                                onChange={e => setQuickTitle(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleAddBook(col.key);
                                                    if (e.key === 'Escape') setActiveAddingColumn(null);
                                                }}
                                                onBlur={() => handleAddBook(col.key)}
                                            />
                                        </div>
                                    ) : (
                                        <button className="add-card-btn" onClick={() => setActiveAddingColumn(col.key)}>
                                            <Plus size={16} /> New page
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedBook && (
                <div className="modal-overlay" onClick={() => { setShowDetailsModal(false); setSelectedBook(null); }}>
                    <div className="modal glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2 className="modal-title">{selectedBook.title}</h2>
                                <p className="modal-author">{selectedBook.author || 'Author Unknown'}</p>
                            </div>
                            <div className="modal-actions">
                                <button className="fav-modal-btn" onClick={(e) => toggleFavorite(e, selectedBook._id)}>
                                    <Heart size={20} fill={selectedBook.isFavorite ? 'currentColor' : 'none'} />
                                </button>
                                <button className="close-btn" onClick={() => { setShowDetailsModal(false); setSelectedBook(null); }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="section status-section">
                                <label>Move to</label>
                                <div className="status-grid">
                                    {COLUMNS.map(c => (
                                        <button
                                            key={c.key}
                                            className={`status-btn ${selectedBook.status === c.key ? 'active' : ''}`}
                                            onClick={() => updateBookStatus(selectedBook._id, c.key)}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="section quotes-section">
                                <div className="section-head">
                                    <h3>Quotes</h3>
                                    <button className="add-quote-btn" onClick={() => setShowQuoteModal(true)}>
                                        <Plus size={14} /> Add
                                    </button>
                                </div>
                                <div className="quotes-list-lite">
                                    {selectedBook.quotes?.map(q => (
                                        <div key={q._id} className="quote-card-lite">
                                            <p>&quot;{q.text}&quot;</p>
                                            <div className="quote-footer">
                                                {q.page && <span>p. {q.page}</span>}
                                                <button className="delete-quote" onClick={() => removeQuote(q._id)}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedBook.quotes || selectedBook.quotes.length === 0) && (
                                        <p className="empty-text">No quotes yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="section notes-section">
                                <h3>Notes</h3>
                                <textarea
                                    placeholder="Write your reflections..."
                                    value={selectedBook.notes || ''}
                                    onChange={e => updateBook(selectedBook._id, { notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="delete-book-link" onClick={() => deleteBook(selectedBook._id)}>
                                <Trash2 size={14} /> Delete permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Quote Modal */}
            {showQuoteModal && (
                <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
                    <div className="quote-modal glass" onClick={e => e.stopPropagation()}>
                        <h3>New Quote</h3>
                        <textarea
                            placeholder="What resonated with you?"
                            value={newQuote.text}
                            onChange={e => setNewQuote({ ...newQuote, text: e.target.value })}
                            rows={4}
                            autoFocus
                        />
                        <div className="quote-fields">
                            <input
                                type="number"
                                placeholder="Page"
                                value={newQuote.page}
                                onChange={e => setNewQuote({ ...newQuote, page: e.target.value })}
                            />
                            <input
                                placeholder="Chapter"
                                value={newQuote.chapter}
                                onChange={e => setNewQuote({ ...newQuote, chapter: e.target.value })}
                            />
                        </div>
                        <div className="quote-modal-footer">
                            <button className="cancel-btn" onClick={() => setShowQuoteModal(false)}>Cancel</button>
                            <button className="save-btn" onClick={addQuote} disabled={!newQuote.text.trim()}>Save passsage</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page {
                    min-height: 100vh;
                    background: #030303;
                    color: #fff;
                    padding: 32px;
                    font-family: 'Inter', -apple-system, sans-serif;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                    max-width: 1400px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 32px;
                }

                .header-title {
                    font-size: 1.25rem;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.02em;
                    color: #fff;
                }

                .view-switcher {
                    display: flex;
                    background: #0d0d0d;
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid #1a1a1a;
                }

                .view-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #666;
                    border: none;
                    background: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .view-btn.active {
                    background: #1a1a1a;
                    color: #fff;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #0d0d0d;
                    padding: 8px 16px;
                    border-radius: 10px;
                    border: 1px solid #1a1a1a;
                }

                .search-bar input {
                    background: none;
                    border: none;
                    color: #fff;
                    outline: none;
                    width: 180px;
                    font-size: 0.85rem;
                }

                .fav-toggle {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    color: #444;
                    padding: 8px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .fav-toggle.active {
                    color: #ff4d4d;
                    border-color: #ff4d4d33;
                }

                /* Dashboard UI */
                .dashboard-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .dashboard-grid-top {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 24px;
                }

                .dashboard-grid-bottom {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 24px;
                }

                .glass {
                    background: rgba(13, 13, 13, 0.7);
                    backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 24px;
                    padding: 24px;
                    transition: border-color 0.3s;
                }

                .glass:hover {
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .main-stats-card {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background: linear-gradient(145deg, rgba(20,20,20,0.8), rgba(10,10,10,0.8));
                }

                .stat-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 32px;
                }

                .stat-header h3 {
                    margin: 0;
                    font-size: 1rem;
                    color: #888;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .icon-gold { color: #facc15; }

                .stats-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                }

                .stat-unit {
                    display: flex;
                    flex-direction: column;
                }

                .unit-value {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #fff;
                    line-height: 1;
                }

                .unit-label {
                    font-size: 0.8rem;
                    color: #555;
                    margin-top: 4px;
                }

                .progress-mini .bar {
                    height: 6px;
                    background: #1a1a1a;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }

                .progress-mini .fill {
                    height: 100%;
                    background: #fff;
                    border-radius: 3px;
                }

                .progress-mini .label {
                    font-size: 0.75rem;
                    color: #444;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .section-header h3 {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #eee;
                }

                .text-btn {
                    background: none;
                    border: none;
                    color: #666;
                    font-size: 0.8rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .current-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                }

                .book-card-lite {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .book-card-lite:hover {
                    transform: translateY(-4px);
                }

                .icon-circle {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .icon-circle.reading {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }

                .book-card-lite .content h4 {
                    margin: 0;
                    font-size: 0.9rem;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 150px;
                }

                .book-card-lite .content p {
                    margin: 2px 0 0;
                    font-size: 0.75rem;
                    color: #555;
                }

                .empty-current {
                    grid-column: span 3;
                    height: 120px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #333;
                    gap: 8px;
                }

                .quotes-stack {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .dashboard-quote {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 20px;
                    border-radius: 20px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .dashboard-quote:hover {
                    background: rgba(255,255,255,0.04);
                }

                .quote-icon {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    color: #222;
                }

                .dashboard-quote p {
                    margin: 0 0 12px;
                    font-size: 0.9rem;
                    font-style: italic;
                    line-height: 1.5;
                    color: #bbb;
                }

                .book-origin {
                    font-size: 0.7rem;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .wishlist-sidebar {
                    display: flex;
                    flex-direction: column;
                }

                .wishlist-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .wishlist-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    background: rgba(255,255,255,0.02);
                    cursor: pointer;
                    transition: border-color 0.2s;
                }

                .wishlist-item:hover {
                    background: rgba(255,255,255,0.03);
                }

                .wishlist-item .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #333;
                }

                .item-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .item-info .title {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #eee;
                }

                .item-info .author {
                    font-size: 0.7rem;
                    color: #444;
                }

                .add-btn {
                    background: none;
                    border: none;
                    color: #444;
                    cursor: pointer;
                    padding: 4px;
                }

                .add-btn:hover { color: #fff; }

                .full-wishlist-btn {
                    margin-top: 12px;
                    padding: 10px;
                    border-radius: 10px;
                    background: #1a1a1a;
                    border: none;
                    color: #666;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                }

                /* Layout Board UI */
                .library-content {
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .kanban-board {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    align-items: flex-start;
                }

                .kanban-column {
                    background: rgba(13, 13, 13, 0.5);
                    border-radius: 20px;
                    padding: 20px;
                    min-height: 500px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .column-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 4px;
                }

                .header-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-weight: 700;
                    font-size: 0.9rem;
                    color: #fff;
                }

                .header-label .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .count {
                    font-size: 0.75rem;
                    color: #444;
                    background: #0d0d0d;
                    padding: 2px 10px;
                    border-radius: 6px;
                    font-weight: 700;
                }

                .cards-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .book-card {
                    padding: 20px;
                    cursor: grab;
                    background: rgba(26, 26, 26, 0.4);
                }

                .book-card:active { cursor: grabbing; }

                .card-top {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .reading-icon {
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                    padding: 4px;
                    border-radius: 6px;
                }

                .file-icon { color: #333; }

                .card-title {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 600;
                    line-height: 1.4;
                    color: #eee;
                }

                .card-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: #444;
                    font-size: 0.75rem;
                }

                .quote-badge {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: rgba(255,255,255,0.03);
                    padding: 2px 8px;
                    border-radius: 4px;
                }

                .date-meta {
                    margin-left: auto;
                    font-weight: 500;
                }

                .add-card-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: none;
                    border: 2px dashed #1a1a1a;
                    color: #444;
                    padding: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    width: 100%;
                    border-radius: 12px;
                    transition: all 0.2s;
                }

                .add-card-btn:hover {
                    border-color: #333;
                    color: #888;
                }

                .quick-add-input input {
                    width: 100%;
                    background: #0d0d0d;
                    border: 1px solid #3b82f6;
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #fff;
                    outline: none;
                    font-size: 0.9rem;
                }

                /* Modals Refined */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.85);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    backdrop-filter: blur(8px);
                    z-index: 1000;
                    padding: 20px;
                }

                .modal {
                    width: 540px;
                    max-height: 85vh;
                    overflow-y: auto;
                    padding: 40px;
                }

                .modal-header {
                    margin-bottom: 32px;
                    display: flex;
                    justify-content: space-between;
                }

                .modal-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    margin: 0;
                    letter-spacing: -0.03em;
                }

                .modal-author {
                    color: #555;
                    margin-top: 4px;
                    font-size: 1.1rem;
                }

                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-top: 12px;
                }

                .status-btn {
                    padding: 12px;
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 12px;
                    color: #444;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .status-btn.active {
                    background: #fff;
                    color: #000;
                    border-color: #fff;
                }

                .section h3 {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #333;
                    margin-bottom: 16px;
                }

                .quotes-list-lite {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .quote-card-lite {
                    background: #0d0d0d;
                    padding: 20px;
                    border-radius: 16px;
                    border-left: 3px solid #333;
                }

                .quote-card-lite p {
                    margin: 0 0 12px;
                    font-style: italic;
                    color: #aaa;
                    line-height: 1.6;
                }

                .quote-footer {
                    display: flex;
                    justify-content: space-between;
                    color: #333;
                    font-size: 0.75rem;
                }

                .notes-section textarea {
                    width: 100%;
                    min-height: 140px;
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 16px;
                    padding: 20px;
                    color: #bbb;
                    font-size: 0.95rem;
                    outline: none;
                    line-height: 1.6;
                }

                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 1100px) {
                    .dashboard-grid-top, .dashboard-grid-bottom { grid-template-columns: 1fr; }
                    .stats-row { justify-content: space-around; }
                }

                @media (max-width: 800px) {
                    .kanban-board { grid-template-columns: 1fr; }
                    .header { flex-direction: column; align-items: flex-start; gap: 24px; }
                    .header-right { width: 100%; justify-content: space-between; }
                }
            `}</style>
        </div>
    );
}
