import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logUserActivity } from "@/services/loggerService";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );

    logUserActivity({
      eventName: 'page_not_found',
      eventType: 'error',
      pageRoute: location.pathname,
      success: false,
      errorDetails: `404 Not Found route: ${location.pathname}`
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center p-8 rounded-2xl bg-slate-900 border border-slate-800 max-w-md">
        <h1 className="text-5xl font-extrabold text-rose-500 mb-2">404</h1>
        <p className="text-lg font-bold text-white mb-2">Page Not Found</p>
        <p className="text-xs text-slate-400 mb-6">The path "{location.pathname}" does not exist in RIPPLE.</p>
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-950"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;