import { Link, isRouteErrorResponse, useRouteError } from 'react-router';

export default function RouteErrorBoundary() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while loading this page.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = typeof error.data === 'string' && error.data.trim()
      ? error.data
      : 'The page could not be loaded. Please try again.';
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <section className="max-w-lg w-full rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-gray-300">{message}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/teacher/dashboard"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
          >
            Go to Dashboard
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
