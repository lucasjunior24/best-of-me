import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';

// ---------------------------------------------------------------------------
// Breadcrumb mapping — hierarchical
// ---------------------------------------------------------------------------

interface BreadcrumbSegment {
  label: string;
  path: string;
}

const breadcrumbMap: Record<string, BreadcrumbSegment[]> = {
  '/': [{ label: 'Início', path: '/' }],
  '/study': [
    { label: 'Início', path: '/' },
    { label: 'Dashboard', path: '/study' },
  ],
  '/study/topics': [
    { label: 'Início', path: '/' },
    { label: 'Estudos', path: '/study' },
    { label: 'Temas', path: '/study/topics' },
  ],
  '/study/calendar': [
    { label: 'Início', path: '/' },
    { label: 'Estudos', path: '/study' },
    { label: 'Calendário', path: '/study/calendar' },
  ],
  '/review': [
    { label: 'Início', path: '/' },
    { label: 'Revisões', path: '/review' },
  ],
  '/review/stats': [
    { label: 'Início', path: '/' },
    { label: 'Revisões', path: '/review' },
    { label: 'Métricas', path: '/review/stats' },
  ],
};

// Dynamic breadcrumb for /review/:reviewId — handled via useLocation matching
function buildBreadcrumb(pathname: string): BreadcrumbSegment[] {
  // Exact match
  if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];

  // Dynamic routes
  const reviewDetailMatch = pathname.match(/^\/review\/([^/]+)$/);
  if (reviewDetailMatch) {
    return [
      { label: 'Início', path: '/' },
      { label: 'Revisões', path: '/review' },
      { label: 'Detalhes', path: pathname },
    ];
  }

  // Fallback
  return [{ label: 'Best of Me', path: '/' }];
}

// ---------------------------------------------------------------------------
// Nav Items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    label: '📚 Estudos',
    path: '/study',
    activePaths: ['/study', '/study/topics', '/study/calendar'],
  },
  { label: '📝 Revisões', path: '/review', activePaths: ['/review', '/review/stats'] },
] as const;

// ---------------------------------------------------------------------------
// AppLayout
// ---------------------------------------------------------------------------

export function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const breadcrumbs = buildBreadcrumb(location.pathname);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // Erro silencioso — useAuth já trata no contexto
    }
  };

  const showBackButton = location.pathname !== '/';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Breadcrumb / Logo + Nav */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400 truncate">
                Best of Me
              </span>
            </Link>

            {/* Breadcrumb (hidden on mobile, visible on sm+) */}
            <nav className="hidden sm:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
              {breadcrumbs.map((segment, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={segment.path} className="flex items-center gap-1.5">
                    {index > 0 && <span className="text-gray-300 dark:text-gray-600">›</span>}
                    {isLast ? (
                      <span className="text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                        {segment.label}
                      </span>
                    ) : (
                      <Link
                        to={segment.path}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      >
                        {segment.label}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>

            {/* Nav links (hidden mobile) */}
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

        {/* Mobile bottom bar: back button + breadcrumb */}
        {showBackButton && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 sm:hidden">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* Global back button for non-root pages (desktop) */}
        {showBackButton && (
          <div className="mb-4 hidden sm:block">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
          </div>
        )}
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-600">
        Best of Me &copy; {new Date().getFullYear()} &mdash; Gerencie seus estudos
      </footer>
    </div>
  );
}
