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
    const [isUploading, setIsUploading] = useState<string | null>(null);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'background') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(type);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (type === 'profile') {
                    setProfileImageUrl(data.url);
                } else {
                    setBackgroundImageUrl(data.url);
                }
                showMessage('success', `${type === 'profile' ? 'Profile' : 'Background'} image uploaded!`);
            } else {
                showMessage('error', 'Failed to upload image');
            }
        } catch (error) {
            showMessage('error', 'Error uploading image');
        } finally {
            setIsUploading(null);
        }
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
                        <label><Camera size={14} /> Profile Image</label>
                        <div className="upload-wrapper">
                            <input
                                type="file"
                                id="profile-upload"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={e => handleImageUpload(e, 'profile')}
                            />
                            <div className="upload-preview-row">
                                {profileImageUrl ? (
                                    <div className="mini-preview">
                                        <img src={profileImageUrl} alt="Preview" />
                                    </div>
                                ) : (
                                    <div className="mini-preview-empty">
                                        <User size={20} />
                                    </div>
                                )}
                                <button className="btn btn-secondary upload-btn" onClick={() => document.getElementById('profile-upload')?.click()} disabled={isUploading === 'profile'}>
                                    {isUploading === 'profile' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                    {profileImageUrl ? 'Change Image' : 'Upload Image'}
                                </button>
                                {profileImageUrl && (
                                    <button className="btn btn-icon-only" onClick={() => setProfileImageUrl('')} title="Remove">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label><ImageIcon size={14} /> Background Image</label>
                        <div className="upload-wrapper">
                            <input
                                type="file"
                                id="background-upload"
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={e => handleImageUpload(e, 'background')}
                            />
                            <div className="upload-preview-row">
                                <div className="background-mini-preview" style={{ backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined }}>
                                    {!backgroundImageUrl && <ImageIcon size={20} />}
                                </div>
                                <button className="btn btn-secondary upload-btn" onClick={() => document.getElementById('background-upload')?.click()} disabled={isUploading === 'background'}>
                                    {isUploading === 'background' ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                                    {backgroundImageUrl ? 'Change Background' : 'Upload Background'}
                                </button>
                                {backgroundImageUrl && (
                                    <button className="btn btn-icon-only" onClick={() => setBackgroundImageUrl('')} title="Remove">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
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
                    max-width: 800px;
                    margin: 0 auto;
                    padding-bottom: 80px;
                    animation: fadeUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .profile-header {
                    height: 240px;
                    background: #111;
                    background-size: cover;
                    background-position: center;
                    border-radius: 0 0 32px 32px;
                    position: relative;
                    margin-bottom: 80px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                    overflow: visible;
                }

                .header-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.8));
                    border-radius: 0 0 32px 32px;
                }

                .profile-avatar-container {
                    position: absolute;
                    bottom: -60px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10;
                }

                .profile-avatar {
                    width: 140px;
                    height: 140px;
                    background: #080808;
                    border: 6px solid #080808;
                    border-radius: 40%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 800;
                    color: #222;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                    transition: all 0.3s ease;
                }

                .profile-avatar-img {
                    width: 140px;
                    height: 140px;
                    border: 6px solid #080808;
                    border-radius: 40%;
                    object-fit: cover;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                    transition: all 0.3s ease;
                }

                .profile-avatar:hover, .profile-avatar-img:hover {
                    transform: translateY(-5px) rotate(2deg);
                }

                .toast {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    padding: 12px 20px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.875rem;
                    font-weight: 700;
                    z-index: 1000;
                    animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(32px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .toast.success { background: #fff; color: #000; }
                .toast.error { background: #1a1a1a; color: #ff4444; border: 1px solid #333; }

                .profile-content {
                    padding: 0 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .section {
                    background: #0a0a0a;
                    border: 1px solid #151515;
                    border-radius: 20px;
                    padding: 32px;
                    transition: all 0.3s ease;
                }

                .section:hover {
                    border-color: #222;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .section-header h2 {
                    font-size: 1.125rem;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.02em;
                }

                .section-header svg { color: #444; }
                .section-header.danger svg { color: #ff4444; }
                .section-header.danger h2 { color: #ff4444; }

                .form-group { margin-bottom: 24px; }
                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #333;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .form-group input {
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

                .form-group input:focus { border-color: #333; background: #080808; }
                .form-group input::placeholder { color: #1a1a1a; }
                .helper-text { font-size: 0.75rem; color: #222; margin-top: 8px; font-weight: 500; }

                .readonly-field {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #0d0d0d;
                    border: 1px solid #151515;
                    border-radius: 10px;
                    color: #555;
                    font-size: 0.9375rem;
                    font-weight: 600;
                }

                .readonly-field svg { color: #222; }

                .password-input { display: flex; gap: 12px; }
                .password-input input { flex: 1; }
                .password-input button {
                    padding: 0 16px;
                    background: #111;
                    border: 1px solid #151515;
                    border-radius: 10px;
                    color: #444;
                    transition: all 0.2s;
                }

                .password-input button:hover { color: #fff; border-color: #333; }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 10px;
                    font-size: 0.875rem;
                    font-weight: 800;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                }

                .btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-primary { background: #fff; color: #000; box-shadow: 0 4px 12px rgba(255,255,255,0.1); }
                .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,255,255,0.2); }
                
                .btn-secondary { background: transparent; border: 1px solid #1a1a1a; color: #444; }
                .btn-secondary:hover:not(:disabled) { border-color: #333; color: #fff; }

                .btn-danger { background: #111; border: 1px solid #1a1a1a; color: #ff4444; }
                .btn-danger:hover:not(:disabled) { background: rgba(255, 68, 68, 0.1); border-color: #ff4444; }

                .btn-icon-only {
                    padding: 12px;
                    background: transparent;
                    border: 1px solid #1a1a1a;
                    color: #444;
                    border-radius: 10px;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .btn-icon-only:hover { color: #ff4444; border-color: rgba(255,68,68,0.2); background: rgba(255,68,68,0.05); }

                .upload-wrapper {
                    background: #050505;
                    border: 1px dashed #151515;
                    border-radius: 16px;
                    padding: 20px;
                    transition: all 0.3s;
                }
                .upload-wrapper:hover { border-color: #333; }

                .upload-preview-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .mini-preview, .mini-preview-empty {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: #111;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 1px solid #1a1a1a;
                }
                .mini-preview img { width: 100%; height: 100%; object-fit: cover; }
                .mini-preview-empty svg { color: #222; }

                .background-mini-preview {
                    width: 80px;
                    height: 48px;
                    border-radius: 12px;
                    background: #111;
                    background-size: cover;
                    background-position: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #1a1a1a;
                }
                .background-mini-preview svg { color: #222; }

                .upload-btn { flex: 1; justify-content: flex-start; }

                .btn-group { display: flex; gap: 12px; margin-top: 24px; }

                .danger-section { border-color: rgba(255, 68, 68, 0.1); }
                .danger-section:hover { border-color: rgba(255, 68, 68, 0.3); }

                .warning-text {
                    font-size: 0.9375rem;
                    color: #444;
                    line-height: 1.6;
                    margin-bottom: 24px;
                    font-weight: 500;
                }

                .delete-confirm {
                    background: #050505;
                    border: 1px solid #151515;
                    border-radius: 16px;
                    padding: 24px;
                    margin-top: 24px;
                }

                .delete-confirm p { font-size: 0.8125rem; color: #444; margin-bottom: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                .delete-confirm strong { color: #ff4444; }
                .delete-confirm input { 
                    width: 100%; 
                    padding: 12px 16px; 
                    background: #0a0a0a; 
                    border: 1px solid rgba(255, 68, 68, 0.2); 
                    border-radius: 10px; 
                    color: #fff; 
                    font-size: 0.9375rem; 
                    outline: none; 
                    font-weight: 600;
                }

                .password-form { background: #050505; border: 1px solid #151515; border-radius: 16px; padding: 24px; margin-top: 16px; }

                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                :global(.animate-spin) { animation: spin 1s linear infinite; }

                @media (max-width: 768px) {
                    .profile-page { padding-bottom: 40px; }
                    .profile-content { padding: 0 16px; }
                    .section { padding: 24px; }
                    .profile-header { height: 160px; border-radius: 0 0 24px 24px; }
                    .header-overlay { border-radius: 0 0 24px 24px; }
                    .profile-avatar, .profile-avatar-img { width: 100px; height: 100px; border-radius: 35%; }
                    .profile-avatar { font-size: 2rem; }
                }
            `}</style>
        </div>
    );
}
