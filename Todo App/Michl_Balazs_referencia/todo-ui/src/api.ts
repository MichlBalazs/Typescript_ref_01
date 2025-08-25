export type Todo = {
  id: string
  title: string
  createdAt: string
  status: 'open' | 'done'
}

export async function fetchTodos(): Promise<Todo[]> {
  const r = await fetch('/api/todos')
  if (!r.ok) throw new Error('Failed to load todos')
  return r.json()
}

export async function addTodo(title: string): Promise<Todo> {
  const r = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
  if (!r.ok) throw new Error('Failed to add')
  return r.json()
}

export async function markDone(id: string): Promise<Todo> {
  const r = await fetch(`/api/todos/${id}/done`, { method: 'PATCH' })
  if (!r.ok) throw new Error('Failed to mark done')
  return r.json()
}

export async function removeTodo(id: string): Promise<void> {
  const r = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Failed to remove')
}

export async function markNotDone(id: string): Promise<Todo> {
  const r = await fetch(`/api/todos/${id}/not_done`, { method: 'PATCH' })
  if (!r.ok) throw new Error('Failed to mark not done')
  return r.json()
}