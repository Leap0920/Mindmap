"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Key, Copy, Eye, EyeOff, Search, Plus, Trash2, ShieldCheck, Globe, User, Loader2, X } from 'lucide-react';

interface Credential {
    _id: string;
    site: string;
    url: string;
    username: string;
    password: string;
    category: string;
}

const CATEGORIES = ['General', 'Social', 'Work', 'Finance', 'Development'];

export default function PasswordsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [newCred, setNewCred] = useState({
        site: '',
        url: '',
        username: '',
        password: '',
        category: 'General',
    });

    const fetchCredentials = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/credentials');
            const data = await res.json();
            setCredentials(data.credentials || []);
        } catch (error) {
            console.error('Error fetching credentials:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchCredentials();
        }
    }, [status, router, fetchCredentials]);

    const addCredential = async () => {
        if (!newCred.site.trim() || !newCred.username.trim() || !newCred.password.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCred),
            });
            if (res.ok) {
                fetchCredentials(); // Refresh to get decrypted password
                setNewCred({ site: '', url: '', username: '', password: '', category: 'General' });
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error adding credential:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteCredential = async (id: string) => {
        try {
            await fetch('/api/credentials', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setCredentials(prev => prev.filter(c => c._id !== id));
        } catch (error) {
            console.error('Error deleting credential:', error);
        }
    };

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredCredentials = credentials.filter(c =>
        c.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={32} className="animate-spin" />
                <span>Decrypting vault...</span>
                <style jsx>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: #555; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin { animation: spin 1s linear infinite; }
        `}</style>
            </div>
        );
    }

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
                <button className="primary-btn" onClick={() => setShowModal(true)}>
                    <Plus size={18} />
                    <span>New Entry</span>
                </button>
            </header>

            <div className="vault-container glass-panel">
                <div className="vault-toolbar">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search vault..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="vault-stats">
                        <Key size={14} />
                        <span>{credentials.length} credentials stored</span>
                    </div>
                </div>

                {filteredCredentials.length === 0 ? (
                    <div className="empty-vault">
                        <Key size={48} strokeWidth={1} />
                        <p>Your vault is empty</p>
                        <button onClick={() => setShowModal(true)}>Add your first credential</button>
                    </div>
                ) : (
                    <div className="vault-list">
                        {filteredCredentials.map(cred => (
                            <div key={cred._id} className="vault-row">
                                <div className="identity-cell">
                                    <div className="site-avatar"><Globe size={18} /></div>
                                    <div className="site-details">
                                        <span className="site-name">{cred.site}</span>
                                        <span className="site-url">{cred.url || cred.category}</span>
                                    </div>
                                </div>

                                <div className="account-cell">
                                    <User size={14} />
                                    <span>{cred.username}</span>
                                    <button
                                        className={`copy-btn ${copiedId === `user-${cred._id}` ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(cred.username, `user-${cred._id}`)}
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>

                                <div className="credential-cell">
                                    <span className="password-display">
                                        {visiblePasswords.has(cred._id) ? cred.password : '••••••••••••'}
                                    </span>
                                    <div className="pass-actions">
                                        <button onClick={() => togglePasswordVisibility(cred._id)}>
                                            {visiblePasswords.has(cred._id) ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        <button
                                            className={copiedId === `pass-${cred._id}` ? 'copied' : ''}
                                            onClick={() => copyToClipboard(cred.password, `pass-${cred._id}`)}
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>

                                <button className="delete-btn" onClick={() => deleteCredential(cred._id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Key size={18} /> New Credential</h3>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <div className="form-group">
                            <label>Site Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Google, GitHub"
                                value={newCred.site}
                                onChange={e => setNewCred({ ...newCred, site: e.target.value })}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>URL</label>
                            <input
                                type="text"
                                placeholder="https://example.com"
                                value={newCred.url}
                                onChange={e => setNewCred({ ...newCred, url: e.target.value })}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    placeholder="user@email.com"
                                    value={newCred.username}
                                    onChange={e => setNewCred({ ...newCred, username: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={newCred.category}
                                    onChange={e => setNewCred({ ...newCred, category: e.target.value })}
                                >
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={newCred.password}
                                onChange={e => setNewCred({ ...newCred, password: e.target.value })}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="primary-btn" onClick={addCredential} disabled={isSaving}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save to Vault'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .vault-page { max-width: 960px; margin: 0 auto; padding: 1.5rem; animation: fadeUp 0.4s ease-out; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem; }
        .security-badge { display: flex; align-items: center; gap: 0.375rem; font-size: 0.625rem; font-weight: 600; color: #10b981; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; color: #fff; letter-spacing: -0.02em; }
        .page-header p { color: #666; font-size: 0.875rem; }
        .primary-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #fff; color: #000; font-weight: 600; border-radius: 8px; font-size: 0.8125rem; transition: all 0.15s; }
        .primary-btn:hover { transform: translateY(-1px); }
        .secondary-btn { padding: 0.5rem 1rem; background: transparent; border: 1px solid #1f1f1f; color: #777; border-radius: 8px; font-size: 0.8125rem; transition: all 0.15s; }
        .secondary-btn:hover { border-color: #333; color: #999; }
        .vault-container { background: #0a0a0a; border: 1px solid #181818; padding: 1.25rem; border-radius: 14px; }
        .vault-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 0.875rem; border-bottom: 1px solid #151515; }
        .search-box { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0.875rem; background: #080808; border: 1px solid #1f1f1f; border-radius: 8px; flex: 1; max-width: 280px; }
        .search-box svg { color: #555; }
        .search-box input { flex: 1; background: none; border: none; color: #fff; font-size: 0.8125rem; outline: none; }
        .search-box input::placeholder { color: #444; }
        .vault-stats { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #555; }
        .empty-vault { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; color: #444; gap: 0.875rem; }
        .empty-vault svg { color: #333; }
        .empty-vault button { color: #888; font-size: 0.8125rem; }
        .empty-vault button:hover { color: #fff; }
        .vault-list { display: flex; flex-direction: column; gap: 0.375rem; }
        .vault-row { display: grid; grid-template-columns: 1.5fr 1fr 1.5fr auto; align-items: center; gap: 0.875rem; padding: 0.875rem 1rem; background: #080808; border-radius: 10px; border: 1px solid #151515; transition: all 0.15s; }
        .vault-row:hover { border-color: #1f1f1f; background: #0a0a0a; }
        .identity-cell { display: flex; align-items: center; gap: 0.625rem; }
        .site-avatar { width: 36px; height: 36px; background: #111; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #555; }
        .site-details { display: flex; flex-direction: column; }
        .site-name { font-weight: 600; font-size: 0.875rem; color: #eee; }
        .site-url { font-size: 0.6875rem; color: #444; }
        .account-cell { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #888; }
        .account-cell svg { color: #444; }
        .copy-btn { padding: 0.25rem; color: #444; border-radius: 4px; transition: all 0.15s; }
        .copy-btn:hover, .copy-btn.copied { color: #fff; }
        .credential-cell { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .password-display { font-family: monospace; font-size: 0.8125rem; color: #666; }
        .pass-actions { display: flex; gap: 0.25rem; }
        .pass-actions button { padding: 0.375rem; color: #444; border-radius: 6px; transition: all 0.15s; }
        .pass-actions button:hover, .pass-actions button.copied { color: #fff; background: #151515; }
        .delete-btn { padding: 0.375rem; color: #333; border-radius: 6px; transition: all 0.15s; }
        .delete-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-box { background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 14px; padding: 1.5rem; width: 90%; max-width: 440px; animation: slideUp 0.2s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
        .modal-header h3 { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; color: #fff; }
        .modal-header button { color: #555; padding: 0.25rem; }
        .modal-header button:hover { color: #999; }
        .form-group { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 0.875rem; }
        .form-group label { font-size: 0.6875rem; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-group input, .form-group select { padding: 0.625rem 0.875rem; background: #080808; border: 1px solid #1f1f1f; border-radius: 8px; color: #fff; font-size: 0.875rem; outline: none; transition: border-color 0.15s; }
        .form-group input:focus, .form-group select:focus { border-color: #333; }
        .form-group input::placeholder { color: #444; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.625rem; margin-top: 1.25rem; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .vault-row { grid-template-columns: 1fr; gap: 0.625rem; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        }
      `}</style>
        </div>
    );
}
