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
          background: #050505;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .login-content {
          width: 100%;
          max-width: 360px;
          padding: 1.5rem;
        }

        .login-box {
          background: #0a0a0a;
          border: 1px solid #181818;
          padding: 2.5rem 2rem;
          border-radius: 16px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          margin-bottom: 0.5rem;
          color: #fff;
        }

        .login-header p {
          color: #666;
          font-size: 0.875rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 8px;
          color: #ef4444;
          font-size: 0.8rem;
          margin-bottom: 1.25rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .field label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #888;
        }

        .field input {
          background: #050505;
          border: 1px solid #1f1f1f;
          padding: 0.75rem 0.875rem;
          border-radius: 8px;
          color: #fff;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .field input:focus {
          border-color: #333;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
        }

        .field input::placeholder {
          color: #444;
        }

        .login-btn {
          background: #fff;
          color: #000;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          transition: opacity 0.15s, transform 0.15s;
        }

        .login-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.8rem;
          color: #666;
        }

        .login-footer a {
          color: #fff;
          font-weight: 500;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
