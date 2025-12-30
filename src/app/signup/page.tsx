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
        <div className="signup-box">
          <header className="signup-header">
            <h1>Establish Identity</h1>
            <p>Join the monochrome ecosystem.</p>
          </header>

          {error && (
            <div className="error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="input-field">
              <label>Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="input-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="row-fields">
              <div className="input-field">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="input-field">
                <label>Confirm</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button type="submit" className="signup-btn" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Initialize'}
            </button>
          </form>

          <footer className="signup-footer">
            Existing user? <Link href="/login">Sign in</Link>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .signup-screen {
          position: fixed;
          inset: 0;
          background: #050505;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .signup-content {
          width: 100%;
          max-width: 440px;
          padding: 24px;
        }

        .signup-box {
          background: #080808;
          border: 1px solid #151515;
          padding: 48px 40px;
          border-radius: 24px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .signup-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .signup-header h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.05em;
          color: #fff;
        }

        .signup-header p {
          color: #444;
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(255, 68, 68, 0.05);
          border-radius: 12px;
          color: #ff4444;
          font-size: 0.8125rem;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 68, 68, 0.1);
          font-weight: 600;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-field label {
          font-size: 0.6875rem;
          font-weight: 800;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .input-field input {
          background: #050505;
          border: 1px solid #151515;
          padding: 14px 18px;
          border-radius: 12px;
          color: #fff;
          font-size: 0.9375rem;
          outline: none;
          transition: all 0.2s;
          font-weight: 500;
        }

        .input-field input:focus {
          border-color: #333;
          background: #080808;
        }

        .row-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .signup-btn {
          background: #fff;
          color: #000;
          padding: 16px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.9375rem;
          margin-top: 12px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 20px rgba(255,255,255,0.1);
        }

        .signup-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(255,255,255,0.2);
        }

        .signup-btn:active {
          transform: translateY(0);
        }

        .signup-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .signup-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 0.875rem;
          color: #333;
          font-weight: 600;
        }

        .signup-footer a {
          color: #fff;
          font-weight: 800;
          margin-left: 4px;
        }

        .signup-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .signup-content { padding: 16px; }
          .signup-box { padding: 32px 24px; border-radius: 20px; }
          .signup-header h1 { font-size: 1.75rem; }
          .signup-header p { font-size: 0.875rem; }
          .signup-header { margin-bottom: 32px; }
          .row-fields { grid-template-columns: 1fr; }
          .input-field input { padding: 12px 16px; font-size: 0.875rem; }
          .signup-btn { padding: 14px; font-size: 0.875rem; }
          .signup-footer { margin-top: 24px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
}
