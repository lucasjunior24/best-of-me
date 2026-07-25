import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './presentation/context/AuthContext';
import { ProtectedRoute } from './presentation/components/layout/ProtectedRoute';
import { LoginPage } from './presentation/pages/LoginPage';

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-brand-600 dark:text-brand-400">Best of Me</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Gerencie seus estudos e alcance seus objetivos
        </p>
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          Sprint 1 — Setup do Projeto concluído 🚀
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
