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
        .vault-page { 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 48px 24px; 
            animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        
        @keyframes fadeUp { 
            from { opacity: 0; transform: translateY(16px); } 
            to { opacity: 1; transform: translateY(0); } 
        }

        .page-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
            margin-bottom: 48px; 
            gap: 24px;
        }

        .title-group h1 { 
            font-size: 2.5rem; 
            font-weight: 800; 
            margin: 0; 
            color: #fff; 
            letter-spacing: -0.04em; 
        }

        .title-group p { 
            color: #555; 
            font-size: 1rem; 
            font-weight: 500;
            margin-top: 4px;
        }

        .security-badge { 
            display: inline-flex; 
            align-items: center; 
            gap: 6px; 
            font-size: 0.6875rem; 
            font-weight: 800; 
            color: #fff; 
            text-transform: uppercase; 
            letter-spacing: 0.1em; 
            margin-bottom: 8px; 
            background: #111;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #1a1a1a;
        }

        .primary-btn { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            padding: 12px 24px; 
            background: #fff; 
            color: #000; 
            font-weight: 800; 
            border-radius: 10px; 
            font-size: 0.875rem; 
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            box-shadow: 0 4px 12px rgba(255,255,255,0.1);
        }

        .primary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,0.2); }

        .secondary-btn { 
            padding: 12px 24px; 
            background: transparent; 
            border: 1px solid #1a1a1a; 
            color: #444; 
            border-radius: 10px; 
            font-size: 0.875rem; 
            font-weight: 700;
            transition: all 0.2s; 
        }

        .secondary-btn:hover { border-color: #333; color: #888; }

        .vault-container { 
            background: #0a0a0a; 
            border: 1px solid #151515; 
            padding: 32px; 
            border-radius: 20px; 
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .vault-toolbar { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 32px; 
            padding-bottom: 24px; 
            border-bottom: 1px solid #151515; 
            gap: 24px;
        }

        .search-box { 
            display: flex; 
            align-items: center; 
            gap: 12px; 
            padding: 12px 18px; 
            background: #050505; 
            border: 1px solid #151515; 
            border-radius: 12px; 
            flex: 1; 
            max-width: 400px; 
            transition: all 0.2s;
        }

        .search-box:focus-within { border-color: #333; background: #080808; }
        .search-box svg { color: #333; }
        .search-box input { flex: 1; background: none; border: none; color: #fff; font-size: 0.9375rem; outline: none; font-weight: 500; }
        .search-box input::placeholder { color: #1a1a1a; }

        .vault-stats { 
            display: flex; 
            align-items: center; 
            gap: 8px; 
            font-size: 0.75rem; 
            color: #444; 
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .empty-vault { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            padding: 80px 0; 
            color: #222; 
            gap: 24px; 
        }

        .empty-vault p {
            font-size: 1rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }

        .empty-vault button { 
            color: #444; 
            font-size: 0.8125rem; 
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
        }

        .empty-vault button:hover { color: #fff; }

        .vault-list { display: flex; flex-direction: column; gap: 8px; }

        .vault-row { 
            display: grid; 
            grid-template-columns: 2fr 1.2fr 1.5fr auto; 
            align-items: center; 
            gap: 24px; 
            padding: 16px 24px; 
            background: #080808; 
            border-radius: 16px; 
            border: 1px solid #151515; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
        }

        .vault-row:hover { 
            border-color: #252525; 
            background: #0d0d0d;
            transform: scale(1.01);
            box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }

        .identity-cell { display: flex; align-items: center; gap: 16px; }
        .site-avatar { 
            width: 44px; 
            height: 44px; 
            background: #111; 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #333; 
            border: 1px solid #1a1a1a;
        }

        .site-details { display: flex; flex-direction: column; }
        .site-name { font-weight: 700; font-size: 1rem; color: #fff; letter-spacing: -0.01em; }
        .site-url { font-size: 0.75rem; color: #444; font-weight: 500; }

        .account-cell { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: #555; font-weight: 600; }
        .account-cell svg { color: #222; }

        .copy-btn { padding: 6px; color: #222; border-radius: 8px; transition: all 0.2s; }
        .copy-btn:hover, .copy-btn.copied { color: #fff; background: #151515; }

        .credential-cell { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            gap: 12px; 
            background: #050505;
            padding: 8px 12px;
            border-radius: 10px;
            border: 1px solid #111;
        }

        .password-display { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; color: #444; letter-spacing: 0.05em; }
        .pass-actions { display: flex; gap: 4px; }
        .pass-actions button { padding: 6px; color: #222; border-radius: 8px; transition: all 0.2s; }
        .pass-actions button:hover, .pass-actions button.copied { color: #fff; background: #1a1a1a; }

        .delete-btn { padding: 8px; color: #1a1a1a; border-radius: 10px; transition: all 0.2s; }
        .delete-btn:hover { color: #ff4444; background: rgba(255, 68, 68, 0.1); }

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

        .modal-box { 
            background: #080808; 
            border: 1px solid #151515; 
            border-radius: 20px; 
            padding: 40px; 
            width: 480px; 
            animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
            box-shadow: 0 30px 60px rgba(0,0,0,0.8);
        }

        @keyframes modalIn { 
            from { opacity: 0; transform: translateY(24px) scale(0.95); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
        }

        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .modal-header h3 { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .modal-header button { color: #333; padding: 4px; border-radius: 8px; transition: all 0.2s; }
        .modal-header button:hover { color: #fff; background: #111; }

        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
        .form-group label { font-size: 0.75rem; font-weight: 800; color: #333; text-transform: uppercase; letter-spacing: 0.1em; }

        .form-group input, .form-group select { 
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

        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }

        @media (max-width: 1024px) {
            .vault-page { padding: 40px 24px; }
            .vault-container { padding: 24px; }
            .vault-row { grid-template-columns: 2fr 1fr 1.5fr auto; gap: 16px; padding: 14px 20px; }
        }

        @media (max-width: 768px) {
            .vault-page { padding: 24px 16px; }
            .page-header { flex-direction: column; align-items: flex-start; gap: 20px; }
            .title-group h1 { font-size: 1.75rem; }
            .title-group p { font-size: 0.9rem; }
            .primary-btn { width: 100%; justify-content: center; }
            .vault-container { padding: 20px; border-radius: 16px; }
            .vault-toolbar { flex-direction: column; gap: 16px; padding-bottom: 20px; margin-bottom: 24px; }
            .search-box { max-width: none; width: 100%; }
            .vault-stats { width: 100%; justify-content: center; }
            .vault-row { grid-template-columns: 1fr; gap: 16px; padding: 16px; }
            .identity-cell { margin-bottom: 4px; }
            .account-cell { flex-wrap: wrap; }
            .credential-cell { margin: 8px 0; }
            .delete-btn { position: absolute; top: 12px; right: 12px; }
            .vault-row { position: relative; padding-right: 48px; }
            .modal-box { width: 95vw; padding: 24px; border-radius: 16px; }
            .form-row { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
            .vault-page { padding: 16px 12px; }
            .page-header { margin-bottom: 32px; }
            .title-group h1 { font-size: 1.5rem; }
            .security-badge { font-size: 0.6rem; padding: 3px 8px; }
            .vault-container { padding: 16px; }
            .search-box { padding: 10px 14px; }
            .search-box input { font-size: 0.875rem; }
            .vault-row { padding: 14px; border-radius: 12px; }
            .site-avatar { width: 36px; height: 36px; }
            .site-name { font-size: 0.9rem; }
            .password-display { font-size: 0.8rem; }
            .modal-box { padding: 20px; }
            .modal-header h3 { font-size: 1.1rem; }
            .primary-btn, .secondary-btn { padding: 10px 18px; font-size: 0.8rem; }
        }
      `}</style>
        </div>
    );
}
