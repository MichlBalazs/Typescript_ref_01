import express from "express";
import cors from "cors";
import { Todo } from "./domain/Todo";
import { TodoService } from "./services/TodoService";
import { FileTodoRepository } from "./repo/FileTodoRepository";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const repo = new FileTodoRepository();
const service = new TodoService(repo);

app.get("/api/todos", async (_req, res) => {
  const r = await service.list();
  if (!r.ok) return res.status(500).json({ error: r.error });
  res.json(r.value);
});

app.post("/api/todos", async (req, res) => {
  const title = String(req.body?.title ?? "");
  const r = await service.add(title);
  if (!r.ok) return res.status(400).json({ error: r.error });
  res.status(201).json(r.value);
});


app.patch("/api/todos/:id/done", async (req, res) => {
  const r = await service.done(req.params.id);
  if (!r.ok) return res.status(404).json({ error: r.error });
  res.json(r.value);
});

app.delete("/api/todos/:id", async (req, res) => {
  const r = await service.remove(req.params.id);
  if (!r.ok) return res.status(404).json({ error: r.error });
  res.status(204).end();
});

app.get("/api/stats", async (_req, res) => {
  if (!(service as any).stats) return res.status(404).json({ error: "No stats endpoint" });
  const r = await (service as any).stats();
  if (!r.ok) return res.status(500).json({ error: r.error });
  res.json(r.value);
});

app.patch("/api/todos/:id/not_done", async (req, res) => {
  const r = await service.not_done(req.params.id);
  if (!r.ok) return res.status(404).json({ error: r.error });
  res.json(r.value);
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});