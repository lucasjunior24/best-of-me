import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './presentation/context/ThemeContext';
import { AuthProvider } from './presentation/context/AuthContext';
import { ProtectedRoute } from './presentation/components/layout/ProtectedRoute';
import { AppLayout } from './presentation/components/layout/AppLayout';
import { Spinner } from './presentation/components/ui/Spinner';

// Lazy-loaded pages para code splitting automático via Vite
const LoginPage = lazy(() =>
  import('./presentation/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const HomePage = lazy(() =>
  import('./presentation/pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const StudyOverviewPage = lazy(() =>
  import('./presentation/pages/study/StudyOverviewPage').then((m) => ({
    default: m.StudyOverviewPage,
  })),
);
const StudyTopicsPage = lazy(() =>
  import('./presentation/pages/study/StudyTopicsPage').then((m) => ({
    default: m.StudyTopicsPage,
  })),
);
const StudyCalendarPage = lazy(() =>
  import('./presentation/pages/study/StudyCalendarPage').then((m) => ({
    default: m.StudyCalendarPage,
  })),
);
const ReviewListPage = lazy(() =>
  import('./presentation/pages/review/ReviewListPage').then((m) => ({
    default: m.ReviewListPage,
  })),
);
const ReviewDetailPage = lazy(() =>
  import('./presentation/pages/review/ReviewDetailPage').then((m) => ({
    default: m.ReviewDetailPage,
  })),
);
const ReviewStatsPage = lazy(() =>
  import('./presentation/pages/review/ReviewStatsPage').then((m) => ({
    default: m.ReviewStatsPage,
  })),
);
const SummaryListPage = lazy(() =>
  import('./presentation/pages/summary/SummaryListPage').then((m) => ({
    default: m.SummaryListPage,
  })),
);
const SummaryDetailPage = lazy(() =>
  import('./presentation/pages/summary/SummaryDetailPage').then((m) => ({
    default: m.SummaryDetailPage,
  })),
);

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/study" element={<StudyOverviewPage />} />
                <Route path="/study/topics" element={<StudyTopicsPage />} />
                <Route path="/study/calendar" element={<StudyCalendarPage />} />
                <Route path="/review" element={<ReviewListPage />} />
                <Route path="/review/stats" element={<ReviewStatsPage />} />
                <Route path="/review/:reviewId" element={<ReviewDetailPage />} />
                <Route path="/summary" element={<SummaryListPage />} />
                <Route path="/summary/:summaryId" element={<SummaryDetailPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
