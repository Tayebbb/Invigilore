import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { extractApiData } from '../../utils/apiHelpers';
import { TEACHER_NAV_ITEMS, getTeacherSidebarRoute } from '../../navigation/teacherNavigation';
import { resolveProfileImageUrl } from '../../utils/profileImage';
import { writeStoredAuthUser } from '../../utils/authUser';

export default function TeacherProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('teacher');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/me');
        const user = extractApiData(response) ?? response.data;
        setName(user?.name ?? '');
        setEmail(user?.email ?? '');
        setRole(user?.role?.name ?? 'teacher');
        setProfilePicture(user?.profile_picture ?? null);
      } catch {
        setStatus('Unable to load profile');
      }
    }

    load();
  }, []);

  const handleNav = (label: string) => {
    const route = getTeacherSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const canSave = useMemo(() => name.trim().length >= 2, [name]);

  const save = async () => {
    const trimmedName = name.trim();
    const previousName = name;

    if (trimmedName.length < 2) {
      setStatus('Name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    setStatus('');

    // Optimistic update for instant UI feedback.
    setName(trimmedName);
    writeStoredAuthUser({
      name: trimmedName,
      email,
      role,
      profile_picture: profilePicture ?? null,
    });

    try {
      const updateResponse = await api.put('/me', {
        name: trimmedName,
      });

      const updatedUser = extractApiData(updateResponse) ?? updateResponse.data;
      const nextName = updatedUser?.name ?? trimmedName;
      const nextEmail = updatedUser?.email ?? email;
      const nextRole = updatedUser?.role?.name ?? updatedUser?.role ?? role;
      const nextPicture = updatedUser?.profile_picture ?? profilePicture;

      setName(nextName);
      setEmail(nextEmail);
      setRole(nextRole);
      setProfilePicture(nextPicture ?? null);

      writeStoredAuthUser({
        name: nextName,
        email: nextEmail,
        role: nextRole,
        profile_picture: nextPicture ?? null,
      });

      setStatus('Profile updated successfully');
      setLastSavedAt(Date.now());
    } catch {
      // Revert optimistic update if API save fails.
      setName(previousName);
      writeStoredAuthUser({
        name: previousName,
        email,
        role,
        profile_picture: profilePicture ?? null,
      });
      setStatus('Profile update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const pictureUrl = resolveProfileImageUrl(profilePicture, api.defaults.baseURL?.toString());
  const avatarLetter = (name?.trim()?.[0] ?? 'T').toUpperCase();

  return (
    <DashboardLayout
      role="Teacher"
      navItems={TEACHER_NAV_ITEMS}
      activeItem="View Profile"
      onNavChange={handleNav}
      user={{ name: name || 'Teacher', email: email || 'teacher@invigilore.com', initial: avatarLetter, role: 'Teacher' }}
      pageTitle="My Profile"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-5 text-xl font-semibold text-white">Teacher Profile</h2>

        <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-950 p-4">
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={`${name || 'Teacher'} profile`}
              className="h-16 w-16 rounded-2xl object-cover border border-gray-700"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white">
              {avatarLetter}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{name || 'Teacher'}</p>
            <p className="text-xs text-gray-400">{email || 'teacher@invigilore.com'}</p>
            <p className="mt-1 text-xs text-gray-500">Profile photo and security settings are managed in Account Settings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-gray-400">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-400">Email</span>
            <input value={email} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-gray-400">Role</span>
            <input value={role} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-400">Restricted fields like role and password are managed in dedicated settings pages.</p>
          <button
            type="button"
            disabled={!canSave || isSaving}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-500/30 active:scale-95"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          {status && <p className="text-sm text-gray-300">{status}</p>}
          {lastSavedAt && !isSaving ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved just now
            </p>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
