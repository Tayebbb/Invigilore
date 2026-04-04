export const roleHomeRoutes = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  controller: '/controller/dashboard',
  invigilator: '/invigilator/dashboard',
  'question-setter': '/question-setter/dashboard',
  moderator: '/moderator/dashboard',
} as const;

export type RoleKey = keyof typeof roleHomeRoutes;

const roleAliases: Record<string, RoleKey> = {
  student: 'student',
  admin: 'admin',
  teacher: 'teacher',
  controller: 'controller',
  invigilator: 'invigilator',
  moderator: 'moderator',
  'question setter': 'question-setter',
  'question-setter': 'question-setter',
  question_setter: 'question-setter',
};

function normalizeRoleValue(role: string) {
  return role.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeRole(role?: string | null): RoleKey | null {
  if (!role) {
    return null;
  }

  const key = normalizeRoleValue(role);
  return roleAliases[key] ?? null;
}

export function getHomeRouteByRole(role?: string | null): string {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? roleHomeRoutes[normalizedRole] : '/login';
}

export function isStudentRole(role?: string | null): boolean {
  return normalizeRole(role) === 'student';
}
