import api from '../../api';
import { extractApiData } from '../../utils/apiHelpers';

export type AdminRole =
  | 'admin'
  | 'teacher'
  | 'student'
  | 'controller'
  | 'moderator'
  | 'question_setter'
  | 'invigilator';

export type UserStatusFilter = 'all' | 'active' | 'inactive';
export type UserSortField = 'name' | 'created_at';
export type UserSortDirection = 'asc' | 'desc';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AdminUsersMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ListUsersParams {
  page: number;
  perPage: number;
  search: string;
  role: string;
  status: UserStatusFilter;
  sortBy: UserSortField;
  sortDir: UserSortDirection;
}

export interface ListUsersResponse {
  users: AdminUser[];
  meta: AdminUsersMeta;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export async function listAdminUsers(params: ListUsersParams): Promise<ListUsersResponse> {
  const response = await api.get('/admin/users', {
    params: {
      page: params.page,
      per_page: params.perPage,
      search: params.search || undefined,
      role: params.role || undefined,
      status: params.status,
      sort_by: params.sortBy,
      sort_dir: params.sortDir,
    },
  });

  const users = extractApiData(response);
  const meta = response?.data?.meta;

  return {
    users: Array.isArray(users) ? (users as AdminUser[]) : [],
    meta: {
      current_page: Number(meta?.current_page ?? 1),
      per_page: Number(meta?.per_page ?? params.perPage),
      total: Number(meta?.total ?? 0),
      last_page: Number(meta?.last_page ?? 1),
    },
  };
}

export async function createAdminUser(payload: CreateUserPayload): Promise<AdminUser> {
  const response = await api.post('/admin/users', payload);
  return extractApiData(response) as AdminUser;
}

export async function setAdminUserStatus(userId: number, isActive: boolean): Promise<AdminUser> {
  const response = await api.patch(`/admin/users/${userId}/status`, {
    is_active: isActive,
  });

  return extractApiData(response) as AdminUser;
}

export async function updateAdminUserRole(userId: number, role: string): Promise<AdminUser> {
  const response = await api.patch(`/admin/users/${userId}`, {
    role,
  });

  return extractApiData(response) as AdminUser;
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}
