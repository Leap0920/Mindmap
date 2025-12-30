"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Book, Search, Plus, Trash2, Loader2, X, BookOpen, Heart,
    Quote, BookMarked, CheckCircle, Eye, FileText, Sparkles, MessageSquare,
    LayoutDashboard, Library, Trophy, ArrowRight, Calendar, Tag, Info,
    Hash, ExternalLink, Copy, Share2, Clock
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
    description?: string;
    tags?: string[];
    startDate?: string;
    finishDate?: string;
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

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Self-Help', 'Business', 'Science', 'Biography', 'Philosophy', 'Fantasy', 'History', 'Other'];

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

    const [activeAddingColumn, setActiveAddingColumn] = useState<'wishlist' | 'reading' | 'completed' | null>(null);
    const [quickTitle, setQuickTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [newQuote, setNewQuote] = useState({ text: '', page: '', chapter: '' });
    const [newTag, setNewTag] = useState('');
    const [localNotes, setLocalNotes] = useState('');
    const [isSavingQuote, setIsSavingQuote] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const fetchBooks = useCallback(async (isInitial = false) => {
        if (!session) return;
        if (isInitial) setIsLoading(true);
        try {
            const url = showFavorites ? '/api/books?favorite=true' : '/api/books';
            const res = await fetch(url);
            const data = await res.json();
            setBooks(data.books || []);
            setStats(data.stats || null);
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            if (isInitial) setIsLoading(false);
        }
    }, [session, showFavorites]);

    useEffect(() => {
        if (authStatus === 'unauthenticated') router.push('/login');
        else if (authStatus === 'authenticated') fetchBooks(true);
    }, [authStatus, router, fetchBooks]);

    // Keep selected book in sync with the books list (e.g. when fetchBooks updates the list)
    useEffect(() => {
        if (selectedBook) {
            const current = books.find(b => b._id === selectedBook._id);
            if (current) {
                // Check if there's a meaningful change that wasn't already applied
                const isDifferent = current.updatedAt !== selectedBook.updatedAt ||
                    (current.quotes?.length || 0) !== (selectedBook.quotes?.length || 0) ||
                    current.notes !== selectedBook.notes;

                if (isDifferent) {
                    setSelectedBook(current);
                    setLocalNotes(current.notes || '');
                }
            }
        }
    }, [books]); // Only trigger when books array changes

    // Initialize local notes when a book is selected
    useEffect(() => {
        if (selectedBook) {
            setLocalNotes(selectedBook.notes || '');
        }
    }, [selectedBook?._id]);

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
            const updates: any = { status: newStatus };
            if (newStatus === 'reading') updates.startDate = new Date().toISOString();
            if (newStatus === 'completed') updates.finishDate = new Date().toISOString();

            await fetch('/api/books', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...updates }),
            });
            await fetchBooks();
        } catch (error) {
            console.error('Error updating status:', error);
            fetchBooks();
        }
    };

    const updateBook = async (id: string, updates: Record<string, unknown>, action?: string) => {
        // Optimistically update local state for notes or other fields if possible
        if (updates.notes !== undefined && !action) {
            // Handled via localNotes and onBlur, but update selectedBook just in case
            setSelectedBook(prev => prev && prev._id === id ? { ...prev, notes: updates.notes as string } : prev);
        }

        try {
            const res = await fetch('/api/books', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, ...updates }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update local books state directly
                setBooks(prev => prev.map(b => b._id === id ? data.book : b));
                if (selectedBook && selectedBook._id === id) {
                    setSelectedBook(data.book);
                }
                // Silently refresh stats in background
                fetchBooks(false);
                return true;
            } else {
                console.error('Update failed:', data.error);
                setSaveError(data.error || 'Server error');
                // If update failed, reset local state to match selectedBook
                if (updates.notes !== undefined) {
                    setLocalNotes(selectedBook?.notes || '');
                }
                return false;
            }
        } catch (error: any) {
            console.error('Error updating book:', error);
            setSaveError(error.message || 'Connection error');
            if (updates.notes !== undefined) {
                setLocalNotes(selectedBook?.notes || '');
            }
            return false;
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

        setIsSavingQuote(true);
        setSaveError(null);
        const pageNum = parseInt(newQuote.page);
        const quoteData = {
            text: newQuote.text.trim(),
            page: !isNaN(pageNum) ? pageNum : undefined,
            chapter: newQuote.chapter?.trim() || undefined
        };

        const success = await updateBook(selectedBook._id, { quote: quoteData }, 'addQuote');

        if (success) {
            // Clean up
            setNewQuote({ text: '', page: '', chapter: '' });
            setShowQuoteModal(false);
        }
        setIsSavingQuote(false);
    };

    const removeQuote = async (quoteId: string) => {
        if (!selectedBook) return;
        if (!confirm('Remove this quote?')) return;
        await updateBook(selectedBook._id, { quoteId }, 'removeQuote');
    };

    const addTag = async () => {
        if (!selectedBook || !newTag.trim()) return;
        const tags = [...(selectedBook.tags || []), newTag.trim()];
        await updateBook(selectedBook._id, { tags });
        setNewTag('');
    };

    const removeTag = async (tag: string) => {
        if (!selectedBook) return;
        const tags = (selectedBook.tags || []).filter(t => t !== tag);
        await updateBook(selectedBook._id, { tags });
    };

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
                                            onClick={() => { setSelectedBook(book); setShowDetailsModal(true); }}>
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

            {/* Details Modal - IMPROVED SECTION */}
            {showDetailsModal && selectedBook && (
                <div className="modal-overlay" onClick={() => { setShowDetailsModal(false); setSelectedBook(null); }}>
                    <div className="modal detail-modal glass" onClick={e => e.stopPropagation()}>

                        <div className="detail-layout">
                            {/* Left Column: Information & Meta */}
                            <div className="detail-sidebar">
                                <div className="sidebar-header">
                                    <div className="modal-icon"><Book size={24} /></div>
                                    <div className="sidebar-titles">
                                        <h2 className="modal-title">{selectedBook.title}</h2>
                                        <p className="modal-author">{selectedBook.author || 'Author Unknown'}</p>
                                    </div>
                                    <div className="modal-quick-actions">
                                        <button className={`fav-btn-modal ${selectedBook.isFavorite ? 'active' : ''}`} onClick={(e) => toggleFavorite(e, selectedBook._id)}>
                                            <Heart size={20} fill={selectedBook.isFavorite ? 'currentColor' : 'none'} />
                                        </button>
                                        <button className="close-btn-modal" onClick={() => { setShowDetailsModal(false); setSelectedBook(null); }}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="meta-info">
                                    <div className="info-group">
                                        <label><Info size={14} /> Status</label>
                                        <div className="status-selector-modern">
                                            {COLUMNS.map(c => (
                                                <button
                                                    key={c.key}
                                                    className={`status-pill-modern ${selectedBook.status === c.key ? 'active' : ''}`}
                                                    onClick={() => updateBookStatus(selectedBook._id, c.key)}
                                                    style={{ '--active-bg': c.bg, '--active-color': c.color } as any}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="info-grid">
                                        <div className="info-group">
                                            <label><Calendar size={14} /> Created</label>
                                            <span className="info-value">{new Date(selectedBook.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="info-group">
                                            <label><Hash size={14} /> Category</label>
                                            <select
                                                className="modern-select"
                                                value={selectedBook.category || 'Other'}
                                                onChange={e => updateBook(selectedBook._id, { category: e.target.value })}
                                            >
                                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="info-group">
                                        <label><Tag size={14} /> Tags</label>
                                        <div className="tag-container">
                                            {selectedBook.tags?.map(t => (
                                                <span key={t} className="modern-tag">
                                                    {t} <X size={10} onClick={() => removeTag(t)} />
                                                </span>
                                            ))}
                                            <div className="tag-input-wrap">
                                                <input
                                                    placeholder="Add tag..."
                                                    value={newTag}
                                                    onChange={e => setNewTag(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addTag()}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-group">
                                        <label><Clock size={14} /> Reading Timeline</label>
                                        <div className="timeline-box">
                                            <div className="timeline-entry">
                                                <span className="label">Started</span>
                                                <span className="val">{selectedBook.startDate ? new Date(selectedBook.startDate).toLocaleDateString() : 'Not started'}</span>
                                            </div>
                                            <div className="timeline-entry">
                                                <span className="label">Finished</span>
                                                <span className="val">{selectedBook.finishDate ? new Date(selectedBook.finishDate).toLocaleDateString() : '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sidebar-footer">
                                    <button className="danger-btn-modern" onClick={() => deleteBook(selectedBook._id)}>
                                        <Trash2 size={14} /> Delete Book
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Main Content */}
                            <div className="detail-content">
                                <div className="tab-section">
                                    <div className="section-header-modern">
                                        <div className="header-title-wrap">
                                            <Quote size={18} />
                                            <h3>Saved Quotes</h3>
                                        </div>
                                        <button className="add-btn-modern" onClick={() => setShowQuoteModal(true)}>
                                            <Plus size={16} /> New passage
                                        </button>
                                    </div>

                                    <div className="content-scrollable">
                                        {selectedBook.quotes && selectedBook.quotes.length > 0 ? (
                                            <div className="quotes-grid-modern">
                                                {selectedBook.quotes.map(q => (
                                                    <div key={q._id} className="quote-card-modern glass">
                                                        <Quote size={12} className="quote-tick" />
                                                        <p className="quote-text">&quot;{q.text}&quot;</p>
                                                        <div className="quote-meta-modern">
                                                            <div className="meta-left">
                                                                {q.page && <span className="p-badge">p. {q.page}</span>}
                                                                {q.chapter && <span className="c-badge">{q.chapter}</span>}
                                                            </div>
                                                            <div className="meta-right">
                                                                <button className="action-icon-modern" title="Copy"><Copy size={12} /></button>
                                                                <button className="action-icon-modern" onClick={() => removeQuote(q._id)} title="Delete"><Trash2 size={12} /></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-content-state">
                                                <div className="empty-illustration">
                                                    <Sparkles size={32} color="#1a1a1a" />
                                                </div>
                                                <p>No quotes saved yet. Tap &apos;New passage&apos; to start collecting wisdom.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="notes-section-modern">
                                    <div className="section-header-modern">
                                        <div className="header-title-wrap">
                                            <FileText size={18} />
                                            <h3>Notes & Reflections</h3>
                                        </div>
                                    </div>
                                    <div className="textarea-modern-wrap">
                                        <textarea
                                            placeholder="Write your long-form reflections here..."
                                            value={localNotes}
                                            onChange={e => setLocalNotes(e.target.value)}
                                            onBlur={() => {
                                                if (selectedBook && localNotes !== selectedBook.notes) {
                                                    updateBook(selectedBook._id, { notes: localNotes });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Quote Modal */}
            {showQuoteModal && (
                <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
                    <div className="quote-modal glass" onClick={e => e.stopPropagation()}>
                        <div className="quote-modal-head">
                            <Quote size={20} className="icon-blue" />
                            <h3>New Passage</h3>
                        </div>

                        {saveError && (
                            <div className="save-error-banner">
                                {saveError}
                            </div>
                        )}
                        <textarea
                            className="modern-textarea"
                            placeholder="Type or paste the quote that inspired you..."
                            value={newQuote.text}
                            onChange={e => setNewQuote({ ...newQuote, text: e.target.value })}
                            rows={6}
                            autoFocus
                        />
                        <div className="quote-fields-modern">
                            <div className="field">
                                <label>Page Number</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newQuote.page}
                                    onChange={e => setNewQuote({ ...newQuote, page: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Chapter / Section</label>
                                <input
                                    placeholder="e.g. Chapter 4"
                                    value={newQuote.chapter}
                                    onChange={e => setNewQuote({ ...newQuote, chapter: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="quote-modal-footer">
                            <button className="cancel-btn-modern" onClick={() => setShowQuoteModal(false)}>Discard</button>
                            <button
                                className="save-btn-modern"
                                onClick={addQuote}
                                disabled={!newQuote.text.trim() || isSavingQuote}
                            >
                                {isSavingQuote ? <Loader2 size={16} className="spin" /> : 'Save quote'}
                            </button>
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
                    overflow-y: auto;
                    height: 100vh;
                }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; max-width: 1400px; margin-left: auto; margin-right: auto; }
                .header-left { display: flex; align-items: center; gap: 32px; }
                .header-title { font-size: 1.25rem; font-weight: 800; margin: 0; letter-spacing: -0.02em; color: #fff; }
                .view-switcher { display: flex; background: #0d0d0d; padding: 4px; border-radius: 12px; border: 1px solid #1a1a1a; }
                .view-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; color: #666; border: none; background: none; cursor: pointer; transition: all 0.2s; }
                .view-btn.active { background: #1a1a1a; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .header-right { display: flex; align-items: center; gap: 16px; }
                .search-bar { display: flex; align-items: center; gap: 10px; background: #0d0d0d; padding: 8px 16px; border-radius: 10px; border: 1px solid #1a1a1a; }
                .search-bar input { background: none; border: none; color: #fff; outline: none; width: 180px; font-size: 0.85rem; }
                .fav-toggle { background: #0d0d0d; border: 1px solid #1a1a1a; color: #444; padding: 8px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
                .fav-toggle.active { color: #ff4d4d; border-color: #ff4d4d33; }
                .glass { background: rgba(13, 13, 13, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 24px; transition: border-color 0.3s; }
                
                /* Dashboard UI */
                .dashboard-content { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
                .dashboard-grid-top { display: grid; grid-template-columns: 1fr 1.5fr; gap: 24px; }
                .dashboard-grid-bottom { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
                .main-stats-card { display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(145deg, rgba(20,20,20,0.8), rgba(10,10,10,0.8)); }
                .stat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
                .stat-header h3 { margin: 0; font-size: 0.8rem; color: #555; text-transform: uppercase; letter-spacing: 0.1em; }
                .icon-gold { color: #facc15; }
                .stats-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
                .stat-unit { display: flex; flex-direction: column; }
                .unit-value { font-size: 2.5rem; font-weight: 800; color: #fff; line-height: 1; }
                .unit-label { font-size: 0.75rem; color: #444; margin-top: 4px; }
                .progress-mini .bar { height: 6px; background: #1a1a1a; border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
                .progress-mini .fill { height: 100%; background: #fff; border-radius: 3px; }
                .progress-mini .label { font-size: 0.7rem; color: #333; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .section-header h3 { margin: 0; font-size: 0.9rem; font-weight: 700; color: #eee; }
                .text-btn { background: none; border: none; color: #444; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 4px; }
                .current-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                .book-card-lite { display: flex; align-items: center; gap: 16px; padding: 20px; cursor: pointer; transition: transform 0.2s; }
                .book-card-lite:hover { transform: translateY(-4px); }
                .icon-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
                .icon-circle.reading { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .book-card-lite .content h4 { margin: 0; font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
                .book-card-lite .content p { margin: 2px 0 0; font-size: 0.7rem; color: #444; }
                .empty-current { grid-column: span 3; height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #1a1a1a; gap: 8px; }
                .quotes-stack { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .dashboard-quote { background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.02); padding: 20px; border-radius: 20px; position: relative; cursor: pointer; transition: background 0.2s; }
                .dashboard-quote:hover { background: rgba(255,255,255,0.03); }
                .quote-icon { position: absolute; top: 16px; right: 16px; color: #111; }
                .dashboard-quote p { margin: 0 0 12px; font-size: 0.85rem; font-style: italic; line-height: 1.5; color: #888; }
                .book-origin { font-size: 0.65rem; color: #444; text-transform: uppercase; letter-spacing: 0.05em; }
                .wishlist-sidebar { display: flex; flex-direction: column; }
                .wishlist-list { display: flex; flex-direction: column; gap: 12px; }
                .wishlist-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.01); cursor: pointer; transition: all 0.2s; }
                .wishlist-item:hover { background: rgba(255,255,255,0.02); }
                .wishlist-item .dot { width: 5px; height: 5px; border-radius: 50%; background: #222; }
                .item-info { flex: 1; display: flex; flex-direction: column; }
                .item-info .title { font-size: 0.8rem; font-weight: 500; color: #bbb; }
                .item-info .author { font-size: 0.65rem; color: #333; }
                .add-btn { background: none; border: none; color: #333; cursor: pointer; padding: 4px; }
                .full-wishlist-btn { margin-top: 12px; padding: 10px; border-radius: 10px; background: #0d0d0d; border: none; color: #444; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
                
                /* Layout Board UI */
                .library-content { max-width: 1400px; margin: 0 auto; }
                .kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: flex-start; }
                .kanban-column { background: rgba(13, 13, 13, 0.3); border-radius: 20px; padding: 20px; min-height: 500px; display: flex; flex-direction: column; gap: 20px; }
                .column-header { display: flex; justify-content: space-between; align-items: center; padding: 0 4px; }
                .header-label { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.85rem; color: #888; }
                .header-label .dot { width: 8px; height: 8px; border-radius: 50%; }
                .count { font-size: 0.7rem; color: #333; background: #080808; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
                .cards-container { display: flex; flex-direction: column; gap: 12px; }
                .book-card { padding: 20px; cursor: grab; background: rgba(20, 20, 20, 0.4); }
                .card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
                .reading-icon { color: #3b82f6; background: rgba(59, 130, 246, 0.1); padding: 4px; border-radius: 6px; }
                .file-icon { color: #222; }
                .card-title { margin: 0; font-size: 0.9rem; font-weight: 600; line-height: 1.4; color: #eee; }
                .card-meta { display: flex; align-items: center; gap: 12px; color: #333; font-size: 0.7rem; }
                .quote-badge { display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.02); padding: 2px 6px; border-radius: 4px; }
                .date-meta { margin-left: auto; }
                .add-card-btn { display: flex; align-items: center; gap: 8px; background: none; border: 2px dashed #0d0d0d; color: #333; padding: 12px; font-size: 0.8rem; font-weight: 600; cursor: pointer; width: 100%; border-radius: 12px; transition: all 0.2s; }
                .add-card-btn:hover { border-color: #1a1a1a; color: #555; }
                .quick-add-input input { width: 100%; background: #080808; border: 1px solid #3b82f633; border-radius: 12px; padding: 12px 16px; color: #fff; outline: none; font-size: 0.85rem; }

                /* MODAL: DETAIL SECTION IMPROVED */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(12px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
                .detail-modal { 
                    width: 920px; 
                    height: 85vh;
                    max-height: 85vh; 
                    padding: 0; 
                    overflow: hidden; 
                    display: flex; 
                    flex-direction: column; 
                    border: 1px solid rgba(255,255,255,0.08); 
                }
                
                .detail-layout { 
                    display: grid; 
                    grid-template-columns: 320px 1fr; 
                    height: 100%;
                    overflow: hidden;
                }
                
                /* Left Sidebar */
                .detail-sidebar { 
                    background: #0a0a0a; 
                    border-right: 1px solid rgba(255,255,255,0.05); 
                    padding: 40px 32px; 
                    display: flex; 
                    flex-direction: column;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #222 transparent;
                }
                .sidebar-header { margin-bottom: 40px; position: relative; }
                .modal-icon { width: 48px; height: 48px; border-radius: 14px; background: #111; display: flex; align-items: center; justify-content: center; color: #444; margin-bottom: 20px; }
                .modal-title { font-size: 1.5rem; font-weight: 800; line-height: 1.2; margin: 0; letter-spacing: -0.03em; color: #fff; }
                .modal-author { font-size: 0.95rem; color: #555; margin: 4px 0 0; }
                
                .modal-quick-actions { position: absolute; top: -10px; right: -10px; display: flex; gap: 8px; }
                .fav-btn-modal, .close-btn-modal { background: none; border: none; color: #333; padding: 8px; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
                .fav-btn-modal:hover { color: #ff6b6b; background: rgba(255,107,107,0.05); }
                .fav-btn-modal.active { color: #ff6b6b; }
                .close-btn-modal:hover { color: #fff; background: #1a1a1a; }
                
                .meta-info { flex: 1; display: flex; flex-direction: column; gap: 32px; }
                .info-group { display: flex; flex-direction: column; gap: 10px; }
                .info-group label { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #444; }
                .info-value { font-size: 0.85rem; font-weight: 500; color: #eee; }
                
                .status-selector-modern { display: flex; flex-direction: column; gap: 4px; }
                .status-pill-modern { text-align: left; padding: 10px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 600; color: #444; background: #0d0d0d; border: 1px solid transparent; transition: all 0.2s; cursor: pointer; }
                .status-pill-modern.active { background: var(--active-bg); color: var(--active-color); border-color: rgba(255,255,255,0.05); }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .modern-select { background: #0d0d0d; border: 1px solid #1a1a1a; color: #888; padding: 8px 10px; border-radius: 8px; font-size: 0.8rem; outline: none; }
                
                .tag-container { display: flex; flex-wrap: wrap; gap: 6px; }
                .modern-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #111; color: #555; font-size: 0.7rem; font-weight: 700; border-radius: 6px; border: 1px solid #1a1a1a; }
                .modern-tag svg { cursor: pointer; transition: color 0.1s; }
                .modern-tag svg:hover { color: #fff; }
                .tag-input-wrap input { width: 100%; background: none; border: none; color: #444; outline: none; font-size: 0.75rem; padding: 4px 0; border-bottom: 1px solid #111; }
                
                .timeline-box { background: #080808; border: 1px solid #151515; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
                .timeline-entry { display: flex; justify-content: space-between; font-size: 0.7rem; }
                .timeline-entry .label { color: #333; font-weight: 600; text-transform: uppercase; }
                .timeline-entry .val { color: #666; font-weight: 500; }
                
                .sidebar-footer { padding-top: 20px; margin-top: 20px; border-top: 1px solid #151515; }
                .danger-btn-modern { background: none; border: none; color: #333; display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: color 0.2s; }
                .danger-btn-modern:hover { color: #ff6b6b; }
                
                /* Right Content */
                .detail-content { 
                    background: #030303; 
                    padding: 40px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 40px; 
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: #222 transparent;
                }
                .section-header-modern { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .header-title-wrap { display: flex; align-items: center; gap: 12px; color: #333; }
                .header-title-wrap h3 { font-size: 1rem; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 0.05em; color: #eee; }
                .add-btn-modern { background: none; border: 1px solid #1a1a1a; color: #444; padding: 6px 14px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.2s; }
                .add-btn-modern:hover { color: #fff; border-color: #333; background: #0d0d0d; }
                
                .quotes-grid-modern { display: grid; grid-template-columns: 1fr; gap: 16px; }
                .quote-card-modern { padding: 24px; position: relative; border-radius: 20px; border-left: 2px solid #222; }
                .quote-tick { position: absolute; top: 16px; right: 16px; color: #111; }
                .quote-text { margin: 0 0 20px; font-size: 0.95rem; font-style: italic; color: #bbb; line-height: 1.7; }
                .quote-meta-modern { display: flex; justify-content: space-between; align-items: center; }
                .p-badge, .c-badge { font-size: 0.65rem; padding: 4px 8px; border-radius: 4px; background: rgba(255,255,255,0.02); color: #444; font-weight: 700; margin-right: 8px; }
                .action-icon-modern { background: none; border: none; color: #222; cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.2s; }
                .action-icon-modern:hover { color: #666; background: #111; }
                
                .empty-content-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 60px 0; color: #222; text-align: center; }
                .empty-content-state p { font-size: 0.85rem; max-width: 250px; line-height: 1.5; color: #444; }
                
                .notes-section-modern { background: #080808; border-radius: 24px; padding: 24px; border: 1px solid #1a1a1a; }
                .textarea-modern-wrap textarea { width: 100%; min-height: 180px; background: none; border: none; outline: none; color: #888; line-height: 1.7; font-size: 0.9rem; resize: vertical; }
                
                /* Quote Add Modal */
                .quote-modal { width: 440px; padding: 32px; border: 1px solid rgba(255,255,255,0.08); }
                .quote-modal-head { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .quote-modal-head h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }
                .icon-blue { color: #3b82f6; }
                .modern-textarea { width: 100%; background: #080808; border: 1px solid #1a1a1a; padding: 16px; border-radius: 12px; color: #fff; outline: none; margin-bottom: 20px; resize: none; font-size: 0.95rem; line-height: 1.6; }
                .quote-fields-modern { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                .quote-fields-modern label { display: block; font-size: 0.7rem; font-weight: 700; color: #444; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.05em; }
                .quote-fields-modern input { width: 100%; background: #080808; border: 1px solid #1a1a1a; padding: 10px 14px; border-radius: 10px; color: #fff; outline: none; font-size: 0.85rem; }
                .quote-modal-footer { display: flex; justify-content: flex-end; gap: 12px; }
                .cancel-btn-modern { background: none; border: none; color: #444; font-weight: 600; cursor: pointer; }
                .save-btn-modern { background: #fff; color: #000; border: none; padding: 10px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: transform 0.2s; }
                .save-btn-modern:hover { transform: translateY(-2px); }
                .save-btn-modern:disabled { opacity: 0.5; cursor: not-allowed; }

                .save-error-banner {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    padding: 10px 14px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    margin-bottom: 16px;
                    text-align: center;
                }

                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                @media (max-width: 900px) {
                    .detail-modal { width: 95vw; height: 95vh; }
                    .detail-layout { grid-template-columns: 1fr; }
                    .detail-sidebar { padding: 32px; flex-direction: row; flex-wrap: wrap; height: auto; }
                    .detail-content { padding: 32px; }
                }
            `}</style>
        </div>
    );
}
