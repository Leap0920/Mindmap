"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <div className="login-container">
            <div className="login-card glass">
                <div className="login-header">
                    <h1>Mindmap</h1>
                    <p>Login to your personal workspace</p>
                </div>

                <form className="login-form">
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <div className="label-row">
                            <label>Password</label>
                            <Link href="/forgot" className="forgot-link">Forgot password?</Link>
                        </div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-submit">
                        Sign In
                    </button>
                </form>

                <div className="login-footer">
                    <span>Don't have an account?</span>
                    <Link href="/signup">Create account</Link>
                </div>
            </div>

            <style jsx>{`
        .login-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          margin-bottom: 0.5rem;
        }

        .login-header p {
          color: var(--muted);
          font-size: 0.95rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--muted);
        }

        .forgot-link {
          font-size: 0.8rem;
          color: var(--muted);
          text-decoration: underline;
        }

        input {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          padding: 0.9rem 1.25rem;
          border-radius: 10px;
          color: var(--foreground);
          font-size: 1rem;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: var(--foreground);
          background: rgba(255, 255, 255, 0.05);
        }

        .login-submit {
          background: var(--foreground);
          color: var(--background);
          padding: 1rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          margin-top: 1rem;
          transition: transform 0.2s;
        }

        .login-submit:hover {
          transform: translateY(-2px);
        }

        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9rem;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-footer a {
          color: var(--foreground);
          font-weight: 600;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-card {
            border: none;
            box-shadow: none;
            padding: 2rem;
          }
        }
      `}</style>
        </div>
    );
}
