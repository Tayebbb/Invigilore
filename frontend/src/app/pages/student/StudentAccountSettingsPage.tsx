import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, Lock, Save, ShieldCheck, Upload } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../api';
import { extractApiData, extractApiError } from '../../utils/apiHelpers';
import { STUDENT_NAV_ITEMS, getStudentSidebarRoute } from '../../navigation/studentNavigation';
import { writeStoredAuthUser } from '../../utils/authUser';
import { resolveProfileImageUrl } from '../../utils/profileImage';

function pickProfilePicture(user: any): string | null {
  return user?.profile_picture ?? user?.profile?.profile_picture ?? null;
}

export default function StudentAccountSettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [restrictLoginToOneDevice, setRestrictLoginToOneDevice] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationSms, setNotificationSms] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await api.get('/student/account-settings');
        const data = extractApiData(response) ?? response.data?.data;

        setFullName(data?.profile?.name ?? '');
        setEmail(data?.profile?.email ?? '');
        setRole(data?.profile?.role ?? 'student');
        setProfilePicture(pickProfilePicture(data));
        setRestrictLoginToOneDevice(Boolean(data?.security?.restrict_login_to_one_device));
        setNotificationEmail(Boolean(data?.preferences?.notification_preferences?.email ?? true));
        setNotificationSms(Boolean(data?.preferences?.notification_preferences?.sms ?? false));
        setTheme((data?.preferences?.theme ?? 'dark') as 'light' | 'dark');
      } catch (err: any) {
        setError(extractApiError(err) || 'Unable to load account settings');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const canSaveProfile = useMemo(() => {
    if (profileFile) {
      return true;
    }

    return fullName.trim().length >= 2;
  }, [fullName, profileFile]);

  const handleNav = (label: string) => {
    const route = getStudentSidebarRoute(label);
    if (route) {
      navigate(route);
    }
  };

  const showApiError = (fallback: string, err: any) => {
    const apiMessage = err?.response?.data?.message;
    const apiErrors = err?.response?.data?.errors;

    let detailedMessage = apiMessage ?? fallback;
    if (apiErrors && typeof apiErrors === 'object') {
      const firstErrorList = Object.values(apiErrors).find((value) => Array.isArray(value) && value.length > 0) as string[] | undefined;
      if (firstErrorList?.[0]) {
        detailedMessage = firstErrorList[0];
      }
    }

    setError(detailedMessage);
    setMessage('');
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      const trimmedName = fullName.trim();
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

      await api.put('/student/account-settings/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const meResponse = await api.get('/me');
      const meData = extractApiData(meResponse) ?? meResponse.data;
      writeStoredAuthUser({
        name: meData?.name ?? fullName,
        email: meData?.email ?? email,
        role: meData?.role?.name ?? meData?.role ?? role,
        profile_picture: pickProfilePicture(meData),
      });
      setProfilePicture(pickProfilePicture(meData));
      setFullName(meData?.name ?? fullName);
      setLastSavedAt(Date.now());

      setMessage('Profile updated successfully');
      setProfileFile(null);
    } catch (err) {
      showApiError('Profile update failed', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const pictureUrl = resolveProfileImageUrl(profilePicture, api.defaults.baseURL?.toString());
  const avatarLetter = (fullName?.trim()?.[0] ?? 'S').toUpperCase();

  const savePassword = async () => {
    setPasswordSaving(true);
    setError('');
    setMessage('');

    try {
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match');
        return;
      }

      await api.put('/student/account-settings/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully');
    } catch (err) {
      showApiError('Password change failed', err);
    } finally {
      setPasswordSaving(false);
    }
  };

  const savePreferences = async () => {
    setPreferencesSaving(true);
    setError('');
    setMessage('');

    try {
      await api.put('/student/account-settings/preferences', {
        restrict_login_to_one_device: restrictLoginToOneDevice,
        notification_preferences: {
          email: notificationEmail,
          sms: notificationSms,
        },
        theme,
      });

      setMessage('Preferences saved successfully');
    } catch (err) {
      showApiError('Preferences update failed', err);
    } finally {
      setPreferencesSaving(false);
    }
  };


  return (
    <DashboardLayout
      role="Student"
      navItems={STUDENT_NAV_ITEMS}
      activeItem="Account Settings"
      onNavChange={handleNav}
      user={{ name: fullName || 'Student', email: email || 'student@invigilore.com', initial: (fullName?.[0] ?? 'S').toUpperCase(), role: 'Student' }}
      pageTitle="Account Settings"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Account Settings</h2>
        <p className="text-sm text-gray-400">Manage profile, password, and security preferences.</p>
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
              <button type="button" onClick={saveProfile} disabled={!canSaveProfile || profileSaving} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                <Save className="h-4 w-4" />
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            <div className="mb-4 flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-950 p-4">
              {pictureUrl ? (
                <img
                  src={pictureUrl}
                  alt={`${fullName || 'Student'} profile`}
                  className="h-14 w-14 rounded-2xl border border-gray-700 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-lg font-bold text-white">
                  {avatarLetter}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{fullName || 'Student'}</p>
                <p className="text-xs text-gray-400">{email || 'student@invigilore.com'}</p>
                <p className="mt-1 text-xs text-gray-500">Upload a square image for best results.</p>
              </div>
            </div>

            <div className="mb-4 min-h-5">
              {profileSaving ? (
                <p className="text-xs text-teal-300">Saving your profile changes...</p>
              ) : lastSavedAt ? (
                <p className="text-xs text-emerald-300">Saved just now</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-sm md:col-span-1">
                <span className="mb-1 block text-gray-400">Full Name</span>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 outline-none" />
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
              <label className="text-sm">
                <span className="mb-1 block text-gray-400">Email</span>
                <input value={email} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-400">Role</span>
                <input value={role} disabled className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-gray-400" />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Password & Security</h3>
                <p className="text-xs text-gray-400">Change your password and toggle security restrictions.</p>
              </div>
              <button type="button" onClick={savePassword} disabled={!currentPassword || !newPassword || !confirmPassword || passwordSaving} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                <ShieldCheck className="h-4 w-4" />
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block text-gray-400">Current Password</span>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 outline-none" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-400">New Password</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 outline-none" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-400">Confirm Password</span>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 outline-none" />
              </label>
            </div>

            <div className="mt-5 rounded-xl border border-gray-800 bg-gray-950 p-4">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">Restrict login to one device</p>
                  <p className="text-xs text-gray-500">UI ready now; backend support is integrated.</p>
                </div>
                <input type="checkbox" checked={restrictLoginToOneDevice} onChange={(e) => setRestrictLoginToOneDevice(e.target.checked)} className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-teal-500" />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Account Preferences</h3>
                <p className="text-xs text-gray-400">Set notifications and theme behavior.</p>
              </div>
              <button type="button" onClick={savePreferences} disabled={preferencesSaving} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                <Save className="h-4 w-4" />
                {preferencesSaving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                <p className="text-sm font-medium text-white">Notification Preferences</p>
                <div className="mt-3 space-y-3 text-sm text-gray-300">
                  <label className="flex items-center justify-between">
                    <span>Email notifications</span>
                    <input type="checkbox" checked={notificationEmail} onChange={(e) => setNotificationEmail(e.target.checked)} />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>SMS notifications</span>
                    <input type="checkbox" checked={notificationSms} onChange={(e) => setNotificationSms(e.target.checked)} />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                <p className="text-sm font-medium text-white">Theme Selection</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setTheme('light')} className={`rounded-lg px-3 py-2 text-sm ${theme === 'light' ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                    Light
                  </button>
                  <button type="button" onClick={() => setTheme('dark')} className={`rounded-lg px-3 py-2 text-sm ${theme === 'dark' ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
