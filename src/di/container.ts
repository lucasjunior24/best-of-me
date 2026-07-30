import { HotToastService } from '../adapters/toast/HotToastService';
import { FirebaseStudyRepository } from '../adapters/firebase/FirebaseStudyRepository';
import { FirebaseReviewRepository } from '../adapters/firebase/FirebaseReviewRepository';
import { FirebaseAuthRepository } from '../adapters/firebase/FirebaseAuthRepository';
import { CreateStudyTopicUseCase } from '../core/useCases/CreateStudyTopicUseCase';
import { UpdateStudyTopicUseCase } from '../core/useCases/UpdateStudyTopicUseCase';
import { DeleteStudyTopicUseCase } from '../core/useCases/DeleteStudyTopicUseCase';
import { GetStudyTopicsUseCase } from '../core/useCases/GetStudyTopicsUseCase';
import { ScheduleStudyDaysUseCase } from '../core/useCases/ScheduleStudyDaysUseCase';
import { ToggleSessionCompletionUseCase } from '../core/useCases/ToggleSessionCompletionUseCase';
import { GetCalendarSessionsUseCase } from '../core/useCases/GetCalendarSessionsUseCase';
import { GetStudyProgressUseCase } from '../core/useCases/GetStudyProgressUseCase';
import { CreateReviewUseCase } from '../core/useCases/CreateReviewUseCase';
import { UpdateReviewUseCase } from '../core/useCases/UpdateReviewUseCase';
import { DeleteReviewUseCase } from '../core/useCases/DeleteReviewUseCase';
import { CreateOrUpdateQuestionnaireUseCase } from '../core/useCases/CreateOrUpdateQuestionnaireUseCase';
import { GetReviewCalendarUseCase } from '../core/useCases/GetReviewCalendarUseCase';
import { GetReviewStatsUseCase } from '../core/useCases/GetReviewStatsUseCase';
// Sharing use cases
import { ShareTopicUseCase } from '../core/useCases/ShareTopicUseCase';
import { GetPendingInvitationsUseCase } from '../core/useCases/GetPendingInvitationsUseCase';
import { AcceptInvitationUseCase } from '../core/useCases/AcceptInvitationUseCase';

const toastService = new HotToastService();
const studyRepository = new FirebaseStudyRepository();
const reviewRepository = new FirebaseReviewRepository();
const authRepository = new FirebaseAuthRepository();

// ISharingRepository será instanciado na Sprint 22 (FirebaseSharingRepository)
// Por enquanto, os use cases de sharing ficarão registrados mas sem dependência real
// O sharingRepository será injetado quando disponível.
let sharingRepository: import('../core/ports/ISharingRepository').ISharingRepository | undefined;

const useCases = {
  // Study use cases
  createStudyTopic: new CreateStudyTopicUseCase(studyRepository, toastService),
  updateStudyTopic: new UpdateStudyTopicUseCase(studyRepository, toastService),
  deleteStudyTopic: new DeleteStudyTopicUseCase(studyRepository, toastService),
  getStudyTopics: new GetStudyTopicsUseCase(studyRepository, sharingRepository),
  scheduleStudyDays: new ScheduleStudyDaysUseCase(studyRepository, toastService),
  toggleSessionCompletion: new ToggleSessionCompletionUseCase(studyRepository, toastService),
  getCalendarSessions: new GetCalendarSessionsUseCase(studyRepository, reviewRepository),
  getStudyProgress: new GetStudyProgressUseCase(studyRepository),

  // Review use cases
  createReview: new CreateReviewUseCase(reviewRepository),
  updateReview: new UpdateReviewUseCase(reviewRepository),
  deleteReview: new DeleteReviewUseCase(reviewRepository),
  createOrUpdateQuestionnaire: new CreateOrUpdateQuestionnaireUseCase(reviewRepository),
  getReviewCalendar: new GetReviewCalendarUseCase(reviewRepository),
  getReviewStats: new GetReviewStatsUseCase(reviewRepository),

  // Sharing use cases (dependem do sharingRepository — será funcional na Sprint 22)
  // Os use cases são registrados com dependências reais exceto sharingRepository
  // que será substituído pelo FirebaseSharingRepository na Sprint 22
  shareTopic: sharingRepository
    ? new ShareTopicUseCase(sharingRepository, studyRepository, authRepository, toastService)
    : undefined,
  getPendingInvitations: sharingRepository
    ? new GetPendingInvitationsUseCase(sharingRepository, studyRepository)
    : undefined,
  acceptInvitation: sharingRepository
    ? new AcceptInvitationUseCase(sharingRepository, studyRepository, toastService)
    : undefined,
};

const container = {
  toastService,
  studyRepository,
  reviewRepository,
  authRepository,
  useCases,
  /** Injeta o sharingRepository quando disponível (Sprint 22) */
  setSharingRepository(repo: import('../core/ports/ISharingRepository').ISharingRepository) {
    sharingRepository = repo;
    // Recriar use cases que dependem do sharingRepository
    (useCases as Record<string, unknown>).shareTopic = new ShareTopicUseCase(
      repo,
      studyRepository,
      authRepository,
      toastService,
    );
    (useCases as Record<string, unknown>).getPendingInvitations = new GetPendingInvitationsUseCase(
      repo,
      studyRepository,
    );
    (useCases as Record<string, unknown>).acceptInvitation = new AcceptInvitationUseCase(
      repo,
      studyRepository,
      toastService,
    );
  },
};

export { container };
