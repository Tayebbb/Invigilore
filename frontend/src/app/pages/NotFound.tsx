import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <section className="max-w-lg w-full rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6">
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-gray-300">
          The page you requested does not exist or the link is outdated.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/teacher/dashboard"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
          >
            Go to Teacher Dashboard
          </Link>
          <Link
            to="/"
            className="px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-200 hover:bg-gray-800"
          >
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
