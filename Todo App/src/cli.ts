#!/usr/bin/env node
import { FileTodoRepository } from "./repo/FileTodoRepository";
import { TodoService } from "./services/TodoService";
import { TodoStatus } from "./domain/Todo";

const repo = new FileTodoRepository();
const service = new TodoService(repo);

const [cmd, ...args] = process.argv.slice(2);

async function main() {
  switch (cmd) {
    case "add": {
      const title = args.join(" ");
      const res = await service.add(title);
      if (res.ok) {
        logInfo(`Added: [${res.value.id}] ${res.value.title}`);
      } else {
        logError(res.error);
      }
      break;
    }
    case "list": {
      const res = await service.list();
      if (!res.ok) return logError(res.error);

      if (res.value.length === 0) {
        console.log("No todos yet.");
        break;
      }

      console.log("Todos:");
      for (const t of res.value) {
        const mark = t.status === TodoStatus.Done ? "✔" : " ";
        console.log(`[${mark}] ${t.id}  ${t.title}  (created: ${t.createdAt})`);
      }
      break;
    }
    case "done": {
      const id = args[0];
      if (!id) return logError("Usage: done <id>");
      const res = await service.done(id);
      if (res.ok) logInfo(`Marked done: ${res.value.id}`);
      else logError(res.error);
      break;
    }
    case "remove": {
      const id = args[0];
      if (!id) return logError("Usage: remove <id>");
      const res = await service.remove(id);
      if (res.ok) logInfo(`Removed: ${id}`);
      else logError(res.error);
      break;
    }
    case "clear": {
      const res = await service.clear();
      if (res.ok) logInfo("Cleared all todos.");
      else logError(res.error);
      break;
    }
    default: {
      printHelp();
    }
  }
}

function printHelp() {
  console.log("TypeScript Todo CLI");
  console.log("Usage:");
  console.log("  add <title>      Add new todo");
  console.log("  list             List todos");
  console.log("  done <id>        Mark todo as done");
  console.log("  remove <id>      Remove todo");
  console.log("  clear            Remove all todos");
}

function logInfo(msg: string) {
  console.log(msg);
}

function logError(msg: string) {
  console.error("Error:", msg);
}

main().catch(e => {
  console.error("Fatal:", e);
  process.exit(1);
});