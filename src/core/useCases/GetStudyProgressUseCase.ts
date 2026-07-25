import type { IStudyRepository } from '../ports/IStudyRepository';
import type { ProgressData } from '../entities/ProgressData';

export class GetStudyProgressUseCase {
  constructor(private readonly studyRepository: IStudyRepository) {}

  async execute(userId: string, topicIds?: string[]): Promise<ProgressData> {
    const progress = await this.studyRepository.getProgress(userId, topicIds);

    return progress;
  }
}
