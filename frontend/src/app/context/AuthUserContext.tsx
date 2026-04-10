import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import api from '../api';
import { getAuthToken } from '../utils/authToken';
import { clearStoredAuthUser, readStoredAuthUser, userUpdatedEventName, writeStoredAuthUser, type AuthUserRecord } from '../utils/authUser';

interface AuthUserContextValue {
  user: AuthUserRecord | null;
  refreshUser: () => Promise<void>;
  setUserFromApi: (apiUser: any) => void;
  clearUser: () => void;
}

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

function mapApiUser(apiUser: any): AuthUserRecord {
  return {
    name: apiUser?.name ?? 'User',
    email: apiUser?.email ?? '',
    role: apiUser?.role?.name ?? apiUser?.role ?? 'student',
    profile_picture: apiUser?.profile_picture ?? null,
  };
}

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserRecord | null>(() => readStoredAuthUser());

  const setUserFromApi = useCallback((apiUser: any) => {
    const mapped = mapApiUser(apiUser);
    writeStoredAuthUser(mapped);
    setUser(mapped);
  }, []);

  const clearUser = useCallback(() => {
    clearStoredAuthUser();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await api.get('/me');
      setUserFromApi(response.data);
    } catch {
      // Keep local data when offline/transient failures.
    }
  }, [setUserFromApi]);

  useEffect(() => {
    refreshUser();

    function handleStorage(event: StorageEvent) {
      if (event.key === 'invigilore_user') {
        setUser(readStoredAuthUser());
      }
    }

    function handleUserUpdated() {
      setUser(readStoredAuthUser());
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener(userUpdatedEventName(), handleUserUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(userUpdatedEventName(), handleUserUpdated as EventListener);
    };
  }, [refreshUser]);

  const value = useMemo<AuthUserContextValue>(() => ({
    user,
    refreshUser,
    setUserFromApi,
    clearUser,
  }), [user, refreshUser, setUserFromApi, clearUser]);

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  const context = useContext(AuthUserContext);
  if (!context) {
    return {
      user: readStoredAuthUser(),
      refreshUser: async () => {},
      setUserFromApi: () => {},
      clearUser: () => {
        clearStoredAuthUser();
      },
    };
  }
  return context;
}
