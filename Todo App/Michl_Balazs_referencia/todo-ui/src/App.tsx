import { useEffect, useMemo, useState } from 'react'
import { addTodo, fetchTodos, markDone, removeTodo, type Todo, /* + */ markNotDone } from './api'

import './app.css'

type Filter = 'all' | 'open' | 'done'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        setTodos(await fetchTodos())
      } catch (e: any) {
        setError(e?.message ?? String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return todos
    return todos.filter(t => t.status === filter)
  }, [todos, filter])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    try {
      const created = await addTodo(t)
      setTodos(prev => [...prev, created])
      setTitle('')
    } catch (e: any) {
      setError(e?.message ?? String(e))
    }
  }

  async function onToggle(t: Todo) {
  try {
    const updated = t.status === 'done' ? await markNotDone(t.id) : await markDone(t.id)
    setTodos(prev => prev.map(x => (x.id === t.id ? updated : x)))
  } catch (e: any) {
    setError(e?.message ?? String(e))
  }
}

  // async function onDone(id: string) {
  //   try {
  //     const updated = await markDone(id)
  //     setTodos(prev => prev.map(t => (t.id === id ? updated : t)))
  //   } catch (e: any) {
  //     setError(e?.message ?? String(e))
  //   }
  // }

  async function onRemove(id: string) {
    try {
      await removeTodo(id)
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (e: any) {
      setError(e?.message ?? String(e))
    }
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Todos</h1>
        <div className="filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'open' ? 'active' : ''} onClick={() => setFilter('open')}>Not Done</button>
          <button className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')}>Done</button>
        </div>
      </header>

      <form className="add-form" onSubmit={onSubmit}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="New task..."
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <p className="hint">Loading…</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
      ) : filtered.length === 0 ? (
        <p className="hint">There no available tasks.</p>
      ) : (
        <ul className="list">
          {filtered.map(t => (
            <li key={t.id} className={`item ${t.status}`}>
              <div className="left">
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  onChange={() => onToggle(t)}
                  aria-label="Change to Done/Not Done"
                />
                <div className="text">
                  <div className="title">{t.title}</div>
                  <div className="meta">{new Date(t.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <button className="danger" onClick={() => onRemove(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}