import { Outlet, Link, useLocation } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';

const routeLabels: Record<string, string> = {
  '/': 'Início',
  '/study': 'Dashboard',
  '/study/topics': 'Temas',
  '/study/calendar': 'Calendário',
  '/review': 'Revisões',
  '/review/stats': 'Métricas',
};

const NAV_ITEMS = [
  {
    label: '📚 Estudos',
    path: '/study',
    activePaths: ['/study', '/study/topics', '/study/calendar'],
  },
  { label: '📝 Revisões', path: '/review', activePaths: ['/review', '/review/stats'] },
] as const;

export function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const currentLabel = routeLabels[location.pathname] || 'Best of Me';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Erro silencioso — useAuth já trata no contexto
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Breadcrumb / Logo + Nav */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400 truncate">
                Best of Me
              </span>
            </Link>
            <span className="hidden text-sm text-gray-400 dark:text-gray-500 sm:block">/</span>
            <span className="hidden text-sm text-gray-500 dark:text-gray-400 sm:block truncate">
              {currentLabel}
            </span>
            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1 ml-4">
              {NAV_ITEMS.map((item) => {
                const isActive = item.activePaths.some(
                  (p) => location.pathname === p || location.pathname.startsWith(p + '/'),
                );
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={twMerge(
                      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user && (
              <>
                {/* Avatar */}
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                    {user.displayName?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}

                {/* User name (hidden on mobile) */}
                <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block truncate max-w-[120px]">
                  {user.displayName}
                </span>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label="Sair"
                  title="Sair"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-600">
        Best of Me &copy; {new Date().getFullYear()} &mdash; Gerencie seus estudos
      </footer>
    </div>
  );
}
