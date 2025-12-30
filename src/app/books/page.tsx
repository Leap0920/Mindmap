"use client";

import { useState } from 'react';
import { Book as BookIcon, Plus, Search, Star, Clock } from 'lucide-react';

export default function BookHubPage() {
    const [books] = useState([
        { id: '1', title: 'Atomic Habits', author: 'James Clear', progress: 100, rating: 5, category: 'Self-Improvement' },
        { id: '2', title: 'Deep Work', author: 'Cal Newport', progress: 65, rating: 4, category: 'Productivity' },
        { id: '3', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', progress: 20, rating: 0, category: 'Fiction' },
    ]);

    return (
        <div className="book-hub">
            <header className="page-header">
                <div className="title-row">
                    <h1>Book Hub</h1>
                    <p>Your library and reading goals</p>
                </div>
                <button className="add-btn"><Plus size={18} /><span>Add Book</span></button>
            </header>

            <div className="filter-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Search your books..." />
                </div>
                <div className="categories">
                    {['All', 'Reading', 'Completed', 'Wishlist'].map(cat => (
                        <button key={cat} className={`cat-pill ${cat === 'All' ? 'active' : ''}`}>{cat}</button>
                    ))}
                </div>
            </div>

            <div className="book-grid">
                {books.map(book => (
                    <div key={book.id} className="book-card glass hover-lift">
                        <div className="book-cover">
                            <BookIcon size={48} strokeWidth={1} />
                        </div>
                        <div className="book-info">
                            <span className="cat-tag">{book.category}</span>
                            <h3>{book.title}</h3>
                            <p>{book.author}</p>

                            <div className="progress-section">
                                <div className="progress-label">
                                    <span>Progress</span>
                                    <span>{book.progress}%</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${book.progress}%` }} />
                                </div>
                            </div>

                            <div className="book-footer">
                                <div className="rating">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            fill={i < book.rating ? "var(--foreground)" : "none"}
                                            color={i < book.rating ? "var(--foreground)" : "var(--muted)"}
                                        />
                                    ))}
                                </div>
                                <div className="time-info">
                                    <Clock size={14} />
                                    <span>{book.progress === 100 ? 'Read' : '2h left'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .book-hub {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: var(--muted);
        }

        .add-btn {
          background: var(--foreground);
          color: var(--background);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          gap: 2rem;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--card-bg);
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid var(--card-border);
          color: var(--muted);
        }

        .search-box input {
          background: none;
          border: none;
          color: var(--foreground);
          width: 100%;
        }

        .categories {
          display: flex;
          gap: 0.75rem;
        }

        .cat-pill {
          padding: 0.5rem 1.25rem;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--muted);
          transition: all 0.2s;
        }

        .cat-pill.active {
          background: var(--foreground);
          color: var(--background);
          border-color: var(--foreground);
        }

        .book-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2rem;
        }

        .book-card {
          border-radius: 20px;
          border: 1px solid var(--card-border);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .book-cover {
          height: 180px;
          background: var(--card-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted-foreground);
          border-bottom: 1px solid var(--card-border);
        }

        .book-info {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cat-tag {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          font-weight: 700;
        }

        .book-info h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .book-info p {
          font-size: 0.9rem;
          color: var(--muted);
          margin-top: -0.5rem;
        }

        .progress-section {
          margin-top: 0.5rem;
        }

        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
          margin-bottom: 0.5rem;
        }

        .progress-bar-bg {
          height: 6px;
          background: var(--card-bg);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--foreground);
          border-radius: 3px;
        }

        .book-footer {
          margin-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid var(--card-border);
        }

        .rating {
          display: flex;
          gap: 2px;
        }

        .time-info {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .filter-bar {
            flex-direction: column;
            align-items: stretch;
          }
          .categories {
            overflow-x: auto;
            padding-bottom: 0.5rem;
          }
        }
      `}</style>
        </div>
    );
}
