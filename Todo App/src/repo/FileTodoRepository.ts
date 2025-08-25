import { promises as fs } from "fs";
import * as path from "path";
import { Todo } from "../domain/Todo";
import { Err, Ok, Result } from "../utils/Result";
import { TodoRepository } from "./TodoRepository";

export class FileTodoRepository implements TodoRepository {
  private dataPath: string;

  constructor(customPath?: string) {
    this.dataPath =
      customPath ?? path.resolve(__dirname, "../../data/todos.json");
  }

  async loadAll(): Promise<Result<Todo[]>> {
    try {
      await this.ensureFile(this.dataPath, "[]");

      const raw = await fs.readFile(this.dataPath, "utf-8");
      const parsed = JSON.parse(raw ?? "[]");

      if (!Array.isArray(parsed)) {
        return Err("Corrupted data file: not an array.");
      }

      const safe: Todo[] = [];
      for (const it of parsed) {
        if (
          it &&
          typeof it.id === "string" &&
          typeof it.title === "string" &&
          (it.status === "open" || it.status === "done")
        ) {
          safe.push(it as Todo);
        }
      }

      return Ok(safe);
    } catch {
      return Err("Could not read todos.json");
    }
  }

  async saveAll(todos: Todo[]): Promise<Result<void>> {
    try {
      await this.ensureDirOf(this.dataPath);

      const tmp = this.dataPath + ".tmp";
      await fs.writeFile(
        tmp,
        JSON.stringify(todos, null, 2) + "\n",
        "utf-8"
      );
      await fs.rename(tmp, this.dataPath);

      return Ok(undefined);
    } catch {
      return Err("Could not write todos.json");
    }
  }

  private async ensureFile(filePath: string, initContent: string) {
    await this.ensureDirOf(filePath);
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, initContent, "utf-8");
    }
  }

  private async ensureDirOf(filePath: string) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
  }
}