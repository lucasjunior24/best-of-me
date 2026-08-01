import type { ISharingRepository } from '../ports/ISharingRepository';
import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IAuthRepository } from '../ports/IAuthRepository';
import type { IToastService } from '../ports/IToastService';
import type { SharedTopic } from '../entities/SharedTopic';
import { ValidationError, NotFoundError } from '../../shared/errorHandler';

export class ShareTopicUseCase {
  constructor(
    private readonly sharingRepository: ISharingRepository,
    private readonly studyRepository: IStudyRepository,
    private readonly authRepository: IAuthRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(
    topicId: string,
    ownerUserId: string,
    targetEmail: string,
    permission: 'edit' | 'view',
  ): Promise<SharedTopic> {
    // Validar que o e-mail não é o do próprio dono
    const currentUser = this.authRepository.getCurrentUser();
    if (currentUser && currentUser.email === targetEmail) {
      throw new ValidationError('Você não pode compartilhar um tema consigo mesmo.');
    }

    // Verificar se o tópico existe e pertence ao usuário
    const topics = await this.studyRepository.getTopicsByUser(ownerUserId);
    const topic = topics.find((t) => t.id === topicId);

    if (!topic) {
      throw new NotFoundError('StudyTopic', topicId);
    }

    // Buscar usuário destino pelo e-mail
    const targetUser = await this.authRepository.getUserByEmail(targetEmail);
    if (!targetUser) {
      throw new NotFoundError('User', targetEmail);
    }

    // Verificar se já existe compartilhamento pendente ou aceito
    const existing = await this.sharingRepository.findExistingShare(topicId, targetUser.id);
    if (existing && (existing.status === 'pending' || existing.status === 'accepted')) {
      throw new ValidationError(
        existing.status === 'pending'
          ? 'Já existe um convite pendente para este usuário.'
          : 'Este tema já foi compartilhado com este usuário.',
      );
    }

    // Criar compartilhamento
    const sharedTopic = await this.sharingRepository.shareTopic({
      topicId,
      ownerUserId,
      ownerEmail: currentUser?.email ?? undefined,
      sharedWithUserId: targetUser.id,
      sharedWithEmail: targetEmail,
      permission,
    });

    this.toastService.success(`Convite enviado para ${targetEmail}! 📨`);

    return sharedTopic;
  }
}
