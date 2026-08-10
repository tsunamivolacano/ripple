export function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key) || sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function safeSetStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error);
  }
}

export function getLocalUserId(email: string): string {
  const clean = email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `usr_${clean}`;
}