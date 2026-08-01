import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';
import type { StudySession } from '../entities/StudySession';

export class UpdateSessionNotesUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(sessionId: string, userId: string, notes: string): Promise<StudySession> {
    const result = await this.studyRepository.updateSessionNotes(sessionId, userId, notes);

    if (notes.trim()) {
      this.toastService.success('Anotações salvas! 📝');
    } else {
      this.toastService.info('Anotações removidas.');
    }

    return result;
  }
}
