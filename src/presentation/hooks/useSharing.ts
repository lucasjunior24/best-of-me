import { useState, useCallback } from 'react';
import type { SharedTopic } from '../../core/entities/SharedTopic';
import type { PendingInvitation } from '../../core/useCases/GetPendingInvitationsUseCase';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseSharingReturn {
  pendingInvitations: PendingInvitation[];
  invitationsLoading: boolean;
  invitationsError: string | null;
  sharesForTopic: SharedTopic[];
  sharesLoading: boolean;
  loadInvitations: (userId: string) => Promise<void>;
  shareTopic: (
    topicId: string,
    ownerUserId: string,
    targetEmail: string,
    permission: 'edit' | 'view',
  ) => Promise<SharedTopic | null>;
  acceptInvitation: (sharedId: string, userId: string) => Promise<boolean>;
  rejectInvitation: (sharedId: string) => Promise<boolean>;
  loadSharesForTopic: (topicId: string) => Promise<void>;
  removeShare: (sharedId: string) => Promise<boolean>;
}

export function useSharing(): UseSharingReturn {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [sharesForTopic, setSharesForTopic] = useState<SharedTopic[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const loadInvitations = useCallback(async (userId: string) => {
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const result = await container.useCases.getPendingInvitations.execute(userId);
      setPendingInvitations(result);
    } catch (err) {
      const message = handleError(err);
      setInvitationsError(message);
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  const shareTopicFn = useCallback(
    async (
      topicId: string,
      ownerUserId: string,
      targetEmail: string,
      permission: 'edit' | 'view',
    ): Promise<SharedTopic | null> => {
      try {
        const result = await container.useCases.shareTopic.execute(
          topicId,
          ownerUserId,
          targetEmail,
          permission,
        );
        return result;
      } catch (err) {
        const message = handleError(err);
        container.toastService.error(message);
        return null;
      }
    },
    [],
  );

  const acceptInvitation = useCallback(
    async (sharedId: string, userId: string): Promise<boolean> => {
      try {
        await container.useCases.acceptInvitation.execute(sharedId, userId);
        container.toastService.success('Convite aceito! 🎉');
        // Remover da lista local
        setPendingInvitations((prev) => prev.filter((inv) => inv.id !== sharedId));
        return true;
      } catch (err) {
        const message = handleError(err);
        container.toastService.error(message);
        return false;
      }
    },
    [],
  );

  const rejectInvitation = useCallback(async (sharedId: string): Promise<boolean> => {
    try {
      await container.sharingRepository.rejectInvitation(sharedId);
      container.toastService.success('Convite recusado.');
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== sharedId));
      return true;
    } catch (err) {
      const message = handleError(err);
      container.toastService.error(message);
      return false;
    }
  }, []);

  const loadSharesForTopic = useCallback(async (topicId: string) => {
    setSharesLoading(true);
    try {
      const result = await container.sharingRepository.getSharesForTopic(topicId);
      setSharesForTopic(result);
    } catch (err) {
      const message = handleError(err);
      container.toastService.error(message);
      setSharesForTopic([]);
    } finally {
      setSharesLoading(false);
    }
  }, []);

  const removeShare = useCallback(async (sharedId: string): Promise<boolean> => {
    try {
      await container.sharingRepository.removeShare(sharedId);
      container.toastService.success('Acesso removido.');
      setSharesForTopic((prev) => prev.filter((s) => s.id !== sharedId));
      return true;
    } catch (err) {
      const message = handleError(err);
      container.toastService.error(message);
      return false;
    }
  }, []);

  return {
    pendingInvitations,
    invitationsLoading,
    invitationsError,
    sharesForTopic,
    sharesLoading,
    loadInvitations,
    shareTopic: shareTopicFn,
    acceptInvitation,
    rejectInvitation,
    loadSharesForTopic,
    removeShare,
  };
}
