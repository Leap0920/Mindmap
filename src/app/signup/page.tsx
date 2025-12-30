"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create account');
                return;
            }

            // Auto-login after registration
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                router.push('/login');
            } else {
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signup-screen">
            <div className="signup-content">
                <div className="signup-visual">
                    <div className="ornament-blur" />
                    <div className="logo-vignette">M</div>
                    <div className="visual-text">
                        <h2>Start Your Journey</h2>
                        <p>Create your personal productivity ecosystem.</p>
                    </div>
                    <div className="features-list">
                        <div className="feature-item">
                            <CheckCircle2 size={16} />
                            <span>Habit tracking & analytics</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={16} />
                            <span>Secure password vault</span>
                        </div>
                        <div className="feature-item">
                            <CheckCircle2 size={16} />
                            <span>Daily journaling</span>
                        </div>
                    </div>
                </div>

                <div className="signup-box glass-panel">
                    <header className="signup-header">
                        <h1 className="text-gradient">Create Account</h1>
                        <p>Establish your identity in the system.</p>
                    </header>

                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="signup-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="email@vault.io"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                placeholder="••••••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button type="submit" className="signup-btn" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Initialize Identity</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <footer className="signup-footer">
                        Already have an account? <Link href="/login">Sign in</Link>
                    </footer>
                </div>
            </div>

            <style jsx>{`
        .signup-screen {
          position: fixed;
          inset: 0;
          background: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          overflow-y: auto;
          padding: 2rem 0;
        }

        .signup-content {
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1fr 460px;
          align-items: center;
          gap: 4rem;
          padding: 2rem;
        }

        .signup-visual {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .ornament-blur {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(60px);
        }

        .logo-vignette {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #fff 0%, #666 100%);
          color: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 900;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          position: relative;
          z-index: 1;
        }

        .visual-text {
          text-align: center;
          margin-top: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .visual-text h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #fff, #888);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .visual-text p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .features-list {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          z-index: 1;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .feature-item :global(svg) {
          color: #4ade80;
        }

        .signup-box {
          padding: 2.5rem;
          border-radius: 24px;
        }

        .signup-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .signup-header h1 {
          font-size: 2.2rem;
          margin-bottom: 0.5rem;
        }

        .signup-header p {
          color: var(--text-muted);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 68, 68, 0.1);
          border: 1px solid rgba(255, 68, 68, 0.2);
          border-radius: 10px;
          color: #ff6b6b;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .input-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .input-group input {
          padding: 0.8rem 1rem;
          background: var(--bg-deep);
          border: 1px solid var(--border-main);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 0.9rem;
          transition: var(--transition-fast);
        }

        .input-group input:focus {
          border-color: var(--border-bright);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
        }

        .input-group input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signup-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          color: var(--bg-deep);
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 12px;
          margin-top: 0.5rem;
          transition: var(--transition-base);
        }

        .signup-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255,255,255,0.1);
        }

        .signup-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .signup-footer {
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-top: 1.5rem;
        }

        .signup-footer a {
          color: var(--text-primary);
          font-weight: 600;
          text-decoration: none;
        }

        .signup-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .signup-content {
            grid-template-columns: 1fr;
            max-width: 460px;
          }
          .signup-visual {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .signup-box {
            padding: 2rem 1.5rem;
          }
          .signup-header h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
        </div>
    );
}
