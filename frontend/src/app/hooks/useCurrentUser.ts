import { useEffect, useMemo, useState } from 'react';

import api from '../api';
import { getStoredUser } from '../auth/ProtectedRoute';

type UserRole = 'admin' | 'teacher' | 'student';

const TEACHER_LIKE_ROLES = new Set([
  'teacher',
  'controller',
  'moderator',
  'question_setter',
  'question setter',
  'invigilator',
]);

type ApiMeResponse = {
  name?: string;
  email?: string;
  role?: { name?: string } | string | null;
};

function normalizeRole(rawRole: unknown): UserRole {
  const role = String(rawRole ?? '').toLowerCase().replace(/[-\s]+/g, '_');
  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return role;
  }
  if (TEACHER_LIKE_ROLES.has(role)) {
    return 'teacher';
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
    rawRole: String(stored?.role ?? 'student').toLowerCase().replace(/[-\s]+/g, '_'),
    role: normalizeRole(stored?.role),
  }));

  useEffect(() => {
    let mounted = true;

    async function fetchMe() {
      try {
        const { data } = await api.get<ApiMeResponse>('/me');
        if (!mounted) return;

        const role = normalizeRole((data?.role as { name?: string } | undefined)?.name ?? data?.role);
        const rawRole = String((data?.role as { name?: string } | undefined)?.name ?? data?.role ?? user.rawRole)
          .toLowerCase()
          .replace(/[-\s]+/g, '_');
        const next = {
          name: data?.name ?? user.name,
          email: data?.email ?? user.email,
          rawRole,
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
      roleKey: user.rawRole,
      firstName: (user.name ?? 'User').trim().split(' ')[0] || 'User',
    }),
    [user],
  );

  return uiUser;
}
