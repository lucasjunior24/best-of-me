import { Routes, Route } from 'react-router-dom';

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

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Best of Me</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Faça login para continuar</p>
        <div className="mt-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-12">
          <p className="text-sm text-gray-500 dark:text-gray-500">[Login com Google — Sprint 2]</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default App;
