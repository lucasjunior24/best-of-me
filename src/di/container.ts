import { HotToastService } from '../adapters/toast/HotToastService';
import { FirebaseStudyRepository } from '../adapters/firebase/FirebaseStudyRepository';
import { FirebaseReviewRepository } from '../adapters/firebase/FirebaseReviewRepository';
import { FirebaseAuthRepository } from '../adapters/firebase/FirebaseAuthRepository';
import { FirebaseSharingRepository } from '../adapters/firebase/FirebaseSharingRepository';
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
const sharingRepository = new FirebaseSharingRepository();

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

  // Sharing use cases (Sprint 22)
  shareTopic: new ShareTopicUseCase(
    sharingRepository,
    studyRepository,
    authRepository,
    toastService,
  ),
  getPendingInvitations: new GetPendingInvitationsUseCase(sharingRepository, studyRepository),
  acceptInvitation: new AcceptInvitationUseCase(sharingRepository, studyRepository, toastService),
};

const container = {
  toastService,
  studyRepository,
  reviewRepository,
  authRepository,
  sharingRepository,
  useCases,
};

export { container };
