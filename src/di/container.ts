import { HotToastService } from '../adapters/toast/HotToastService';
import { FirebaseStudyRepository } from '../adapters/firebase/FirebaseStudyRepository';
import { CreateStudyTopicUseCase } from '../core/useCases/CreateStudyTopicUseCase';
import { UpdateStudyTopicUseCase } from '../core/useCases/UpdateStudyTopicUseCase';
import { DeleteStudyTopicUseCase } from '../core/useCases/DeleteStudyTopicUseCase';
import { GetStudyTopicsUseCase } from '../core/useCases/GetStudyTopicsUseCase';
import { ScheduleStudyDaysUseCase } from '../core/useCases/ScheduleStudyDaysUseCase';
import { ToggleSessionCompletionUseCase } from '../core/useCases/ToggleSessionCompletionUseCase';
import { GetCalendarSessionsUseCase } from '../core/useCases/GetCalendarSessionsUseCase';
import { GetStudyProgressUseCase } from '../core/useCases/GetStudyProgressUseCase';

const toastService = new HotToastService();
const studyRepository = new FirebaseStudyRepository();

const useCases = {
  createStudyTopic: new CreateStudyTopicUseCase(studyRepository, toastService),
  updateStudyTopic: new UpdateStudyTopicUseCase(studyRepository, toastService),
  deleteStudyTopic: new DeleteStudyTopicUseCase(studyRepository, toastService),
  getStudyTopics: new GetStudyTopicsUseCase(studyRepository),
  scheduleStudyDays: new ScheduleStudyDaysUseCase(studyRepository, toastService),
  toggleSessionCompletion: new ToggleSessionCompletionUseCase(studyRepository, toastService),
  getCalendarSessions: new GetCalendarSessionsUseCase(studyRepository),
  getStudyProgress: new GetStudyProgressUseCase(studyRepository),
};

const container = {
  toastService,
  studyRepository,
  useCases,
};

export { container };
