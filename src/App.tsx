import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './presentation/context/AuthContext';
import { ProtectedRoute } from './presentation/components/layout/ProtectedRoute';
import { AppLayout } from './presentation/components/layout/AppLayout';
import { LoginPage } from './presentation/pages/LoginPage';
import { HomePage } from './presentation/pages/HomePage';
import { StudyOverviewPage } from './presentation/pages/study/StudyOverviewPage';
import { StudyTopicsPage } from './presentation/pages/study/StudyTopicsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/study" element={<StudyOverviewPage />} />
            <Route path="/study/topics" element={<StudyTopicsPage />} />
            <Route
              path="/study/calendar"
              element={<div className="py-20 text-center text-gray-500">Calendário — Sprint 7</div>}
            />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
