import type { IStudyRepository } from '../ports/IStudyRepository';
import type { ISharingRepository } from '../ports/ISharingRepository';
import type { IToastService } from '../ports/IToastService';
import type { StudySession } from '../entities/StudySession';
import { ValidationError, NotFoundError } from '../../shared/errorHandler';

export class AddStudyDayUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly sharingRepository: ISharingRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(userId: string, topicId: string, dates: string[]): Promise<StudySession[]> {
    // 1. Validar datas
    if (!dates || dates.length === 0) {
      throw new ValidationError('É necessário informar ao menos uma data.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const date of dates) {
      if (!dateRegex.test(date)) {
        throw new ValidationError(`Data inválida: ${date}. Use o formato YYYY-MM-DD.`);
      }
    }

    // 2. Buscar tópico — primeiro nos próprios, depois nos compartilhados
    let topicOwnerUserId: string;
    let topic: Awaited<ReturnType<IStudyRepository['getTopicsByUser']>>[number] | undefined;

    const ownTopics = await this.studyRepository.getTopicsByUser(userId);
    topic = ownTopics.find((t) => t.id === topicId);

    if (topic) {
      topicOwnerUserId = userId;
    } else {
      // Verificar se o tópico foi compartilhado com este usuário
      const sharedTopics = await this.sharingRepository.getSharedTopics(userId);
      topic = sharedTopics.find((t) => t.id === topicId);

      if (!topic) {
        throw new NotFoundError('StudyTopic', topicId);
      }

      // Para tópicos compartilhados, o owner é o ownerUserId do tópico
      topicOwnerUserId = topic.ownerUserId ?? topic.userId;
    }

    if (!topic) {
      throw new NotFoundError('StudyTopic', topicId);
    }

    // 3. Contar sessions já existentes para este tópico (do usuário atual)
    const existingSessions = await this.studyRepository.getSessionsByDateRange(
      userId,
      '2000-01-01',
      '2099-12-31',
      [topicId],
    );
    const existingDates = new Set(existingSessions.map((s) => s.date));

    // Filtrar apenas datas que NÃO são duplicatas
    const newDates = dates.filter((date) => !existingDates.has(date));

    if (newDates.length === 0) {
      this.toastService.info('As datas selecionadas já possuem sessões agendadas.');
      return [];
    }

    // 4. Criar sessions para o usuário
    const sessions = newDates.map((date) => ({
      userId,
      topicId,
      date,
      duration: topic.hoursPerDay ? topic.hoursPerDay * 60 : undefined,
      createdBy: userId,
    }));

    const createdSessions = await this.studyRepository.scheduleSessions(sessions);

    // 5. Incrementar totalDays no tópico
    const newTotalDays = topic.totalDays + newDates.length;
    await this.studyRepository.updateTotalDays(topicId, newTotalDays, topicOwnerUserId);

    // 6. Espelhar sessions para invited users (se o tópico é compartilhado)
    if (topic.sharedWith && topic.sharedWith.length > 0) {
      for (const invitedUserId of topic.sharedWith) {
        if (invitedUserId === userId) continue; // Não espelhar para si mesmo

        const mirroredSessions = newDates.map((date) => ({
          userId: invitedUserId,
          topicId,
          date,
          duration: topic!.hoursPerDay ? topic!.hoursPerDay * 60 : undefined,
          createdBy: topicOwnerUserId,
        }));

        try {
          await this.studyRepository.scheduleSessions(mirroredSessions);
        } catch {
          // Se falhar o espelhamento para um usuário, loga mas não interrompe
          // O espelhamento é best-effort
        }
      }
    }

    this.toastService.success(`${newDates.length} dia(s) adicionado(s) ao tema "${topic.name}"!`);

    return createdSessions;
  }
}
