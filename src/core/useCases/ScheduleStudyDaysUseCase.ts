import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';
import type { StudySession } from '../entities/StudySession';
import { ValidationError } from '../../shared/errorHandler';

export class ScheduleStudyDaysUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(
    userId: string,
    topicId: string,
    dates: string[],
    duration?: number,
  ): Promise<StudySession[]> {
    if (!dates || dates.length === 0) {
      throw new ValidationError('É necessário informar ao menos uma data.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const date of dates) {
      if (!dateRegex.test(date)) {
        throw new ValidationError(`Data inválida: ${date}. Use o formato YYYY-MM-DD.`);
      }
    }

    const sessions = dates.map((date) => ({
      userId,
      topicId,
      date,
      duration,
    }));

    const result = await this.studyRepository.scheduleSessions(sessions);
    this.toastService.success('Dias agendados com sucesso!');
    return result;
  }
}
