import type { IStudyRepository } from '../ports/IStudyRepository';
import type { ISharingRepository } from '../ports/ISharingRepository';
import type { IToastService } from '../ports/IToastService';

export class DeleteStudyTopicUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
    private readonly sharingRepository?: ISharingRepository,
  ) {}

  /**
   * Remove um tópico de estudo.
   * - Se o tópico for do próprio usuário: deleta o tópico e sessions normalmente
   * - Se o tópico for compartilhado (isShared): remove apenas o vínculo e sessions espelhadas
   */
  async execute(topicId: string, userId: string, isShared?: boolean): Promise<void> {
    if (isShared && this.sharingRepository) {
      // Tópico compartilhado: remover vínculo + sessions espelhadas
      await this.sharingRepository.removeShareForTopic(topicId, userId);
      await this.studyRepository.deleteSessionsByTopic(userId, topicId);
      this.toastService.success('Tema compartilhado removido da sua lista');
    } else {
      // Tópico próprio: deletar normalmente
      await this.studyRepository.deleteTopic(topicId);
      this.toastService.success('Tema removido');
    }
  }
}
