import { useEffect, useCallback, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { useReviewStats } from '../../hooks/useReviewStats';
import { useReviews } from '../../hooks/useReviews';
import { useSharedReviewStats } from '../../hooks/useSharedReviewStats';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import type { ReviewStats, ReviewStatsData } from '../../../core/entities/ProgressData';
import type { SharedReviewStats } from '../../../core/useCases/GetSharedReviewStatsUseCase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// T15.5 — ReviewTrendIndicator
// ---------------------------------------------------------------------------

function ReviewTrendIndicator({ accuracies }: { accuracies: number[] }) {
  const trend = useMemo(() => {
    if (accuracies.length < 2)
      return { direction: 'stable', label: 'Estável', icon: '➡️', color: 'text-yellow-500' };

    const half = Math.ceil(accuracies.length / 2);
    const firstHalf = accuracies.slice(0, half);
    const secondHalf = accuracies.slice(-half);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;

    if (diff > 5)
      return { direction: 'up', label: 'Melhorando', icon: '📈', color: 'text-green-500' };
    if (diff < -5) return { direction: 'down', label: 'Caindo', icon: '📉', color: 'text-red-500' };
    return { direction: 'stable', label: 'Estável', icon: '➡️', color: 'text-yellow-500' };
  }, [accuracies]);

  return (
    <span className={twMerge('inline-flex items-center gap-1 text-xs font-medium', trend.color)}>
      <span>{trend.icon}</span>
      <span>{trend.label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// T15.2 — ReviewComparisonCard
// ---------------------------------------------------------------------------

function ReviewComparisonCard({ stats }: { stats: ReviewStats }) {
  const questionnaireAccuracies = useMemo(
    () =>
      stats.questionnaires
        .filter((q) => q.totalQuestions > 0)
        .map((q) => Math.round((q.correctAnswers / q.totalQuestions) * 100)),
    [stats.questionnaires],
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header com cor e nome */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: stats.reviewColor }}
        />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          {stats.reviewName}
        </h3>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Média de acertos */}
        <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Média de acertos</p>
          <p className="text-xl font-bold text-brand-600 dark:text-brand-400">
            {stats.averageAccuracy.toFixed(0)}%
          </p>
        </div>

        {/* Progresso */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Progresso</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats.completionPercentage.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Barras de progresso simples */}
      <div className="space-y-3">
        {/* Barra de conclusão */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Conclusão</span>
            <span>
              {stats.completedReviews}/{stats.totalReviews}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(stats.completionPercentage, 100)}%`,
                backgroundColor: stats.reviewColor,
              }}
            />
          </div>
        </div>

        {/* Barra de acertos (média) */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Acertos</span>
            <span>
              {stats.totalCorrectAnswers}/{stats.totalQuestionsAnswered}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-green-500"
              style={{ width: `${Math.min(stats.averageAccuracy, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trend indicator */}
      {questionnaireAccuracies.length >= 2 && (
        <div className="mt-4 flex items-center justify-end">
          <ReviewTrendIndicator accuracies={questionnaireAccuracies} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// T15.3 — ReviewAccuracyChart (gráfico horizontal CSS)
// ---------------------------------------------------------------------------

function ReviewAccuracyChart({ byReview }: { byReview: ReviewStats[] }) {
  if (byReview.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Comparação de Revisões
      </h3>
      <div className="space-y-4">
        {byReview.map((stat) => (
          <div key={stat.reviewId} className="space-y-1.5">
            {/* Nome da revisão */}
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: stat.reviewColor }}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {stat.reviewName}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                {stat.averageAccuracy.toFixed(0)}%
              </span>
            </div>

            {/* Barra de acertos */}
            <div className="h-5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-1.5"
                style={{
                  width: `${Math.max(stat.averageAccuracy, 2)}%`,
                  backgroundColor: stat.reviewColor,
                  opacity: 0.85,
                }}
              >
                {stat.averageAccuracy > 15 && (
                  <span className="text-[10px] font-bold text-white">
                    {stat.averageAccuracy.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* Barra de conclusão (mais fina, abaixo) */}
            <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(stat.completionPercentage, 1)}%`,
                  backgroundColor: stat.reviewColor,
                  opacity: 0.4,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {stat.completedReviews}/{stat.totalReviews} concluídas
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {stat.completionPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// T15.4 — ReviewTimeline (para uma revisão selecionada)
// ---------------------------------------------------------------------------

function ReviewTimeline({
  stats,
  onSelectReview,
}: {
  stats: ReviewStatsData;
  onSelectReview: (reviewId: string | undefined) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedStats = useMemo(
    () => stats.byReview.find((r) => r.reviewId === selectedId) || null,
    [stats, selectedId],
  );

  const selectedReview = selectedStats ?? (stats.byReview.length === 1 ? stats.byReview[0] : null);
  const questionnaires = selectedReview?.questionnaires ?? [];

  const accuracies = useMemo(
    () =>
      questionnaires
        .filter((q) => q.totalQuestions > 0)
        .map((q) => Math.round((q.correctAnswers / q.totalQuestions) * 100)),
    [questionnaires],
  );

  if (stats.byReview.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Selecione uma revisão para ver a timeline
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Evolução das Revisões
        </h3>
        {stats.byReview.length > 1 && (
          <select
            value={selectedId || ''}
            onChange={(e) => {
              const val = e.target.value || null;
              setSelectedId(val);
              onSelectReview(val || undefined);
            }}
            className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-gray-700 dark:text-gray-300"
          >
            <option value="">Todas</option>
            {stats.byReview.map((r) => (
              <option key={r.reviewId} value={r.reviewId}>
                {r.reviewName}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedReview && questionnaires.length > 0 ? (
        <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-5">
          {/* Trend indicator global */}
          {accuracies.length >= 2 && (
            <div className="mb-2 -ml-6 pl-6 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Tendência:</span>
              <ReviewTrendIndicator accuracies={accuracies} />
            </div>
          )}

          {questionnaires.map((q, index) => {
            const qAccuracy =
              q.totalQuestions > 0 ? Math.round((q.correctAnswers / q.totalQuestions) * 100) : 0;
            const isToday = q.date === new Date().toISOString().split('T')[0];

            return (
              <div key={q.id || q.date} className="relative">
                {/* Dot na timeline */}
                <div
                  className={twMerge(
                    'absolute -left-[25px] w-3 h-3 rounded-full border-2 border-white dark:border-gray-900',
                    qAccuracy >= 70
                      ? 'bg-green-500'
                      : qAccuracy >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500',
                  )}
                  style={{ backgroundColor: selectedReview.reviewColor }}
                />

                {/* Card do questionário */}
                <div
                  className={twMerge(
                    'rounded-lg border p-3',
                    isToday && 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-800',
                    'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {formatLongDate(q.date)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {index + 1}ª revisão
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {q.correctAnswers}/{q.totalQuestions} acertos
                        </span>
                        <span
                          className={twMerge(
                            'text-xs font-bold',
                            qAccuracy >= 70
                              ? 'text-green-600 dark:text-green-400'
                              : qAccuracy >= 40
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400',
                          )}
                        >
                          {qAccuracy}%
                        </span>
                      </div>
                    </div>
                    {/* Mini barra de progresso */}
                    <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(qAccuracy, 2)}%`,
                          backgroundColor: selectedReview.reviewColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          {selectedReview
            ? 'Nenhum questionário registrado para esta revisão.'
            : 'Selecione uma revisão para visualizar a timeline.'}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Circular Progress Bar (para indicadores gerais)
// ---------------------------------------------------------------------------

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 6,
  color = '#6366f1',
  label,
  sublabel,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
        {label}
      </span>
      {sublabel && <span className="text-xs text-gray-400 dark:text-gray-500">{sublabel}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// T15.7 — Export CSV helper
// ---------------------------------------------------------------------------

function generateCSV(stats: ReviewStatsData): string {
  const headers = ['Revisão', 'Data', 'Total de Questões', 'Acertos', '% Aproveitamento'];
  const rows: string[][] = [];

  for (const review of stats.byReview) {
    for (const q of review.questionnaires) {
      const accuracy =
        q.totalQuestions > 0 ? Math.round((q.correctAnswers / q.totalQuestions) * 100) : 0;
      rows.push([
        review.reviewName,
        q.date,
        String(q.totalQuestions),
        String(q.correctAnswers),
        `${accuracy}%`,
      ]);
    }
  }

  if (rows.length === 0) {
    rows.push(['Nenhum questionário registrado', '', '', '', '']);
  }

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return csvContent;
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Overall cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="mb-6 h-32 w-32 text-gray-300 dark:text-gray-600"
        viewBox="0 0 128 128"
        fill="none"
      >
        <rect x="20" y="24" width="88" height="72" rx="8" stroke="currentColor" strokeWidth="3" />
        <line
          x1="28"
          y1="44"
          x2="76"
          y2="44"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="56"
          x2="100"
          y2="56"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="68"
          x2="64"
          y2="68"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M52 36L64 24L76 36"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="90" y="20" width="20" height="20" rx="4" fill="currentColor" opacity="0.15" />
        <text
          x="100"
          y="35"
          textAnchor="middle"
          fontSize="16"
          fill="currentColor"
          fontWeight="bold"
        >
          ↑
        </text>
      </svg>
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Nenhuma métrica disponível
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Registre questionários nas suas revisões para ver as métricas de desempenho aqui.
      </p>
      <Link to="/review">
        <Button>Gerenciar revisões</Button>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Erro ao carregar métricas
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// T15.1 — ReviewStatsPage
// ---------------------------------------------------------------------------

export function ReviewStatsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, loading, error, loadStats, filterByReview } = useReviewStats();
  const { reviews } = useReviews();

  // Carregar reviews para os chips de filtro
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const { loadReviews } = useReviews();

  // T33.5 — Shared review stats hook
  const { sharedStatsMap, loading: sharedStatsLoading, loadSharedStats } = useSharedReviewStats();

  const fetchAll = useCallback(() => {
    if (user) {
      loadStats(user.id);
      if (!reviewsLoaded) {
        loadReviews(user.id);
        setReviewsLoaded(true);
      }
    }
  }, [user, loadStats, loadReviews, reviewsLoaded]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // T33.5 — Carregar métricas compartilhadas após reviews carregarem
  useEffect(() => {
    if (user && reviews.length > 0) {
      loadSharedStats(user.id, reviews);
    }
  }, [user, reviews, loadSharedStats]);

  // Filtrar apenas revisões compartilhadas
  const sharedReviews = useMemo(
    () => reviews.filter((r) => r.isShared || (r.sharedWith && r.sharedWith.length > 0)),
    [reviews],
  );

  // T15.6 — Filtro multi-select por revisão
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);

  const toggleReviewFilter = useCallback((reviewId: string) => {
    setSelectedReviewIds((prev) => {
      const next = prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId];
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedReviewIds([]);
  }, []);

  // Recalcular métricas quando filtro muda
  useEffect(() => {
    if (user && reviewsLoaded) {
      filterByReview(user.id, selectedReviewIds);
    }
  }, [selectedReviewIds, user, reviewsLoaded, filterByReview]);

  // Export CSV handler
  const handleExportCSV = useCallback(() => {
    if (!stats) return;
    const csv = generateCSV(stats);
    downloadCSV(csv, 'revisoes_metricas.csv');
  }, [stats]);

  // ---- Shared Review Comparison Card (T33.5) ----
  function SharedReviewComparisonCard({ sharedStats: s }: { sharedStats: SharedReviewStats }) {
    return (
      <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm dark:border-purple-800 dark:bg-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: s.reviewColor }}
          />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {s.reviewName}
          </h3>
          <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
            🤝 Compartilhada
          </span>
        </div>

        {/* Tabela comparativa: Você vs Parceiro */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                  Indicador
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400">
                  Você
                </th>
                <th className="px-3 py-2 text-center font-medium text-gray-500 dark:text-gray-400">
                  {s.partnerStats.email}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Conclusão</td>
                <td className="px-3 py-2 text-center font-semibold text-brand-600 dark:text-brand-400">
                  {s.myStats.percentage}%
                </td>
                <td className="px-3 py-2 text-center font-semibold text-blue-600 dark:text-blue-400">
                  {s.partnerStats.percentage}%
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Acurácia</td>
                <td className="px-3 py-2 text-center font-semibold text-brand-600 dark:text-brand-400">
                  {s.myStats.averageAccuracy}%
                </td>
                <td className="px-3 py-2 text-center font-semibold text-blue-600 dark:text-blue-400">
                  {s.partnerStats.averageAccuracy}%
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Completude</td>
                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                  {s.myStats.completedReviews}/{s.myStats.totalReviews}
                </td>
                <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                  {s.partnerStats.completedReviews}/{s.partnerStats.totalReviews}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Combinado</td>
                <td
                  colSpan={2}
                  className="px-3 py-2 text-center font-semibold text-purple-600 dark:text-purple-400"
                >
                  {s.combinedStats.percentage}% conclusão · {s.combinedStats.averageAccuracy}%
                  acurácia
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Indicador visual de quem está mais adiantado */}
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          {s.myStats.percentage > s.partnerStats.percentage ? (
            <span className="text-green-600 dark:text-green-400">🏆 Você está na frente!</span>
          ) : s.partnerStats.percentage > s.myStats.percentage ? (
            <span className="text-blue-600 dark:text-blue-400">
              👤 {s.partnerStats.email} está na frente
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">🤝 Empate!</span>
          )}
        </div>
      </div>
    );
  }

  // ---- Loading State ----
  if (loading && !stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
        </div>
        <StatsSkeleton />
      </div>
    );
  }

  // ---- Error State ----
  if (error && !stats) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ErrorState message={error} onRetry={fetchAll} />
      </div>
    );
  }

  // ---- Empty State ----
  if (!stats || stats.byReview.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState />
      </div>
    );
  }

  const hasQuestionnaires = stats.byReview.some((r) => r.questionnaires.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => navigate('/review')}
              className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              ← Revisões
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Métricas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe seu desempenho nas revisões espaçadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            📥 Exportar CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/review')}>
            Gerenciar revisões
          </Button>
        </div>
      </div>

      {/* T15.1 — Cards de indicadores gerais */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Média geral de acertos */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col items-center">
          <CircularProgress
            percentage={stats.overallAverageAccuracy}
            color="#6366f1"
            label="Média de acertos"
          />
        </div>

        {/* Total de revisões concluídas */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col items-center">
          <CircularProgress
            percentage={stats.overallCompletionPercentage}
            color="#f59e0b"
            label="Conclusão"
            sublabel={`${stats.byReview.reduce((sum, r) => sum + r.completedReviews, 0)}/${stats.byReview.reduce((sum, r) => sum + r.totalReviews, 0)} revisões`}
          />
        </div>

        {/* Total de questões resolvidas */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.byReview.reduce((sum, r) => sum + r.totalQuestionsAnswered, 0)}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
            Total de questões
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {stats.byReview.reduce((sum, r) => sum + r.totalCorrectAnswers, 0)} acertos
          </p>
        </div>

        {/* Média de questões por revisão */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {(() => {
              const totalQuestionnaires = stats.byReview.reduce(
                (sum, r) => sum + r.questionnaires.length,
                0,
              );
              const totalQuestions = stats.byReview.reduce(
                (sum, r) => sum + r.totalQuestionsAnswered,
                0,
              );
              return totalQuestionnaires > 0 ? Math.round(totalQuestions / totalQuestionnaires) : 0;
            })()}
          </p>
          <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
            Média de questões
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">por revisão</p>
        </div>
      </div>

      {/* T15.6 — Chips de filtro por revisão */}
      {reviews.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className={twMerge(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              selectedReviewIds.length === 0
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
            )}
          >
            Todas
          </button>
          {reviews.map((review) => (
            <button
              key={review.id}
              type="button"
              onClick={() => toggleReviewFilter(review.id)}
              className={twMerge(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors flex items-center gap-1.5',
                selectedReviewIds.length === 0 || selectedReviewIds.includes(review.id)
                  ? 'ring-1 ring-inset'
                  : 'opacity-50 hover:opacity-80',
              )}
              style={{
                backgroundColor:
                  selectedReviewIds.length === 0 || selectedReviewIds.includes(review.id)
                    ? `${review.color}20`
                    : 'transparent',
                color: review.color,
                borderColor: review.color,
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: review.color }} />
              {review.name}
            </button>
          ))}
        </div>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna esquerda: Comparison Cards + Chart */}
        <div className="space-y-6">
          {/* T15.2 — Comparison Cards */}
          {hasQuestionnaires ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.byReview.map((reviewStat) => (
                <ReviewComparisonCard key={reviewStat.reviewId} stats={reviewStat} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Registre questionários para ver a comparação entre revisões.
              </p>
            </div>
          )}

          {/* T15.3 — Accuracy Chart */}
          {hasQuestionnaires && <ReviewAccuracyChart byReview={stats.byReview} />}
        </div>

        {/* Coluna direita: Timeline */}
        <div>
          {/* T15.4 — ReviewTimeline */}
          <ReviewTimeline
            stats={stats}
            onSelectReview={() => {
              // Já tratado internamente no componente
            }}
          />
        </div>
      </div>

      {/* T33.5 — Seção de Comparação Compartilhada */}
      {sharedReviews.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            🤝 Revisões Compartilhadas
          </h2>
          {sharedStatsLoading && sharedStatsMap.size === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sharedReviews.map((review) => {
                const sharedStats = sharedStatsMap.get(review.id);
                if (!sharedStats) {
                  return (
                    <div
                      key={review.id}
                      className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center py-8"
                    >
                      <Spinner size="sm" />
                    </div>
                  );
                }
                return <SharedReviewComparisonCard key={review.id} sharedStats={sharedStats} />;
              })}
            </div>
          )}
        </div>
      )}

      {/* Loading overlay para refetch */}
      {loading && stats && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="rounded-full bg-white dark:bg-gray-800 shadow-lg p-3 border border-gray-200 dark:border-gray-700">
            <Spinner size="sm" />
          </div>
        </div>
      )}
    </div>
  );
}
