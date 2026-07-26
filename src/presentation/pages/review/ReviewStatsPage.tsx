import { useEffect, useCallback, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../hooks/useAuth';
import { useReviewStats } from '../../hooks/useReviewStats';
import { useReviews } from '../../hooks/useReviews';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import type { ReviewStats, ReviewStatsData } from '../../../core/entities/ProgressData';
import type { ReviewQuestionnaire } from '../../../core/entities/ReviewQuestionnaire';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

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
    if (accuracies.length < 2) return { direction: 'stable', label: 'Estável', icon: '➡️', color: 'text-yellow-500' };

    const half = Math.ceil(accuracies.length / 2);
    const firstHalf = accuracies.slice(0, half);
    const secondHalf = accuracies.slice(-half);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = secondAvg - firstAvg;

    if (diff > 5) return { direction: 'up', label: 'Melhorando', icon: '📈', color: 'text-green-500' };
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
              q.totalQuestions > 0
                ? Math.round((q.correctAnswers / q.totalQuestions) * 100)
                : 0;
            const isToday = q.date === new Date().toISOString().split('T')[0];

            return (
              <div key={q.id || q.date} className="relative">
                {/* Dot na timeline */}
                <div
                  className={twMerge(
