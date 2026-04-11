export function normalizePermissionList(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

export function hasAnyPermission(userPermissions: string[] | undefined, required: string[]): boolean {
  const available = new Set(normalizePermissionList(userPermissions));
  const targets = normalizePermissionList(required);

  if (targets.length === 0) {
    return true;
  }

  return targets.some((permission) => available.has(permission));
}
