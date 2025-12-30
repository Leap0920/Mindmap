"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('System error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-content">
        <div className="login-box">
          <header className="login-header">
            <h1>Mindmap</h1>
            <p>Access your workspace.</p>
          </header>

          {error && (
            <div className="error-banner">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Identification</label>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="field">
              <label>Secret</label>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? '...' : 'Unlock'}
            </button>
          </form>

          <footer className="login-footer">
            New entity? <Link href="/signup">Establish identity</Link>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .login-screen {
          position: fixed;
          inset: 0;
          background: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .login-content {
          width: 100%;
          max-width: 380px;
          padding: 1.5rem;
        }

        .login-box {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          padding: 2.5rem 2rem;
          border-radius: var(--radius-xl);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--error-muted);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .field label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .field input {
          background: var(--bg-deep);
          border: 1px solid var(--border-default);
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.9rem;
          outline: none;
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }

        .field input:focus {
          border-color: var(--border-strong);
          box-shadow: 0 0 0 3px var(--accent-muted);
        }

        .field input::placeholder {
          color: var(--text-dim);
        }

        .login-btn {
          background: var(--text-primary);
          color: var(--bg-deep);
          padding: 0.875rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
        }

        .login-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .login-footer a {
          color: var(--text-primary);
          font-weight: 600;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
