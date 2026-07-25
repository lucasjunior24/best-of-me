import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';

export class DeleteStudyTopicUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(topicId: string): Promise<void> {
    await this.studyRepository.deleteTopic(topicId);
    this.toastService.success('Tema removido');
  }
}
