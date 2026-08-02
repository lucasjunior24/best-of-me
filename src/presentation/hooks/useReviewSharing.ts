import { useState, useCallback } from 'react';
import type { SharedReview } from '../../core/entities/SharedReview';
import type { PendingReviewInvitation } from '../../core/useCases/GetPendingReviewInvitationsUseCase';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseReviewSharingReturn {
  pendingInvitations: PendingReviewInvitation[];
  invitationsLoading: boolean;
  invitationsError: string | null;
  sharesForReview: SharedReview[];
  sharesLoading: boolean;
  loadInvitations: (email: string) => Promise<void>;
  shareReview: (
    reviewId: string,
    ownerUserId: string,
    targetEmail: string,
    permission: 'edit' | 'view',
  ) => Promise<SharedReview | null>;
  acceptInvitation: (sharedId: string, email: string, userId: string) => Promise<boolean>;
  rejectInvitation: (sharedId: string) => Promise<boolean>;
  loadSharesForReview: (reviewId: string) => Promise<void>;
  removeShare: (sharedId: string) => Promise<boolean>;
}

export function useReviewSharing(): UseReviewSharingReturn {
  const [pendingInvitations, setPendingInvitations] = useState<PendingReviewInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [invitationsError, setInvitationsError] = useState<string | null>(null);
  const [sharesForReview, setSharesForReview] = useState<SharedReview[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const loadInvitations = useCallback(async (email: string) => {
    setInvitationsLoading(true);
    setInvitationsError(null);
    try {
      const result = await container.useCases.getPendingReviewInvitations.execute(email);
      setPendingInvitations(result);
    } catch (err) {
      const message = handleError(err);
      setInvitationsError(message);
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  const shareReviewFn = useCallback(
    async (
      reviewId: string,
      ownerUserId: string,
      targetEmail: string,
      permission: 'edit' | 'view',
    ): Promise<SharedReview | null> => {
      try {
        const result = await container.useCases.shareReview.execute(
          reviewId,
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
    async (sharedId: string, email: string, userId: string): Promise<boolean> => {
      try {
        await container.useCases.acceptReviewInvitation.execute(sharedId, email, userId);
        container.toastService.success('Convite aceito! 🎉');
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
      await container.reviewSharingRepository.rejectInvitation(sharedId);
      container.toastService.success('Convite recusado.');
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== sharedId));
      return true;
    } catch (err) {
      const message = handleError(err);
      container.toastService.error(message);
      return false;
    }
  }, []);

  const loadSharesForReview = useCallback(async (reviewId: string) => {
    setSharesLoading(true);
    try {
      const result = await container.reviewSharingRepository.getSharesForReview(reviewId);
      setSharesForReview(result);
    } catch (err) {
      const message = handleError(err);
      container.toastService.error(message);
      setSharesForReview([]);
    } finally {
      setSharesLoading(false);
    }
  }, []);

  const removeShare = useCallback(async (sharedId: string): Promise<boolean> => {
    try {
      await container.reviewSharingRepository.removeShare(sharedId);
      container.toastService.success('Acesso removido.');
      setSharesForReview((prev) => prev.filter((s) => s.id !== sharedId));
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
    sharesForReview,
    sharesLoading,
    loadInvitations,
    shareReview: shareReviewFn,
    acceptInvitation,
    rejectInvitation,
    loadSharesForReview,
    removeShare,
  };
}
