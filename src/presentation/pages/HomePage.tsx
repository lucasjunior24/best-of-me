import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-2xl text-center">
        {/* Saudação */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
          Olá, {user?.displayName?.split(' ')[0] || 'usuário'}!
        </h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400">O que você deseja gerenciar hoje?</p>

        {/* Grid de cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {/* Card Estudos */}
          <Link
            to="/study"
            className="group rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl dark:bg-blue-900/50">
                📚
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Estudos</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie seus temas e acompanhe o progresso
                </p>
              </div>
            </div>
          </Link>

          {/* Card Academia (desabilitado) */}
          <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-6 text-left opacity-60 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl dark:bg-orange-900/50">
                🏋️
              </span>
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-400">Academia</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Gerencie seus treinos e exercícios
                </p>
              </div>
            </div>
            {/* Badge "Em breve" */}
            <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
              Em breve
            </span>
          </div>
        </div>

        <p className="mt-8 text-xs text-gray-400 dark:text-gray-600">
          Best of Me — Sprint 5 UI Básica concluído 🚀
        </p>
      </div>
    </div>
  );
}
