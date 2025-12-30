"use client";

import { useState } from 'react';
import { Plus, CheckCircle2, Circle, MoreVertical, Flag, Calendar } from 'lucide-react';

export default function TodoPage() {
    const [todos, setTodos] = useState([
        { id: '1', task: 'Complete Math Assignment', category: 'School', priority: 'High', due: 'Today', completed: false },
        { id: '2', task: 'Buy Groceries', category: 'Personal', priority: 'Medium', due: 'Tomorrow', completed: false },
        { id: '3', task: 'Read React Docs', category: 'Work', priority: 'Low', due: 'Dec 31', completed: true },
    ]);

    const toggle = (id: string) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <div className="todo-page">
            <header className="page-header">
                <div>
                    <h1>Tasks</h1>
                    <p>Organize your work and life</p>
                </div>
                <button className="add-btn"><Plus size={18} /><span>Add Task</span></button>
            </header>

            <div className="todo-layout">
                <aside className="todo-categories">
                    <div className="cat-group">
                        <h3>Lists</h3>
                        <button className="cat-link active">All Tasks</button>
                        <button className="cat-link">Personal</button>
                        <button className="cat-link">School</button>
                        <button className="cat-link">Work</button>
                    </div>
                    <div className="cat-group">
                        <h3>Filters</h3>
                        <button className="cat-link">Today</button>
                        <button className="cat-link">Upcoming</button>
                        <button className="cat-link">Completed</button>
                    </div>
                </aside>

                <main className="todo-main">
                    <div className="todo-list">
                        {todos.map(todo => (
                            <div
                                key={todo.id}
                                className={`todo-item glass ${todo.completed ? 'completed' : ''}`}
                                onClick={() => toggle(todo.id)}
                            >
                                <div className="todo-left">
                                    <div className="check-wrapper">
                                        {todo.completed ? <CheckCircle2 size={22} className="check-icon done" /> : <Circle size={22} className="check-icon" />}
                                    </div>
                                    <div className="todo-content">
                                        <h4>{todo.task}</h4>
                                        <div className="todo-tags">
                                            <span className="tag category">{todo.category}</span>
                                            <span className={`tag priority ${todo.priority.toLowerCase()}`}>{todo.priority}</span>
                                            <span className="tag due"><Calendar size={12} /> {todo.due}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="more-btn"><MoreVertical size={18} /></button>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            <style jsx>{`
        .todo-page {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          font-size: 2.5rem;
          font-weight: 800;
        }

        .page-header p {
          color: var(--muted);
        }

        .add-btn {
          background: var(--foreground);
          color: var(--background);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .todo-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 3rem;
        }

        .todo-categories {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .cat-group h3 {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--muted);
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
          padding-left: 0.75rem;
        }

        .cat-link {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--muted);
          border-radius: 8px;
          transition: all 0.2s;
        }

        .cat-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--foreground);
        }

        .cat-link.active {
          background: var(--card-bg);
          color: var(--foreground);
          font-weight: 700;
          border: 1px solid var(--card-border);
        }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .todo-item {
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--card-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .todo-item:hover {
          background: rgba(255, 255, 255, 0.04);
          transform: translateX(4px);
        }

        .todo-left {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
        }

        .check-icon {
          color: var(--muted);
          margin-top: 2px;
        }

        .check-icon.done {
          color: var(--foreground);
        }

        .todo-content h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .todo-item.completed h4 {
          color: var(--muted);
          text-decoration: line-through;
        }

        .todo-tags {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .tag {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--muted);
        }

        .tag.priority.high { color: #ff4444; background: rgba(255, 68, 68, 0.1); }
        .tag.priority.medium { color: #ffbb33; background: rgba(255, 187, 51, 0.1); }
        .tag.priority.low { color: #00C851; background: rgba(0, 200, 81, 0.1); }

        .tag.due {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .more-btn {
          color: var(--muted);
        }

        @media (max-width: 800px) {
          .todo-layout {
            grid-template-columns: 1fr;
          }
          .todo-categories {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 1rem;
          }
          .cat-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .cat-group h3 {
            margin-bottom: 0;
          }
        }
      `}</style>
        </div>
    );
}
