const TOKEN_STORAGE_KEY = 'token';

export function getAuthToken(): string | null {
  const sessionToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (sessionToken) {
    return sessionToken;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function hasPersistentAuthToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}

export function setAuthToken(token: string, rememberMe: boolean): void {
  if (rememberMe) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}
