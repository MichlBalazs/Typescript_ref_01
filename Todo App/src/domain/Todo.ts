export enum TodoStatus {
  Open = "open",
  Done = "done"
}
export interface Todo {
  id: string;
  title: string;
  createdAt: string;
  status: TodoStatus;
}