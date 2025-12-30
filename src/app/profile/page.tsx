"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
    User, 
    Mail, 
    Calendar, 
    Camera, 
    Image as ImageIcon, 
    Lock, 
    Trash2, 
    Save, 
    Loader2, 
    AlertTriangle,
    Check,
    X,
    Eye,
    EyeOff
} from 'lucide-react';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    backgroundImage?: string;
    createdAt: string;
}

export default function ProfilePage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    // Edit states
    const [editName, setEditName] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
    
    // Password change
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    
    // Delete account
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const fetchProfile = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        try {
            const res = await fetch('/api/profile');
            const data = await res.json();
            if (data.user) {
                setProfile(data.user);
                setEditName(data.user.name);
                setProfileImageUrl(data.user.profileImage || '');
                setBackgroundImageUrl(data.user.backgroundImage || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchProfile();
        }
    }, [status, router, fetchProfile]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    profileImage: profileImageUrl,
                    backgroundImage: backgroundImageUrl,
                }),
            });
            
            if (res.ok) {
                const data = await res.json();
                setProfile(prev => prev ? { ...prev, ...data.user } : null);
                showMessage('success', 'Profile updated successfully!');
                // Update session
                await update({ name: editName });
            } else {
                const error = await res.json();
                showMessage('error', error.error || 'Failed to update profile');
            }
        } catch (error) {
            showMessage('error', 'An error occurred while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            showMessage('error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            showMessage('error', 'Password must be at least 6 characters');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });
            
            if (res.ok) {
                showMessage('success', 'Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setShowPasswordSection(false);
            } else {
                const error = await res.json();
                showMessage('error', error.error || 'Failed to change password');
            }
        } catch (error) {
            showMessage('error', 'An error occurred while changing password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            showMessage('error', 'Please type DELETE to confirm');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', { method: 'DELETE' });
            
            if (res.ok) {
                signOut({ callbackUrl: '/login' });
            } else {
                const error = await res.json();
                showMessage('error', error.error || 'Failed to delete account');
            }
        } catch (error) {
            showMessage('error', 'An error occurred while deleting account');
        } finally {
            setIsSaving(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="loading-screen">
                <Loader2 size={28} className="animate-spin" />
                <style jsx>{`
                    .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 60vh; color: #555; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                `}</style>
            </div>
        );
    }

    const memberSince = profile?.createdAt 
        ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Unknown';

    return (
        <div className="profile-page">
            {/* Header with background preview */}
            <div className="profile-header" style={{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined }}>
                <div className="header-overlay" />
                <div className="profile-avatar-container">
                    {profileImageUrl ? (
                        <img src={profileImageUrl} alt="Profile" className="profile-avatar-img" />
                    ) : (
                        <div className="profile-avatar">
                            {editName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`toast ${message.type}`}>
                    {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
                    {message.text}
                </div>
            )}

            <div className="profile-content">
                {/* Basic Info Section */}
                <section className="section">
                    <div className="section-header">
                        <User size={18} />
                        <h2>Profile Information</h2>
                    </div>
                    
                    <div className="form-group">
                        <label>Display Name</label>
                        <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            placeholder="Your name"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="readonly-field">
                            <Mail size={16} />
                            <span>{profile?.email}</span>
                        </div>
                        <p className="helper-text">Email cannot be changed</p>
                    </div>

                    <div className="form-group">
                        <label>Member Since</label>
                        <div className="readonly-field">
                            <Calendar size={16} />
                            <span>{memberSince}</span>
                        </div>
                    </div>
                </section>

                {/* Images Section */}
                <section className="section">
                    <div className="section-header">
                        <ImageIcon size={18} />
                        <h2>Customization</h2>
                    </div>
                    
                    <div className="form-group">
                        <label><Camera size={14} /> Profile Image URL</label>
                        <input
                            type="url"
                            value={profileImageUrl}
                            onChange={e => setProfileImageUrl(e.target.value)}
                            placeholder="https://example.com/your-avatar.jpg"
                        />
                        <p className="helper-text">Paste a direct link to your profile image</p>
                    </div>
                    
                    <div className="form-group">
                        <label><ImageIcon size={14} /> Background Image URL</label>
                        <input
                            type="url"
                            value={backgroundImageUrl}
                            onChange={e => setBackgroundImageUrl(e.target.value)}
                            placeholder="https://example.com/background.jpg"
                        />
                        <p className="helper-text">This will appear as the header background on your home page</p>
                    </div>

                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </section>

                {/* Security Section */}
                <section className="section">
                    <div className="section-header">
                        <Lock size={18} />
                        <h2>Security</h2>
                    </div>
                    
                    {!showPasswordSection ? (
                        <button className="btn btn-secondary" onClick={() => setShowPasswordSection(true)}>
                            <Lock size={16} />
                            Change Password
                        </button>
                    ) : (
                        <div className="password-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                    />
                                    <button type="button" onClick={() => setShowPasswords(!showPasswords)}>
                                        {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="btn-group">
                                <button className="btn btn-secondary" onClick={() => setShowPasswordSection(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" onClick={handleChangePassword} disabled={isSaving}>
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* Danger Zone */}
                <section className="section danger-section">
                    <div className="section-header danger">
                        <AlertTriangle size={18} />
                        <h2>Danger Zone</h2>
                    </div>
                    
                    <p className="warning-text">
                        Deleting your account is permanent and cannot be undone. All your data including habits, todos, notes, and other content will be permanently removed.
                    </p>

                    {!showDeleteConfirm ? (
                        <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                            <Trash2 size={16} />
                            Delete Account
                        </button>
                    ) : (
                        <div className="delete-confirm">
                            <p>Type <strong>DELETE</strong> to confirm:</p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={e => setDeleteConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                            />
                            <div className="btn-group">
                                <button className="btn btn-secondary" onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                }}>
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-danger" 
                                    onClick={handleDeleteAccount} 
                                    disabled={isSaving || deleteConfirmText !== 'DELETE'}
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Permanently Delete'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <style jsx>{`
                .profile-page {
                    max-width: 700px;
                    margin: 0 auto;
                    padding-bottom: 3rem;
                    animation: fadeUp 0.4s ease-out;
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .profile-header {
                    height: 160px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f15 100%);
                    background-size: cover;
                    background-position: center;
                    border-radius: 0 0 20px 20px;
                    position: relative;
                    margin-bottom: 50px;
                }
                .header-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    border-radius: 0 0 20px 20px;
                }
                .profile-avatar-container {
                    position: absolute;
                    bottom: -40px;
                    left: 50%;
                    transform: translateX(-50%);
                }
                .profile-avatar {
                    width: 90px;
                    height: 90px;
                    background: #1a1a1a;
                    border: 4px solid #0a0a0a;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 700;
                    color: #666;
                }
                .profile-avatar-img {
                    width: 90px;
                    height: 90px;
                    border: 4px solid #0a0a0a;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .toast {
                    position: fixed;
                    top: 1.5rem;
                    right: 1.5rem;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    z-index: 1000;
                    animation: slideIn 0.3s ease-out;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .toast.success {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #10b981;
                }
                .toast.error {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                }

                .profile-content {
                    padding: 0 1.5rem;
                }

                .section {
                    background: #0a0a0a;
                    border: 1px solid #181818;
                    border-radius: 14px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                    margin-bottom: 1.25rem;
                    color: #fff;
                }
                .section-header h2 {
                    font-size: 1rem;
                    font-weight: 600;
                }
                .section-header.danger {
                    color: #ef4444;
                }

                .form-group {
                    margin-bottom: 1rem;
                }
                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #666;
                    margin-bottom: 0.375rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .form-group input {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    background: #080808;
                    border: 1px solid #1f1f1f;
                    border-radius: 8px;
                    color: #fff;
                    font-size: 0.875rem;
                    outline: none;
                    transition: border-color 0.15s;
                }
                .form-group input:focus {
                    border-color: #333;
                }
                .form-group input::placeholder {
                    color: #444;
                }
                .helper-text {
                    font-size: 0.6875rem;
                    color: #444;
                    margin-top: 0.375rem;
                }

                .readonly-field {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 0.875rem;
                    background: #050505;
                    border: 1px solid #151515;
                    border-radius: 8px;
                    color: #888;
                    font-size: 0.875rem;
                }
                .readonly-field svg {
                    color: #444;
                }

                .password-input {
                    display: flex;
                    gap: 0.5rem;
                }
                .password-input input {
                    flex: 1;
                }
                .password-input button {
                    padding: 0 0.75rem;
                    background: #111;
                    border: 1px solid #1f1f1f;
                    border-radius: 8px;
                    color: #666;
                    transition: all 0.15s;
                }
                .password-input button:hover {
                    color: #999;
                    border-color: #333;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1rem;
                    border-radius: 8px;
                    font-size: 0.8125rem;
                    font-weight: 600;
                    transition: all 0.15s;
                    cursor: pointer;
                }
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .btn-primary {
                    background: #fff;
                    color: #000;
                }
                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                }
                .btn-secondary {
                    background: transparent;
                    border: 1px solid #1f1f1f;
                    color: #888;
                }
                .btn-secondary:hover:not(:disabled) {
                    border-color: #333;
                    color: #bbb;
                }
                .btn-danger {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                }
                .btn-danger:hover:not(:disabled) {
                    background: rgba(239, 68, 68, 0.25);
                }
                .btn-group {
                    display: flex;
                    gap: 0.625rem;
                    margin-top: 1rem;
                }

                .danger-section {
                    border-color: rgba(239, 68, 68, 0.2);
                }
                .warning-text {
                    font-size: 0.8125rem;
                    color: #666;
                    line-height: 1.5;
                    margin-bottom: 1rem;
                }
                .delete-confirm {
                    background: rgba(239, 68, 68, 0.05);
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    border-radius: 10px;
                    padding: 1rem;
                }
                .delete-confirm p {
                    font-size: 0.8125rem;
                    color: #999;
                    margin-bottom: 0.75rem;
                }
                .delete-confirm strong {
                    color: #ef4444;
                }
                .delete-confirm input {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    background: #0a0a0a;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 8px;
                    color: #fff;
                    font-size: 0.875rem;
                    outline: none;
                }

                .password-form {
                    background: #080808;
                    border: 1px solid #151515;
                    border-radius: 10px;
                    padding: 1rem;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                :global(.animate-spin) {
                    animation: spin 1s linear infinite;
                }

                @media (max-width: 600px) {
                    .profile-page { padding-bottom: 2rem; }
                    .profile-content { padding: 0 1rem; }
                    .section { padding: 1.25rem; }
                    .profile-header { height: 120px; margin-bottom: 40px; }
                    .profile-avatar, .profile-avatar-img { width: 70px; height: 70px; }
                    .profile-avatar { font-size: 1.5rem; }
                }
            `}</style>
        </div>
    );
}
