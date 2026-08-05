import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudyTopics } from '../../hooks/useStudyTopics';
import { useSharing } from '../../hooks/useSharing';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TopicFormModal } from '../../components/study/TopicFormModal';
import { ShareTopicModal } from '../../components/study/ShareTopicModal';
import { formatHours } from '../../components/ui/TimeInput';
import { ConfirmDeleteModal } from '../../components/study/ConfirmDeleteModal';
import type { StudyTopic } from '../../../core/entities/StudyTopic';
import { container } from '../../../di/container';

// ---------------------------------------------------------------------------
// Skeleton Card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-4">
        <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-700" />
        <div className="h-4 w-20 rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="mb-6 h-32 w-32 text-gray-300 dark:text-gray-600"
        viewBox="0 0 128 128"
        fill="none"
      >
        <rect x="20" y="24" width="88" height="72" rx="12" stroke="currentColor" strokeWidth="3" />
        <line
          x1="28"
          y1="44"
          x2="100"
          y2="44"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="58"
          x2="80"
          y2="58"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="72"
          x2="60"
          y2="72"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="104" cy="84" r="16" fill="currentColor" opacity="0.15" />
        <text
          x="104"
          y="89"
          textAnchor="middle"
          fontSize="16"
          fill="currentColor"
          fontWeight="bold"
        >
          +
        </text>
      </svg>
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Nenhum tema cadastrado
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        Crie seu primeiro tema de estudo e organize suas sessões no calendário.
      </p>
      <Button onClick={onCreate}>Criar primeiro tema</Button>
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
        Erro ao carregar temas
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pending Invitations Section
// ---------------------------------------------------------------------------

function PendingInvitationsSection({
  invitations,
  loading,
  onAccept,
  onReject,
  email,
  userId,
}: {
  invitations: {
    id: string;
    topic: StudyTopic | null;
    ownerEmail: string;
    topicId: string;
  }[];
  loading: boolean;
  onAccept: (sharedId: string, email: string, userId: string) => Promise<boolean>;
  onReject: (sharedId: string) => Promise<boolean>;
  email: string;
  userId: string;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  return (
    <div className="mb-8 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/20">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-brand-600 dark:text-brand-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
        <h2 className="text-base font-semibold text-brand-800 dark:text-brand-200">
          {invitations.length}{' '}
          {invitations.length === 1 ? 'convite pendente' : 'convites pendentes'}
        </h2>
      </div>

      <div className="space-y-2">
        {invitations.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between rounded-xl border border-brand-200 bg-white p-4 dark:border-brand-700 dark:bg-gray-800"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {invite.topic?.name ?? 'Tema desconhecido'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Convite de {invite.ownerEmail}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setActionLoading(invite.id);
                  await onReject(invite.id);
                  setActionLoading(null);
                }}
                loading={actionLoading === invite.id}
                disabled={loading || actionLoading !== null}
              >
                Recusar
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setActionLoading(invite.id);
                  await onAccept(invite.id, email, userId);
                  setActionLoading(null);
                }}
                loading={actionLoading === invite.id}
                disabled={loading || actionLoading !== null}
              >
                Aceitar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manage Shares Modal
// ---------------------------------------------------------------------------

function ManageSharesModal({
  isOpen,
  onClose,
  topicName,
  shares,
  loading,
  onRemoveShare,
}: {
  isOpen: boolean;
  onClose: () => void;
  topicName: string;
  shares: { id: string; sharedWithEmail: string; permission: string; status: string }[];
  loading: boolean;
  onRemoveShare: (sharedId: string) => Promise<boolean>;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Gerenciar compartilhamento — {topicName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Fechar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {shares.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Este tema ainda não foi compartilhado com ninguém.
          </p>
        ) : (
          <div className="space-y-2">
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {share.sharedWithEmail}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {share.permission === 'edit' ? 'Pode editar' : 'Apenas visualizar'} ·{' '}
                    {share.status === 'accepted'
                      ? 'Aceito'
                      : share.status === 'pending'
                        ? 'Pendente'
                        : 'Recusado'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setRemovingId(share.id);
                    await onRemoveShare(share.id);
                    setRemovingId(null);
                  }}
                  disabled={removingId === share.id || loading}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50"
                  aria-label={`Remover acesso de ${share.sharedWithEmail}`}
                >
                  {removingId === share.id ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StudyTopicsPage
// ---------------------------------------------------------------------------

export function StudyTopicsPage() {
  const { user } = useAuth();
  const {
    topics,
    loading,
    error,
    topicProgressMap,
    otherUserProgressMap,
    loadTopics,
    createTopic,
    updateTopic,
    deleteTopic,
  } = useStudyTopics();

  const {
    pendingInvitations,
    invitationsLoading,
    loadInvitations,
    shareTopic: shareTopicFn,
    acceptInvitation,
    rejectInvitation,
    sharesForTopic,
    loadSharesForTopic,
    removeShare,
  } = useSharing();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null);
  const [editingDates, setEditingDates] = useState<string[]>([]);
  const [deletingTopic, setDeletingTopic] = useState<StudyTopic | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Share states
  const [shareTarget, setShareTarget] = useState<StudyTopic | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [manageShareTarget, setManageShareTarget] = useState<StudyTopic | null>(null);

  const fetchTopics = useCallback(() => {
    if (user) {
      loadTopics(user.id);
      loadInvitations(user.email);
    }
  }, [user, loadTopics, loadInvitations]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // ---- Handlers ------------------------------------------------------------

  const handleOpenCreate = () => {
    setEditingTopic(null);
    setEditingDates([]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = async (topic: StudyTopic) => {
    try {
      const now = new Date();
      const startDate = '2024-01-01';
      const endDate = `${now.getFullYear()}-12-31`;
      const sessions = await container.studyRepository.getSessionsByDateRange(
        user!.id,
        startDate,
        endDate,
        [topic.id],
      );
      const dates = sessions.map((session) => session.date);
      setEditingDates(dates);
    } catch {
      setEditingDates([]);
    }

    setEditingTopic(topic);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (topic: StudyTopic) => {
    setDeletingTopic(topic);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTopic) return;
    setDeleteLoading(true);
    await deleteTopic(deletingTopic.id, deletingTopic.isShared);
    setDeleteLoading(false);
    setDeletingTopic(null);
  };

  const handleShareClick = (topic: StudyTopic) => {
    setShareTarget(topic);
  };

  const handleShareSubmit = async (email: string, permission: 'edit' | 'view') => {
    if (!shareTarget || !user) return;
    setShareLoading(true);
    const result = await shareTopicFn(shareTarget.id, user.id, email, permission);
    if (result) {
      setShareTarget(null);
    }
    setShareLoading(false);
  };
  const handleManageShareClick = async (topic: StudyTopic) => {
    setManageShareTarget(topic);
    await loadSharesForTopic(topic.id);
  };

  const handleRemoveShare = async (sharedId: string): Promise<boolean> => {
    const result = await removeShare(sharedId);
    if (result && manageShareTarget) {
      await loadSharesForTopic(manageShareTarget.id);
    }
    return result;
  };
  const handleAcceptInvitation = async (sharedId: string, email: string, userId: string) => {
    const result = await acceptInvitation(sharedId, email, userId);
    if (result) {
      fetchTopics();
    }
    return result;
  };

  const handleRejectInvitation = async (sharedId: string): Promise<boolean> => {
    return rejectInvitation(sharedId);
  };

  // ---- Render --------------------------------------------------------------

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Pending Invitations */}
      {!loading && user && (
        <PendingInvitationsSection
          invitations={pendingInvitations}
          loading={invitationsLoading}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
          email={user.email}
          userId={user.id}
        />
      )}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Temas de Estudo</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie os temas que você está estudando
          </p>
        </div>
        <Button onClick={handleOpenCreate}>Novo Tema</Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && <ErrorState message={error} onRetry={fetchTopics} />}

      {/* Empty State */}
      {!loading && !error && topics.length === 0 && <EmptyState onCreate={handleOpenCreate} />}

      {/* Topic Cards Grid */}
      {!loading && !error && topics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => {
            const progress = topicProgressMap.get(topic.id);
            const completedDays = progress?.completedSessions ?? 0;
            const totalDays = topic.totalDays;
            const percentage = progress?.percentage ?? 0;
            const totalHoursPlanned = totalDays * topic.hoursPerDay;
            const completedHours = completedDays * topic.hoursPerDay;

            return (
              <div
                key={topic.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Color bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: topic.color }}
                />

                <div className="ml-2">
                  {/* Shared badge */}
                  <div className="mb-2 flex items-center gap-2">
                    {topic.isShared && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                          />
                        </svg>
                        Compartilhado
                      </span>
                    )}
                  </div>

                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {topic.name}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                        />
                      </svg>
                      {totalDays} {totalDays === 1 ? 'dia' : 'dias'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatHours(topic.hoursPerDay)}/dia
                    </span>
                  </div>

                  {/* Progress section */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {formatHours(totalHoursPlanned)} totais · {formatHours(completedHours)}{' '}
                        concluídas
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {completedDays}/{totalDays} dias
                      </span>
                    </div>
                    <ProgressBar
                      value={percentage}
                      color={topic.color}
                      variant="horizontal"
                      size="sm"
                    />
                  </div>

                  {/* T26.4 — Desempenho do outro usuário em temas compartilhados */}
                  {(() => {
                    const otherProgress = otherUserProgressMap.get(topic.id);
                    if (!otherProgress || otherProgress.length === 0) return null;
                    return (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
                        {otherProgress.map((op) => (
                          <div key={op.userId} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                              <span className="flex items-center gap-1">👤 {op.email}</span>
                              <span>
                                {op.completedSessions}/{op.totalSessions} dias
                              </span>
                            </div>
                            <ProgressBar
                              value={op.percentage}
                              color="#94a3b8"
                              variant="horizontal"
                              size="sm"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Actions (visible on hover) */}
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {/* Share button */}
                  <button
                    type="button"
                    onClick={() => handleShareClick(topic)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                    aria-label={`Compartilhar ${topic.name}`}
                    title="Compartilhar"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                      />
                    </svg>
                  </button>

                  {/* Manage shares button (for owner to see who has access) */}
                  <button
                    type="button"
                    onClick={() => handleManageShareClick(topic)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                    aria-label={`Gerenciar compartilhamento de ${topic.name}`}
                    title="Gerenciar acesso"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(topic)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    aria-label={`Editar ${topic.name}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(topic)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    aria-label={`Excluir ${topic.name}`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <TopicFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={(input) => createTopic(user!.id, input)}
        onUpdate={(topicId, data) => updateTopic(topicId, data)}
        editingTopic={editingTopic}
        editingDates={editingDates}
      />

      {/* Delete Confirmation Modal */}
      {deletingTopic && (
        <ConfirmDeleteModal
          isOpen={!!deletingTopic}
          onClose={() => setDeletingTopic(null)}
          onConfirm={handleDeleteConfirm}
          topicName={deletingTopic.name}
          loading={deleteLoading}
        />
      )}

      {/* Share Modal */}
      {shareTarget && (
        <ShareTopicModal
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
          onShare={handleShareSubmit}
          loading={shareLoading}
          topicName={shareTarget.name}
        />
      )}

      {/* Manage Shares Modal */}
      <ManageSharesModal
        isOpen={!!manageShareTarget}
        onClose={() => setManageShareTarget(null)}
        topicName={manageShareTarget?.name ?? ''}
        shares={sharesForTopic}
        loading={false}
        onRemoveShare={handleRemoveShare}
      />
    </div>
  );
}
