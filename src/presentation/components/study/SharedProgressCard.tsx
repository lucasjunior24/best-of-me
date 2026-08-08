import { twMerge } from 'tailwind-merge';
import type { SharedTopicProgress } from '../../../core/useCases/GetSharedStudyProgressUseCase';

export interface SharedProgressCardProps {
  topicId: string;
  topicName: string;
  topicColor: string;
  myProgress: SharedTopicProgress['myProgress'];
  partnerProgress: SharedTopicProgress['partnerProgress'];
  combinedProgress: SharedTopicProgress['combinedProgress'];
  className?: string;
}

export function SharedProgressCard({
  topicName,
  topicColor,
  myProgress,
  partnerProgress,
  combinedProgress,
  className,
}: SharedProgressCardProps) {
  return (
    <div
      className={twMerge(
        'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: topicColor }}
        />
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {topicName}
        </h4>
        <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          🤝 Compartilhado
        </span>
      </div>

      {/* Colunas lado a lado: Você vs Parceiro */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Seu progresso */}
        <div className="rounded-lg bg-brand-50 p-3 dark:bg-brand-900/20">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Você
          </p>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
            {myProgress.percentage}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {myProgress.completedSessions}/{myProgress.totalSessions} dias
          </p>
          {/* Mini barra */}
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(myProgress.percentage, 100)}%`,
                backgroundColor: topicColor,
              }}
            />
          </div>
        </div>

        {/* Progresso do parceiro */}
        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            👤 {partnerProgress.email}
          </p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {partnerProgress.percentage}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {partnerProgress.completedSessions}/{partnerProgress.totalSessions} dias
          </p>
          {/* Mini barra */}
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(partnerProgress.percentage, 100)}%`,
                backgroundColor: '#3b82f6',
              }}
            />
          </div>
        </div>
      </div>

      {/* Barra combinada */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">🤝 Progresso combinado</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {combinedProgress.percentage}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          {/* Stacked bar: seu progresso + parceiro */}
          <div className="flex h-full">
            <div
              className="h-full transition-all duration-500 rounded-l-full"
              style={{
                width: `${myProgress.totalSessions > 0 ? (myProgress.completedSessions / combinedProgress.totalSessions) * 100 : 0}%`,
                backgroundColor: topicColor,
              }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${partnerProgress.totalSessions > 0 ? (partnerProgress.completedSessions / combinedProgress.totalSessions) * 100 : 0}%`,
                backgroundColor: '#3b82f6',
              }}
            />
            <div
              className="h-full rounded-r-full bg-gray-200 dark:bg-gray-700"
              style={{
                flex: 1,
              }}
            />
          </div>
        </div>
        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
          {combinedProgress.completedSessions}/{combinedProgress.totalSessions} datas concluídas por
          pelo menos um
        </p>
      </div>
    </div>
  );
}
