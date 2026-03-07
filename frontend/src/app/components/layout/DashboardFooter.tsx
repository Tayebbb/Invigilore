import { Shield } from 'lucide-react';

/**
 * DashboardFooter — placeholder footer shown at the bottom of every dashboard.
 *
 * TODO: replace with a full footer containing links, version, and support info
 *       once the design spec is finalised.
 */
export default function DashboardFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-800 bg-gray-900/50">
      <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Branding */}
        <div className="flex items-center gap-2 text-gray-500 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>© {year} Invigilore. All rights reserved.</span>
        </div>

        {/* Placeholder links — wire up when pages are ready */}
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <button className="hover:text-gray-400 transition-colors cursor-pointer">
            Privacy Policy
          </button>
          <button className="hover:text-gray-400 transition-colors cursor-pointer">
            Terms of Service
          </button>
          <button className="hover:text-gray-400 transition-colors cursor-pointer">
            Help &amp; Support
          </button>
        </div>
      </div>
    </footer>
  );
}
