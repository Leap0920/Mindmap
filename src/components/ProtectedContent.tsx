"use client";

import { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react';

interface ProtectedContentProps {
    children: React.ReactNode;
    isInitiallyLocked?: boolean;
}

export default function ProtectedContent({ children, isInitiallyLocked = false }: ProtectedContentProps) {
    const [isLocked, setIsLocked] = useState(isInitiallyLocked);
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);

    const correctPin = '1234'; // In a real app, this would be validated against a hash in the DB

    const handleUnlock = () => {
        if (pin === correctPin) {
            setIsLocked(false);
            setPin('');
        } else {
            alert('Incorrect PIN');
        }
    };

    if (!isLocked) {
        return (
            <div className="protected-wrapper">
                <div className="protected-controls">
                    <button onClick={() => setIsLocked(true)} className="lock-btn">
                        <Lock size={16} />
                        <span>Lock Content</span>
                    </button>
                </div>
                {children}

                <style jsx>{`
          .protected-wrapper {
            position: relative;
          }
          .protected-controls {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 1rem;
          }
          .lock-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: var(--muted);
            padding: 0.4rem 0.8rem;
            border-radius: 4px;
            border: 1px solid var(--card-border);
          }
          .lock-btn:hover {
            color: var(--foreground);
            background: rgba(255, 255, 255, 0.05);
          }
        `}</style>
            </div>
        );
    }

    return (
        <div className="lock-screen glass">
            <div className="lock-icon">
                <Lock size={48} />
            </div>
            <h3>This content is locked</h3>
            <p>Enter your security PIN to view</p>

            <div className="pin-input-wrapper">
                <input
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    maxLength={4}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <button onClick={() => setShowPin(!showPin)} className="eye-btn">
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            <button onClick={handleUnlock} className="unlock-btn">
                Unlock
            </button>

            <style jsx>{`
        .lock-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          border-radius: 12px;
          text-align: center;
          border: 1px solid var(--card-border);
        }

        .lock-icon {
          margin-bottom: 1.5rem;
          color: var(--muted);
        }

        h3 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        p {
          font-size: 0.9rem;
          color: var(--muted);
          margin-bottom: 2rem;
        }

        .pin-input-wrapper {
          position: relative;
          width: 100%;
          max-width: 200px;
          margin-bottom: 1.5rem;
        }

        input {
          width: 100%;
          background: var(--background);
          border: 1px solid var(--card-border);
          padding: 0.75rem 1rem;
          border-radius: 6px;
          color: var(--foreground);
          text-align: center;
          font-size: 1.25rem;
          letter-spacing: 0.5em;
        }

        .eye-btn {
          position: absolute;
          right: -40px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
        }

        .unlock-btn {
          background: var(--foreground);
          color: var(--background);
          padding: 0.75rem 2rem;
          border-radius: 6px;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .unlock-btn:hover {
          transform: scale(1.02);
        }
      `}</style>
        </div>
    );
}
