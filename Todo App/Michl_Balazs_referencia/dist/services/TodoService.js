"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoService = void 0;
const Todo_1 = require("../domain/Todo");
const Result_1 = require("../utils/Result");
class TodoService {
    constructor(repo) {
        this.repo = repo;
    }
    async list() {
        return this.repo.loadAll();
    }
    async add(title) {
        const trimmed = title.trim();
        if (trimmed.length < 3) {
            return (0, Result_1.Err)("Title must be at least 3 characters long.");
        }
        const current = await this.repo.loadAll();
        if (!current.ok)
            return current;
        const todo = {
            id: this.generateId(),
            title: trimmed,
            createdAt: new Date().toISOString(),
            status: Todo_1.TodoStatus.Open
        };
        const next = [...current.value, todo];
        const saved = await this.repo.saveAll(next);
        if (!saved.ok)
            return saved;
        return (0, Result_1.Ok)(todo);
    }
    async done(id) {
        const current = await this.repo.loadAll();
        if (!current.ok)
            return current;
        const idx = current.value.findIndex(t => t.id === id);
        if (idx === -1)
            return (0, Result_1.Err)("Todo not found.");
        const item = current.value[idx];
        const updated = { ...item, status: Todo_1.TodoStatus.Done };
        const next = [...current.value];
        next[idx] = updated;
        const saved = await this.repo.saveAll(next);
        if (!saved.ok)
            return saved;
        return (0, Result_1.Ok)(updated);
    }
    async not_done(id) {
        const current = await this.repo.loadAll();
        if (!current.ok)
            return current;
        const idx = current.value.findIndex(t => t.id === id);
        if (idx === -1)
            return (0, Result_1.Err)("Todo not found.");
        const updated = { ...current.value[idx], status: Todo_1.TodoStatus.Open };
        const next = [...current.value];
        next[idx] = updated;
        const saved = await this.repo.saveAll(next);
        if (!saved.ok)
            return saved;
        return (0, Result_1.Ok)(updated);
    }
    async remove(id) {
        const current = await this.repo.loadAll();
        if (!current.ok)
            return current;
        const next = current.value.filter(t => t.id !== id);
        if (next.length === current.value.length)
            return (0, Result_1.Err)("Todo not found.");
        return this.repo.saveAll(next);
    }
    async clear() {
        return this.repo.saveAll([]);
    }
    generateId() {
        return Math.random().toString(36).slice(2, 10);
    }
}
exports.TodoService = TodoService;
