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
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .login-content {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
        }

        .login-box {
          background: #000;
          border: 1px solid #111;
          padding: 3.5rem 2.5rem;
          border-radius: 12px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .login-header h1 {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: #555;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #070000;
          border: 1px solid #200;
          border-radius: 8px;
          color: #f44;
          font-size: 0.8rem;
          margin-bottom: 2rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .field label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .field input {
          background: #000;
          border: 1px solid #1a1a1a;
          padding: 0.85rem 1rem;
          border-radius: 8px;
          color: #fff;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .field input:focus {
          border-color: #444;
        }

        .login-btn {
          background: #fff;
          color: #000;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.9rem;
          margin-top: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 0.85rem;
          color: #444;
        }

        .login-footer a {
          color: #fff;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
