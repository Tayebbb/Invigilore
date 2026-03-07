import { type ReactNode } from 'react';
import { Navigate } from 'react-router';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'teacher' | 'student';

export interface StoredUser {
  name: string;
  email: string;
  role: UserRole;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * getStoredUser — reads the authenticated user from localStorage.
 *
 * TODO: replace with a real auth context (JWT validation, refresh tokens, etc.)
 *       once the authentication system is implemented.
 */
export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('invigilore_user');
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
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

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but accessing the wrong role's dashboard
  if (!allowedRoles.includes(user.role)) {
    const rolePaths: Record<UserRole, string> = {
      admin:   '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
    };
    return <Navigate to={rolePaths[user.role]} replace />;
  }

  return <>{children}</>;
}
