/* Typen für window.Shell aus shared/shell.js (wird per <script> in jeder App geladen). */
interface ShellStore {
  get<T>(key: string, fallback: T): T;
  set(key: string, value: unknown): boolean;
  remove(key: string): void;
  keys(): string[];
  clear(): void;
}

interface ShellApi {
  root: string;
  isStandalone: boolean;
  home(): void;
  ready(): void;
  store(appId: string): ShellStore;
  toast(message: string, ms?: number): void;
}

interface Window {
  Shell?: ShellApi;
}
