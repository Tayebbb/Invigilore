import { getApiBaseUrl } from '../api';

export function resolveProfileImageUrl(profilePicture: string | null | undefined, apiBaseUrl?: string | null): string | null {
  if (!profilePicture) {
    return null;
  }

  if (/^https?:\/\//i.test(profilePicture)) {
    return profilePicture;
  }

  const configuredBase = (apiBaseUrl ?? getApiBaseUrl()).replace(/\/$/, '');
  const appBase = configuredBase.replace(/\/api$/, '');
  const cleanPath = profilePicture.replace(/^\/+/, '');
  return `${appBase}/storage/${cleanPath}`;
}
