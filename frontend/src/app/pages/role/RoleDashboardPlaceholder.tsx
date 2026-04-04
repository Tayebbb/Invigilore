import { Link } from 'react-router';
import { ShieldAlert } from 'lucide-react';

interface RoleDashboardPlaceholderProps {
  roleName: string;
}

export default function RoleDashboardPlaceholder({ roleName }: RoleDashboardPlaceholderProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-3xl border border-gray-800 bg-gray-900/90 p-8 shadow-2xl shadow-black/40">
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">{roleName} Dashboard</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          This dashboard route is registered so role-based navigation remains consistent.
          The full role-specific experience can be added here without changing the shared routing contract.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link to="/login" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
            Back to Login
          </Link>
          <Link to="/" className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-gray-800 transition-colors">
            Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
