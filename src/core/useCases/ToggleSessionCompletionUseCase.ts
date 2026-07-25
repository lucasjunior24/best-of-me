import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';
import type { StudySession } from '../entities/StudySession';

export class ToggleSessionCompletionUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(sessionId: string, userId: string): Promise<StudySession> {
    const result = await this.studyRepository.toggleSessionCompletion(sessionId, userId);

    if (result.completed) {
      this.toastService.success('Dia concluído! 🎉');
    } else {
      this.toastService.info('Dia reaberto');
    }

    return result;
  }
}
