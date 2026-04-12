import { getApiBaseUrl } from '../api';

export function resolveProfileImageUrl(profilePicture: string | null | undefined, apiBaseUrl?: string | null): string | null {
  if (!profilePicture) {
    return null;
  }

  if (/^https?:\/\//i.test(profilePicture) || /^data:/i.test(profilePicture)) {
    return profilePicture;
  }

  const configuredBase = (apiBaseUrl ?? getApiBaseUrl()).replace(/\/$/, '');
  const appBase = configuredBase.replace(/\/api$/, '');
  let cleanPath = profilePicture.replace(/\\/g, '/').replace(/^\/+/, '');

  if (cleanPath.startsWith('public/')) {
    cleanPath = cleanPath.slice('public/'.length);
  }

  if (cleanPath.startsWith('storage/')) {
    return `${appBase}/${cleanPath}`;
  }

  return `${appBase}/storage/${cleanPath}`;
}
