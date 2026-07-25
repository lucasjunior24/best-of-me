import type { IStudyRepository } from '../ports/IStudyRepository';
import type { StudyTopic } from '../entities/StudyTopic';

export class GetStudyTopicsUseCase {
  constructor(private readonly studyRepository: IStudyRepository) {}

  async execute(userId: string): Promise<StudyTopic[]> {
    return this.studyRepository.getTopicsByUser(userId);
  }
}
