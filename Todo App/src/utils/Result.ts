export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function Err<T = never>(error: string): Result<T> {
  return { ok: false, error };
}