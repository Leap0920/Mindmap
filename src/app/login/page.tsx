"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Shield, ArrowRight, Github } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="login-screen">
      <div className="login-content">
        <div className="login-visual">
          <div className="ornament-blur" />
          <div className="logo-vignette">M</div>
        </div>

        <div className="login-box glass-panel">
          <header className="login-header">
            <h1 className="text-gradient">Welcome back</h1>
            <p>Access your private mindmap workspace.</p>
          </header>

          <form className="login-form">
            <div className="input-group">
              <label>Identity</label>
              <input
                type="email"
                placeholder="email@vault.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <div className="label-row">
                <label>Access Key</label>
                <Link href="/forgot" className="forgot-text">Reset key?</Link>
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              <span>Initialize Workspace</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="divider">
            <span />
            <p>Protected by Mindmap Security</p>
            <span />
          </div>

          <div className="social-login">
            <button className="social-btn"><Github size={20} /></button>
            <button className="social-btn"><Shield size={20} /></button>
          </div>

          <footer className="login-footer">
            No account yet? <Link href="/signup">Establish identity</Link>
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
          overflow: hidden;
        }

        .login-content {
          width: 100%;
          max-width: 1200px;
          display: grid;
          grid-template-columns: 1fr 480px;
          align-items: center;
          gap: 4rem;
          padding: 2rem;
        }

        .login-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ornament-blur {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
          filter: blur(40px);
          animation: pulse 8s infinite alternate;
        }

        @keyframes pulse {
          from { transform: scale(1); opacity: 0.5; }
          to { transform: scale(1.2); opacity: 0.8; }
        }

        .logo-vignette {
          font-size: 15rem;
          font-weight: 900;
          color: rgba(255,255,255,0.02);
          user-select: none;
        }

        .login-box {
          padding: 4rem;
          border-radius: var(--border-radius-xl);
          background: rgba(10, 10, 10, 0.8);
        }

        .login-header h1 {
          font-size: 3rem;
          margin-bottom: 0.75rem;
          letter-spacing: -0.05em;
        }

        .login-header p {
          color: var(--text-secondary);
          margin-bottom: 3rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        label {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-dim);
          letter-spacing: 0.05em;
        }

        .forgot-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-decoration: underline;
        }

        input {
          background: var(--bg-deep);
          border: 1px solid var(--border-main);
          padding: 1.1rem 1.25rem;
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 1rem;
          transition: var(--transition-base);
        }

        input:focus {
          border-color: var(--text-primary);
          background: rgba(255,255,255,0.03);
          box-shadow: 0 0 20px rgba(255,255,255,0.05);
        }

        .login-btn {
          margin-top: 1rem;
          background: var(--text-primary);
          color: var(--bg-deep);
          padding: 1.1rem;
          border-radius: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-size: 1rem;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .divider {
          margin: 2.5rem 0;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .divider span { flex: 1; height: 1px; background: var(--border-dim); }
        .divider p { font-size: 0.7rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; }

        .social-login {
          display: flex;
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .social-btn {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-main);
          padding: 0.75rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .social-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-bright);
          background: rgba(255,255,255,0.05);
        }

        .login-footer {
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .login-footer a {
          color: var(--text-primary);
          font-weight: 700;
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .login-visual { display: none; }
          .login-content { grid-template-columns: 1fr; max-width: 500px; }
        }

        @media (max-width: 480px) {
          .login-box { padding: 2rem; border: none; }
        }
      `}</style>
    </div>
  );
}
