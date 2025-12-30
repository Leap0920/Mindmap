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
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .login-content {
          width: 100%;
          max-width: 400px;
          padding: 24px;
        }

        .login-box {
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

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-header h1 {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.05em;
          color: #fff;
        }

        .login-header p {
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

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-size: 0.6875rem;
          font-weight: 800;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .field input {
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

        .field input:focus {
          border-color: #333;
          background: #080808;
        }

        .field input::placeholder {
          color: #1a1a1a;
        }

        .login-btn {
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

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(255,255,255,0.2);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 0.875rem;
          color: #333;
          font-weight: 600;
        }

        .login-footer a {
          color: #fff;
          font-weight: 800;
          margin-left: 4px;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-content { padding: 16px; }
          .login-box { padding: 32px 24px; border-radius: 20px; }
          .login-header h1 { font-size: 1.75rem; }
          .login-header p { font-size: 0.875rem; }
          .login-header { margin-bottom: 32px; }
          .field input { padding: 12px 16px; font-size: 0.875rem; }
          .login-btn { padding: 14px; font-size: 0.875rem; }
          .login-footer { margin-top: 24px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
}
