"use client";

import { useState } from 'react';
import { Plus, CheckCircle2, Circle, MoreVertical, Calendar, Hash, ChevronDown, ListFilter, Search } from 'lucide-react';

export default function TodoPage() {
  const [todos, setTodos] = useState([
    { id: '1', task: 'Complete Advanced Mathematics Thesis', category: 'Academic', priority: 'High', due: 'Today', completed: false },
    { id: '2', task: 'Review Mindmap System Architecture', category: 'Technical', priority: 'Medium', due: 'Tomorrow', completed: false },
    { id: '3', task: 'Weekly Grocery Inventory', category: 'Essential', priority: 'Low', due: 'Dec 31', completed: true },
  ]);

  const toggle = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="todo-page">
      <header className="page-header">
        <div className="title-area">
          <div className="status-badge">12 Tasks Total</div>
          <h1 className="text-gradient">Task Matrix</h1>
          <p>Prioritize your focus and eliminate distractions.</p>
        </div>
        <button className="primary-btn">
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </header>

      <div className="todo-layout">
        <aside className="todo-nav">
          <div className="search-bar glass-panel">
            <Search size={16} />
            <input type="text" placeholder="Filter tasks..." />
          </div>

          <div className="nav-section">
            <span className="section-label">Perspective</span>
            <button className="nav-btn active">Inbox</button>
            <button className="nav-btn">Today</button>
            <button className="nav-btn">Scheduled</button>
          </div>

          <div className="nav-section">
            <span className="section-label">Category</span>
            <button className="nav-btn"><Hash size={14} /> Academic</button>
            <button className="nav-btn"><Hash size={14} /> Technical</button>
            <button className="nav-btn"><Hash size={14} /> Essential</button>
          </div>
        </aside>

        <main className="todo-content">
          <div className="list-controls">
            <div className="active-filters">
              <span>Sort by Priority</span>
              <ChevronDown size={14} />
            </div>
            <button className="icon-btn"><ListFilter size={18} /></button>
          </div>

          <div className="todo-list">
            {todos.map(todo => (
              <div
                key={todo.id}
                className={`todo-row premium-card ${todo.completed ? 'is-done' : ''}`}
                onClick={() => toggle(todo.id)}
              >
                <div className="check-zone">
                  {todo.completed ? <CheckCircle2 size={24} className="check-success" /> : <Circle size={24} className="check-idle" />}
                </div>
                <div className="todo-info">
                  <h4>{todo.task}</h4>
                  <div className="meta-info">
                    <span className="category-tag">{todo.category}</span>
                    <span className={`priority-tag ${todo.priority.toLowerCase()}`}>{todo.priority}</span>
                    <span className="due-tag"><Calendar size={12} /> {todo.due}</span>
                  </div>
                </div>
                <button className="action-btn" onClick={(e) => e.stopPropagation()}><MoreVertical size={18} /></button>
              </div>
            ))}
          </div>
        </main>
      </div>

      <style jsx>{`
        .todo-page {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 4rem;
        }

        .status-badge {
          display: inline-block;
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }

        .page-header h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .primary-btn {
          background: var(--text-primary);
          color: var(--bg-deep);
          padding: 0.8rem 1.75rem;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .todo-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 4rem;
        }

        .todo-nav {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          color: var(--text-muted);
        }

        .search-bar input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.9rem;
          width: 100%;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .section-label {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--text-dim);
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }

        .nav-btn {
          text-align: left;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          font-size: 0.95rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: var(--transition-fast);
        }

        .nav-btn:hover {
          background: rgba(255,255,255,0.03);
          color: var(--text-primary);
        }

        .nav-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          font-weight: 700;
          border: 1px solid var(--border-main);
        }

        .list-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 0 0.5rem;
        }

        .active-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .todo-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          cursor: pointer;
          position: relative;
        }

        .todo-row:hover {
          background: rgba(255,255,255,0.03);
          border-color: var(--border-bright);
          transform: translateX(4px);
        }

        .check-idle { color: var(--text-dim); }
        .check-success { color: var(--text-primary); }

        .todo-info {
          flex: 1;
        }

        .todo-info h4 {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          transition: var(--transition-base);
        }

        .is-done h4 {
          color: var(--text-dim);
          text-decoration: line-through;
        }

        .meta-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .tag, .category-tag, .priority-tag, .due-tag {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .category-tag { color: var(--text-muted); }
        
        .priority-tag.high { color: #ff5555; }
        .priority-tag.medium { color: #ffaa00; }
        .priority-tag.low { color: #55ff55; }

        .due-tag {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-dim);
        }

        .action-btn {
          color: var(--text-dim);
          padding: 0.5rem;
        }

        .action-btn:hover { color: var(--text-primary); }

        @media (max-width: 900px) {
          .todo-layout { grid-template-columns: 1fr; }
          .todo-nav { display: none; }
          .page-header h1 { font-size: 2.5rem; }
        }
      `}</style>
    </div>
  );
}
