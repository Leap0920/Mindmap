"use client";

import { useState } from 'react';
import ProtectedContent from '@/components/ProtectedContent';
import { Key, Copy, Eye, Search, Plus, MoreVertical, ShieldCheck, Globe, User, Fingerprint } from 'lucide-react';

export default function PasswordsPage() {
  const [passwords] = useState([
    { id: '1', site: 'Google Workspace', username: 'john.dev@gmail.com', password: '••••••••', url: 'accounts.google.com' },
    { id: '2', site: 'GitHub Enterprise', username: 'john_syntax', password: '••••••••', url: 'github.com' },
    { id: '3', site: 'DigitalOcean', username: 'admin@mindmap.io', password: '••••••••', url: 'digitalocean.com' },
  ]);

  return (
    <div className="vault-page">
      <header className="page-header">
        <div className="title-group">
          <div className="security-badge">
            <ShieldCheck size={14} />
            <span>End-to-End Encrypted</span>
          </div>
          <h1 className="text-gradient">Secure Vault</h1>
          <p>Military-grade storage for your digital keys.</p>
        </div>
        <button className="primary-btn">
          <Plus size={18} />
          <span>New Entry</span>
        </button>
      </header>

      <ProtectedContent isInitiallyLocked={true}>
        <div className="vault-container glass-panel">
          <div className="vault-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search decrypted vault..." />
            </div>
            <div className="toolbar-actions">
              <button className="icon-btn"><Fingerprint size={18} /></button>
              <button className="secondary-btn">Export</button>
            </div>
          </div>

          <div className="vault-table">
            <div className="table-head">
              <span>Identity</span>
              <span>Account</span>
              <span>Credential</span>
              <span className="actions-cell"></span>
            </div>
            {passwords.map(pw => (
              <div key={pw.id} className="vault-row">
                <div className="identity-cell">
                  <div className="site-avatar"><Globe size={18} /></div>
                  <div className="site-details">
                    <span className="site-name">{pw.site}</span>
                    <span className="site-url">{pw.url}</span>
                  </div>
                </div>
                <div className="account-cell">
                  <User size={14} />
                  <span>{pw.username}</span>
                  <button className="copy-small"><Copy size={12} /></button>
                </div>
                <div className="credential-cell">
                  <span className="pass-dots">{pw.password}</span>
                  <div className="pass-actions">
                    <button className="action-circle"><Eye size={12} /></button>
                    <button className="action-circle"><Copy size={12} /></button>
                  </div>
                </div>
                <div className="actions-cell">
                  <button className="more-trigger"><MoreVertical size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProtectedContent>

      <style jsx>{`
        .vault-page {
          max-width: 1000px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; filter: blur(10px); }
          to { opacity: 1; filter: blur(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 4rem;
        }

        .security-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 255, 136, 0.05);
          color: #00ff88;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          border: 1px solid rgba(0, 255, 136, 0.1);
        }

        .page-header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .primary-btn {
          background: var(--text-primary);
          color: var(--bg-deep);
          padding: 0.8rem 1.75rem;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .vault-container {
          border-radius: var(--border-radius-xl);
          overflow: hidden;
        }

        .vault-toolbar {
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border-dim);
        }

        .search-box {
          flex: 1;
          max-width: 400px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-deep);
          border: 1px solid var(--border-main);
          border-radius: 10px;
          color: var(--text-muted);
        }

        .search-box input {
          background: none;
          border: none;
          color: var(--text-primary);
          width: 100%;
          font-size: 0.9rem;
        }

        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .secondary-btn {
          background: rgba(255,255,255,0.05);
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          border: 1px solid var(--border-main);
        }

        .table-head {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 60px;
          padding: 1rem 2rem;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          border-bottom: 1px solid var(--border-dim);
        }

        .vault-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1.5fr 60px;
          padding: 1.5rem 2rem;
          align-items: center;
          border-bottom: 1px solid var(--border-dim);
          transition: var(--transition-base);
        }

        .vault-row:hover {
          background: rgba(255,255,255,0.02);
        }

        .identity-cell {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .site-avatar {
          width: 44px;
          height: 44px;
          background: var(--bg-card);
          border: 1px solid var(--border-main);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .site-name {
          display: block;
          font-weight: 700;
          font-size: 1rem;
        }

        .site-url {
          font-size: 0.8rem;
          color: var(--text-dim);
        }

        .account-cell, .credential-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .copy-small {
          color: var(--text-dim);
          opacity: 0;
          transition: var(--transition-fast);
        }

        .vault-row:hover .copy-small {
          opacity: 1;
        }

        .pass-dots {
          letter-spacing: 0.2em;
        }

        .pass-actions {
          display: flex;
          gap: 0.4rem;
          opacity: 0;
          transition: var(--transition-fast);
        }

        .vault-row:hover .pass-actions {
          opacity: 1;
        }

        .action-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .action-circle:hover {
          color: var(--text-primary);
          border-color: var(--border-main);
        }

        .more-trigger {
          color: var(--text-dim);
        }

        @media (max-width: 900px) {
          .table-head, .actions-cell { display: none; }
          .vault-row { grid-template-columns: 1fr; gap: 1.5rem; }
          .pass-actions, .copy-small { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
