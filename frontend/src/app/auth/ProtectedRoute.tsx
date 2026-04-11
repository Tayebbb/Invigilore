import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { getHomeRouteByRole, normalizeRole } from '../navigation/roleRoutes';
import { getAuthToken } from '../utils/authToken';
import { readStoredAuthUser } from '../utils/authUser';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'teacher' | 'student' | 'controller' | 'invigilator' | 'question-setter' | 'moderator';

const TEACHER_LIKE_ROLES = new Set([
  'teacher',
  'controller',
  'moderator',
  'question_setter',
  'question setter',
  'invigilator',
]);

export interface StoredUser {
  id?: number | string;
  name: string;
  email: string;
  role: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * getStoredUser — reads the authenticated user from localStorage.
 *
 * TODO: replace with a real auth context (JWT validation, refresh tokens, etc.)
 *       once the authentication system is implemented.
 */
export function getStoredUser(): StoredUser | null {
  return readStoredAuthUser() as StoredUser | null;
}

function normalizeStoredRole(rawRole: unknown): UserRole {
  const role = String(rawRole ?? '').toLowerCase().replace(/[-\s]+/g, '_');
  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return role;
  }
  if (TEACHER_LIKE_ROLES.has(role)) {
    return 'teacher';
  }
  return 'student';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  /** Roles allowed to access this route */
  allowedRoles: UserRole[];
  children: ReactNode;
}

/**
 * ProtectedRoute — guards a route behind authentication and role checks.
 *
 * Behaviour:
 *  • Not authenticated → redirect to /login
 *  • Authenticated but wrong role → redirect to the user's own dashboard
 *  • Authenticated + correct role → render children
 *
 * TODO: swap localStorage check for a real auth context / API call.
 */
export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const user = getStoredUser();
  const token = getAuthToken();
  const normalizedRole = normalizeRole(user?.role ?? null);

  // Not logged in
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (!normalizedRole) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but accessing the wrong role's dashboard
  if (!allowedRoles.includes(normalizedRole)) {
    return <Navigate to={getHomeRouteByRole(normalizedRole)} replace />;
  }

  return <>{children}</>;
}
