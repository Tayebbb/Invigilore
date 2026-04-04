export interface AuthUserRecord {
  id?: number | string;
  name: string;
  email: string;
  role: string;
  profile_picture?: string | null;
}

const STORAGE_KEY = 'invigilore_user';
const USER_UPDATED_EVENT = 'invigilore-user-updated';

export function readStoredAuthUser(): AuthUserRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AuthUserRecord;
  } catch {
    return null;
  }
}

export function writeStoredAuthUser(user: AuthUserRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent<AuthUserRecord>(USER_UPDATED_EVENT, { detail: user }));
}

export function clearStoredAuthUser(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT));
}

export function userUpdatedEventName(): string {
  return USER_UPDATED_EVENT;
}
