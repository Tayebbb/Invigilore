import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, CheckCircle2, Loader2, Save, Upload } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { extractApiData, extractApiError } from '../../utils/apiHelpers';
import { TEACHER_NAV_ITEMS, getTeacherSidebarRoute } from '../../navigation/teacherNavigation';
import { writeStoredAuthUser } from '../../utils/authUser';

export default function TeacherAccountSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('teacher');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await api.get('/me');
        const data = extractApiData(response) ?? response.data;

        const initialName = data?.name ?? '';
        setFullName(initialName);
        setSavedName(initialName);
        setEmail(data?.email ?? '');
        setRole(data?.role?.name ?? data?.role ?? 'teacher');
        setProfilePicture(data?.profile_picture ?? null);
      } catch (err) {
        setError('Unable to load account settings');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const canSaveProfile = useMemo(() => {
    const trimmedName = fullName.trim();
    const trimmedSavedName = savedName.trim();
    const hasNameChange = trimmedName !== trimmedSavedName;

    if (profileFile) {
      return true;
    }

    return trimmedName.length >= 2 && hasNameChange;
  }, [fullName, savedName, profileFile]);

  const handleNav = (label: string) => {
    const route = getTeacherSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const showApiError = (fallback: string, err: any) => {
    const apiMessage = err?.response?.data?.message;
    const apiErrors = err?.response?.data?.errors;

    let detailedMessage = apiMessage ?? fallback;
    const fallbackError = extractApiError(err);
    if (!apiMessage && typeof fallbackError === 'string' && fallbackError.trim()) {
      detailedMessage = fallbackError;
    }

    if (apiErrors && typeof apiErrors === 'object') {
      const firstErrorList = Object.values(apiErrors).find((value) => Array.isArray(value) && value.length > 0) as string[] | undefined;
      if (firstErrorList?.[0]) {
        detailedMessage = firstErrorList[0];
      }
    }

    setError(detailedMessage);
    setMessage('');
  };

  const applyCommittedUser = (userData: any) => {
    const committedName = userData?.name ?? fullName.trim();
    const committedEmail = userData?.email ?? email;
    const committedRole = userData?.role?.name ?? userData?.role ?? role;
    const committedPicture = userData?.profile_picture ?? profilePicture;

    writeStoredAuthUser({
      name: committedName,
      email: committedEmail,
      role: committedRole,
      profile_picture: committedPicture ?? null,
    });

    setFullName(committedName);
    setSavedName(committedName);
    setEmail(committedEmail);
    setRole(committedRole);
    setProfilePicture(committedPicture ?? null);
  };

  const saveProfile = async () => {
    const trimmedName = fullName.trim();

    setProfileSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      if (trimmedName.length >= 2) {
        formData.append('name', trimmedName);
      }

      if (profileFile) {
        formData.append('profile_picture', profileFile);
      }

      if (!profileFile && trimmedName.length < 2) {
        setError('Name must be at least 2 characters to update profile details.');
        return;
      }

      formData.append('_method', 'PUT');

      const updateResponse = await api.post('/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = extractApiData(updateResponse) ?? updateResponse.data;
      applyCommittedUser(updatedUser);

      setMessage('Profile updated successfully');
      setLastSavedAt(Date.now());
      setProfileFile(null);
    } catch (err) {
      showApiError('Profile update failed', err);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <DashboardLayout
      role="Teacher"
      navItems={TEACHER_NAV_ITEMS}
      activeItem="Account Settings"
      onNavChange={handleNav}
      user={{ name: savedName || 'Teacher', email: email || 'teacher@invigilore.com', initial: (savedName?.[0] ?? 'T').toUpperCase(), role: 'Teacher' }}
      pageTitle="Account Settings"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Account Settings</h2>
        <p className="text-sm text-gray-400">Manage your profile details and profile picture.</p>
      </div>

      {(error || message) && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${error ? 'border-red-500/40 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
          <AlertCircle className="h-4 w-4" />
          {error || message}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
          <div className="h-56 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
          <div className="h-56 animate-pulse rounded-xl border border-gray-800 bg-gray-900" />
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Profile Information</h3>
                <p className="text-xs text-gray-400">Update your personal details and profile picture.</p>
              </div>
              <button
                type="button"
                onClick={saveProfile}
                disabled={!canSaveProfile || profileSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-500/30 active:scale-95"
              >
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="mb-4 min-h-5">
              {profileSaving ? (
                <p className="inline-flex items-center gap-1.5 text-xs text-teal-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving your profile changes...
                </p>
              ) : lastSavedAt ? (
                <p className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved just now
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm md:col-span-1">
                <span className="mb-1 block text-gray-400">Full Name</span>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 outline-none" />
              </label>
              <label className="text-sm md:col-span-1">
                <span className="mb-1 block text-gray-400">Email</span>
                <input value={email} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
              </label>
              <label className="text-sm md:col-span-1">
                <span className="mb-1 block text-gray-400">Role</span>
                <input value={role} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
              </label>
              <label className="text-sm md:col-span-1">
                <span className="mb-1 block text-gray-400">Profile Picture</span>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-700 bg-gray-950 px-3 py-3 text-sm text-gray-300">
                  <Upload className="h-4 w-4 text-teal-300" />
                  <span>{profileFile ? profileFile.name : 'Upload a photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)} />
                </label>
                {profilePicture && <p className="mt-2 text-xs text-gray-500">Current picture: {profilePicture}</p>}
              </label>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
