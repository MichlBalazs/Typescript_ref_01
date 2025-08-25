"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const TodoService_1 = require("./services/TodoService");
const FileTodoRepository_1 = require("./repo/FileTodoRepository");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)({ origin: "http://localhost:5173" }));
app.use(express_1.default.json());
const repo = new FileTodoRepository_1.FileTodoRepository();
const service = new TodoService_1.TodoService(repo);
app.get("/api/todos", async (_req, res) => {
    const r = await service.list();
    if (!r.ok)
        return res.status(500).json({ error: r.error });
    res.json(r.value);
});
app.post("/api/todos", async (req, res) => {
    const title = String(req.body?.title ?? "");
    const r = await service.add(title);
    if (!r.ok)
        return res.status(400).json({ error: r.error });
    res.status(201).json(r.value);
});
app.patch("/api/todos/:id/done", async (req, res) => {
    const r = await service.done(req.params.id);
    if (!r.ok)
        return res.status(404).json({ error: r.error });
    res.json(r.value);
});
app.delete("/api/todos/:id", async (req, res) => {
    const r = await service.remove(req.params.id);
    if (!r.ok)
        return res.status(404).json({ error: r.error });
    res.status(204).end();
});
app.get("/api/stats", async (_req, res) => {
    if (!service.stats)
        return res.status(404).json({ error: "No stats endpoint" });
    const r = await service.stats();
    if (!r.ok)
        return res.status(500).json({ error: r.error });
    res.json(r.value);
});
app.patch("/api/todos/:id/not_done", async (req, res) => {
    const r = await service.not_done(req.params.id);
    if (!r.ok)
        return res.status(404).json({ error: r.error });
    res.json(r.value);
});
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
