import { Todo } from "../domain/Todo";
import { Result } from "../utils/Result";

export interface TodoRepository {
  loadAll(): Promise<Result<Todo[]>>;
  saveAll(todos: Todo[]): Promise<Result<void>>;
}