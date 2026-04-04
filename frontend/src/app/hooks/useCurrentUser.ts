import { useEffect, useMemo, useState } from 'react';

import api from '../api';
import { getStoredUser } from '../auth/ProtectedRoute';

type UserRole = 'admin' | 'teacher' | 'student';

type ApiMeResponse = {
  name?: string;
  email?: string;
  role?: { name?: string } | string | null;
};

function normalizeRole(rawRole: unknown): UserRole {
  const role = String(rawRole ?? '').toLowerCase();
  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return role;
  }
  return 'student';
}

function toBadgeRole(role: UserRole): 'Admin' | 'Teacher' | 'Student' {
  if (role === 'admin') return 'Admin';
  if (role === 'teacher') return 'Teacher';
  return 'Student';
}

export default function useCurrentUser() {
  const stored = getStoredUser();

  const [user, setUser] = useState(() => ({
    name: stored?.name ?? 'User',
    email: stored?.email ?? '',
    role: normalizeRole(stored?.role),
  }));

  useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        const { data } = await api.get<ApiMeResponse>('/me');
        if (!mounted) return;

        const role = normalizeRole((data?.role as { name?: string } | undefined)?.name ?? data?.role);
        const next = {
          name: data?.name ?? user.name,
          email: data?.email ?? user.email,
          role,
        };

        setUser(next);
        localStorage.setItem('invigilore_user', JSON.stringify(next));
      } catch {
        // Keep local fallback values when /me is unavailable.
      }
    }

    void fetchMe();

    return () => {
      mounted = false;
    };
  }, []);

  const uiUser = useMemo(
    () => ({
      name: user.name,
      email: user.email,
      initial: (user.name?.[0] ?? 'U').toUpperCase(),
      roleBadge: toBadgeRole(user.role),
      firstName: (user.name ?? 'User').trim().split(' ')[0] || 'User',
    }),
    [user],
  );

  return uiUser;
}
