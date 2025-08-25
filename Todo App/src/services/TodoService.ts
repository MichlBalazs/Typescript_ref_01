import { Todo, TodoStatus } from "../domain/Todo";
import { Err, Ok, Result } from "../utils/Result";
import { TodoRepository } from "../repo/TodoRepository";

export class TodoService {
  constructor(private repo: TodoRepository) {}

  async list(): Promise<Result<Todo[]>> {
    return this.repo.loadAll();
  }

  async add(title: string): Promise<Result<Todo>> {
    const trimmed = title.trim();
    if (trimmed.length < 3) {
      return Err("Title must be at least 3 characters long.");
    }
    const current = await this.repo.loadAll();
    if (!current.ok) return current;

    const todo: Todo = {
      id: this.generateId(),
      title: trimmed,
      createdAt: new Date().toISOString(),
      status: TodoStatus.Open
    };

    const next = [...current.value, todo];
    const saved = await this.repo.saveAll(next);
    if (!saved.ok) return saved;

    return Ok(todo);
    }

  async done(id: string): Promise<Result<Todo>> {
    const current = await this.repo.loadAll();
    if (!current.ok) return current;

    const idx = current.value.findIndex(t => t.id === id);
    if (idx === -1) return Err("Todo not found.");

    const item = current.value[idx];
    const updated: Todo = { ...item, status: TodoStatus.Done };

    const next = [...current.value];
    next[idx] = updated;

    const saved = await this.repo.saveAll(next);
    if (!saved.ok) return saved;

    return Ok(updated);
  }

  async not_done(id: string): Promise<Result<Todo>> {
    const current = await this.repo.loadAll();
    if (!current.ok) return current;

    const idx = current.value.findIndex(t => t.id === id);
    if (idx === -1) return Err("Todo not found.");

    const updated: Todo = { ...current.value[idx], status: TodoStatus.Open };
    const next = [...current.value];
    next[idx] = updated;

    const saved = await this.repo.saveAll(next);
    if (!saved.ok) return saved;

    return Ok(updated);
  }

  async remove(id: string): Promise<Result<void>> {
    const current = await this.repo.loadAll();
    if (!current.ok) return current;

    const next = current.value.filter(t => t.id !== id);
    if (next.length === current.value.length) return Err("Todo not found.");

    return this.repo.saveAll(next);
  }

  async clear(): Promise<Result<void>> {
    return this.repo.saveAll([]);
  }

  private generateId(): string {
    return Math.random().toString(36).slice(2, 10);
  }

  
}