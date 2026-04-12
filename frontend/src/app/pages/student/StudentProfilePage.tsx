import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Save } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { extractApiData, extractApiError } from '../../utils/apiHelpers';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import { resolveProfileImageUrl } from '../../utils/profileImage';
import { writeStoredAuthUser } from '../../utils/authUser';

function pickProfilePicture(user: any): string | null {
  return user?.profile_picture ?? user?.profile?.profile_picture ?? null;
}

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/me');
        const user = extractApiData(response) ?? response.data;
        setName(user?.name ?? '');
        setEmail(user?.email ?? '');
        setRole(user?.role?.name ?? 'student');
        setProfilePicture(pickProfilePicture(user));
      } catch {
        setStatus('Unable to load profile');
      }
    }

    load();
  }, []);

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const canSave = useMemo(() => name.trim().length >= 2, [name]);

  const save = async () => {
    setStatus('');
    try {
      await api.put('/me', {
        name: name.trim(),
      });

      const meResponse = await api.get('/me');
      const meData = meResponse.data;
      const nextName = meData?.name ?? name.trim();
      const nextEmail = meData?.email ?? email;
      const nextRole = meData?.role?.name ?? meData?.role ?? role;
      const nextPicture = pickProfilePicture(meData) ?? profilePicture;

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
    } catch {
      setStatus('Profile update failed');
    }
  };

  const pictureUrl = resolveProfileImageUrl(profilePicture, api.defaults.baseURL?.toString());
  const avatarLetter = (name?.trim()?.[0] ?? 'S').toUpperCase();


  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Profile"
      onNavChange={handleNav}
      user={{ name: name || 'Student', email: email || 'student@invigilore.com', initial: avatarLetter, role: 'Student' }}
      pageTitle="My Profile"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-5 text-xl font-semibold text-white">Student Profile</h2>

        <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-950 p-4">
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={`${name || 'Student'} profile`}
              className="h-16 w-16 rounded-2xl object-cover border border-gray-700"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xl font-bold text-white">
              {avatarLetter}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-white">{name || 'Student'}</p>
            <p className="text-xs text-gray-400">{email || 'student@invigilore.com'}</p>
            <p className="mt-1 text-xs text-gray-500">Profile photo is managed in Account Settings.</p>
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
            disabled={!canSave}
            onClick={save}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>

        {status && <p className="mt-3 text-sm text-gray-300">{status}</p>}
      </div>
    </DashboardLayout>
  );
}
