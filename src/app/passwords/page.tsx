"use client";

import { useState } from 'react';
import ProtectedContent from '@/components/ProtectedContent';
import { Key, Copy, Eye, EyeOff, Search, Plus, ExternalLink, MoreVertical } from 'lucide-react';

export default function PasswordsPage() {
    const [passwords] = useState([
        { id: '1', site: 'Google', username: 'john.doe@gmail.com', password: '••••••••', url: 'google.com' },
        { id: '2', site: 'GitHub', username: 'johndoe_dev', password: '••••••••', url: 'github.com' },
        { id: '3', site: 'Netflix', username: 'family_account', password: '••••••••', url: 'netflix.com' },
    ]);

    return (
        <div className="password-page">
            <header className="page-header">
                <div className="title-section">
                    <h1>Password Vault</h1>
                    <p>Securely store your credentials</p>
                </div>
                <button className="add-btn">
                    <Plus size={18} />
                    <span>Add Password</span>
                </button>
            </header>

            <ProtectedContent isInitiallyLocked={true}>
                <div className="vault-content glass">
                    <div className="table-header">
                        <div className="search-bar">
                            <Search size={18} />
                            <input type="text" placeholder="Search vault..." />
                        </div>
                    </div>

                    <div className="password-list">
                        <div className="list-heading">
                            <span>Site</span>
                            <span>Username</span>
                            <span>Password</span>
                            <span className="actions-col"></span>
                        </div>
                        {passwords.map(pw => (
                            <div key={pw.id} className="password-row">
                                <div className="site-cell">
                                    <div className="site-icon"><Key size={16} /></div>
                                    <div className="site-info">
                                        <span className="name">{pw.site}</span>
                                        <span className="url">{pw.url}</span>
                                    </div>
                                </div>
                                <div className="user-cell">
                                    <span>{pw.username}</span>
                                    <button className="copy-btn"><Copy size={14} /></button>
                                </div>
                                <div className="pass-cell">
                                    <span>{pw.password}</span>
                                    <div className="cell-actions">
                                        <button className="copy-btn"><Eye size={14} /></button>
                                        <button className="copy-btn"><Copy size={14} /></button>
                                    </div>
                                </div>
                                <div className="actions-col">
                                    <button className="more-btn"><MoreVertical size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ProtectedContent>

            <style jsx>{`
        .password-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
        }

        .title-section h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }

        .title-section p {
          color: var(--muted);
          font-size: 1.1rem;
        }

        .add-btn {
          background: var(--foreground);
          color: var(--background);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .vault-content {
          border: 1px solid var(--card-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .table-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--card-border);
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--background);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--card-border);
          width: 100%;
          max-width: 400px;
          color: var(--muted);
        }

        .search-bar input {
          background: none;
          border: none;
          color: var(--foreground);
          width: 100%;
        }

        .password-list {
          display: flex;
          flex-direction: column;
        }

        .list-heading {
          display: grid;
          grid-template-columns: 2fr 2fr 1.5fr 60px;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--muted);
          letter-spacing: 0.05em;
        }

        .password-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1.5fr 60px;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--card-border);
          align-items: center;
          transition: background 0.2s;
        }

        .password-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .site-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .site-icon {
          width: 40px;
          height: 40px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
        }

        .site-info {
          display: flex;
          flex-direction: column;
        }

        .site-info .name {
          font-weight: 600;
          font-size: 1rem;
        }

        .site-info .url {
          font-size: 0.8rem;
          color: var(--muted);
        }

        .user-cell, .pass-cell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-right: 1.5rem;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.9rem;
        }

        .copy-btn {
          color: var(--muted);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .password-row:hover .copy-btn {
          opacity: 1;
        }

        .copy-btn:hover {
          color: var(--foreground);
        }

        .cell-actions {
          display: flex;
          gap: 0.5rem;
        }

        .more-btn {
          color: var(--muted);
        }

        @media (max-width: 800px) {
          .list-heading, .actions-col {
            display: none;
          }
          .password-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .user-cell, .pass-cell {
            padding-right: 0;
          }
          .copy-btn {
            opacity: 1;
          }
        }
      `}</style>
        </div>
    );
}
