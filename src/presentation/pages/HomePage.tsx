import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@presentation/components/ui/Button';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Saudação compacta */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Olá, {user?.displayName?.split(' ')[0] || 'usuário'}!
        </h1>
        <Link to="/study/calendar">
          <Button variant="primary" size="sm">
            Ver Calendário
          </Button>
        </Link>
      </div>

      {/* Calendário unificado */}

      {/* Mini-cards de atalho */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/study"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg dark:bg-blue-900/50">
            📚
          </span>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Gerenciar Estudo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Crie e organize seus temas de estudo
            </p>
          </div>
        </Link>

        <Link
          to="/review"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-purple-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-700"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-lg dark:bg-purple-900/50">
            📝
          </span>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Gerenciar Revisões</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Revisões espaçadas com métricas de acertos
            </p>
          </div>
        </Link>

        {/* Card Academia (desabilitado) */}
        <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-60 dark:border-gray-800 dark:bg-gray-900/50">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-lg dark:bg-orange-900/50">
            🏋️
          </span>
          <div>
            <h3 className="font-medium text-gray-700 dark:text-gray-400">Academia</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Gerencie seus treinos e exercícios
            </p>
          </div>
          <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
            Em breve
          </span>
        </div>
      </div>
    </div>
  );
}
