/*
 * Wie useState, aber dauerhaft im localStorage gespeichert – mit App-Präfix,
 * genau wie Shell.store() in den Vanilla-Apps. Backup im Launcher erfasst es automatisch.
 *
 *   const [todos, setTodos] = useStored(APP_ID, 'todos', [] as Todo[]);
 */
import { useCallback, useState } from 'react';

function read<T>(appId: string, key: string, fallback: T): T {
  const raw = localStorage.getItem(`${appId}:${key}`);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

function write(appId: string, key: string, value: unknown) {
  try {
    localStorage.setItem(`${appId}:${key}`, JSON.stringify(value));
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?');
  }
}

export function useStored<T>(appId: string, key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(appId, key, fallback));

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        write(appId, key, resolved);
        return resolved;
      });
    },
    [appId, key],
  );

  return [value, set] as const;
}
