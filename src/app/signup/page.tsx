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
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .signup-content {
          width: 100%;
          max-width: 440px;
          padding: 2rem;
        }

        .signup-box {
          background: #000;
          border: 1px solid #111;
          padding: 3rem 2.5rem;
          border-radius: 12px;
        }

        .signup-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .signup-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .signup-header p {
          color: #666;
          font-size: 0.9rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #111;
          border-radius: 8px;
          color: #f44;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
          border: 1px solid #200;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .input-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-field label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #444;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .input-field input {
          background: #000;
          border: 1px solid #1a1a1a;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          outline: none;
        }

        .input-field input:focus {
          border-color: #333;
        }

        .row-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .signup-btn {
          background: #fff;
          color: #000;
          padding: 0.9rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          margin-top: 1rem;
          transition: transform 0.2s;
        }

        .signup-btn:active {
          transform: scale(0.98);
        }

        .signup-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.85rem;
          color: #444;
        }

        .signup-footer a {
          color: #fff;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
