import { HotToastService } from '../adapters/toast/HotToastService';
import { FirebaseStudyRepository } from '../adapters/firebase/FirebaseStudyRepository';
import { FirebaseReviewRepository } from '../adapters/firebase/FirebaseReviewRepository';
import { FirebaseAuthRepository } from '../adapters/firebase/FirebaseAuthRepository';
import { FirebaseSharingRepository } from '../adapters/firebase/FirebaseSharingRepository';
import { FirebaseReviewSharingRepository } from '../adapters/firebase/FirebaseReviewSharingRepository';
import { CreateStudyTopicUseCase } from '../core/useCases/CreateStudyTopicUseCase';
import { UpdateStudyTopicUseCase } from '../core/useCases/UpdateStudyTopicUseCase';
import { DeleteStudyTopicUseCase } from '../core/useCases/DeleteStudyTopicUseCase';
import { GetStudyTopicsUseCase } from '../core/useCases/GetStudyTopicsUseCase';
import { ScheduleStudyDaysUseCase } from '../core/useCases/ScheduleStudyDaysUseCase';
import { ToggleSessionCompletionUseCase } from '../core/useCases/ToggleSessionCompletionUseCase';
import { GetCalendarSessionsUseCase } from '../core/useCases/GetCalendarSessionsUseCase';
import { GetStudyProgressUseCase } from '../core/useCases/GetStudyProgressUseCase';
import { UpdateSessionNotesUseCase } from '../core/useCases/UpdateSessionNotesUseCase';
import { CreateReviewUseCase } from '../core/useCases/CreateReviewUseCase';
import { UpdateReviewUseCase } from '../core/useCases/UpdateReviewUseCase';
import { DeleteReviewUseCase } from '../core/useCases/DeleteReviewUseCase';
import { CreateOrUpdateQuestionnaireUseCase } from '../core/useCases/CreateOrUpdateQuestionnaireUseCase';
import { GetReviewCalendarUseCase } from '../core/useCases/GetReviewCalendarUseCase';
import { GetReviewStatsUseCase } from '../core/useCases/GetReviewStatsUseCase';
// Sharing use cases (Study Topics)
import { ShareTopicUseCase } from '../core/useCases/ShareTopicUseCase';
import { GetPendingInvitationsUseCase } from '../core/useCases/GetPendingInvitationsUseCase';
import { AcceptInvitationUseCase } from '../core/useCases/AcceptInvitationUseCase';
// Sharing use cases (Reviews)
import { ShareReviewUseCase } from '../core/useCases/ShareReviewUseCase';
import { GetPendingReviewInvitationsUseCase } from '../core/useCases/GetPendingReviewInvitationsUseCase';
import { AcceptReviewInvitationUseCase } from '../core/useCases/AcceptReviewInvitationUseCase';

const toastService = new HotToastService();
const studyRepository = new FirebaseStudyRepository();
const reviewRepository = new FirebaseReviewRepository();
const authRepository = new FirebaseAuthRepository();
const sharingRepository = new FirebaseSharingRepository();
const reviewSharingRepository = new FirebaseReviewSharingRepository();

const useCases = {
  // Study use cases
  createStudyTopic: new CreateStudyTopicUseCase(studyRepository, toastService),
  updateStudyTopic: new UpdateStudyTopicUseCase(studyRepository, toastService),
  deleteStudyTopic: new DeleteStudyTopicUseCase(studyRepository, toastService, sharingRepository),
  getStudyTopics: new GetStudyTopicsUseCase(studyRepository, sharingRepository),
  scheduleStudyDays: new ScheduleStudyDaysUseCase(studyRepository, toastService),
  toggleSessionCompletion: new ToggleSessionCompletionUseCase(studyRepository, toastService),
  getCalendarSessions: new GetCalendarSessionsUseCase(
    studyRepository,
    reviewRepository,
    sharingRepository,
    reviewSharingRepository,
  ),
  getStudyProgress: new GetStudyProgressUseCase(studyRepository),
  updateSessionNotes: new UpdateSessionNotesUseCase(studyRepository, toastService),

  // Review use cases
  createReview: new CreateReviewUseCase(reviewRepository),
  updateReview: new UpdateReviewUseCase(reviewRepository),
  deleteReview: new DeleteReviewUseCase(reviewRepository),
  createOrUpdateQuestionnaire: new CreateOrUpdateQuestionnaireUseCase(reviewRepository),
  getReviewCalendar: new GetReviewCalendarUseCase(reviewRepository),
  getReviewStats: new GetReviewStatsUseCase(reviewRepository),

  // Sharing use cases (Sprint 22 - Study Topics)
  shareTopic: new ShareTopicUseCase(
    sharingRepository,
    studyRepository,
    authRepository,
    toastService,
  ),
  getPendingInvitations: new GetPendingInvitationsUseCase(sharingRepository, studyRepository),
  acceptInvitation: new AcceptInvitationUseCase(sharingRepository, studyRepository, toastService),

  // Sharing use cases (Sprint 25 - Reviews)
  shareReview: new ShareReviewUseCase(
    reviewSharingRepository,
    reviewRepository,
    authRepository,
    toastService,
  ),
  getPendingReviewInvitations: new GetPendingReviewInvitationsUseCase(
    reviewSharingRepository,
    reviewRepository,
  ),
  acceptReviewInvitation: new AcceptReviewInvitationUseCase(
    reviewSharingRepository,
    reviewRepository,
    toastService,
  ),
};

const container = {
  toastService,
  studyRepository,
  reviewRepository,
  authRepository,
  sharingRepository,
  reviewSharingRepository,
  useCases,
};

export { container };
