import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';
import type { StudyTopic, UpdateStudyTopicInput } from '../entities/StudyTopic';
import { ValidationError } from '../../shared/errorHandler';

export class UpdateStudyTopicUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(
    topicId: string,
    userId: string,
    input: UpdateStudyTopicInput,
  ): Promise<StudyTopic> {
    this.validate(input);

    // Se novas datas foram enviadas, reagendar as sessões
    if (input.scheduledDates !== undefined) {
      // Remove as sessões antigas do tópico para este usuário
      await this.studyRepository.deleteSessionsByTopic(userId, topicId);

      // Cria novas sessões com as novas datas
      if (input.scheduledDates.length > 0) {
        const hoursPerDay = input.hoursPerDay ?? 1;
        const sessions = input.scheduledDates.map((date) => ({
          userId,
          topicId,
          date,
          duration: hoursPerDay * 60,
        }));
        await this.studyRepository.scheduleSessions(sessions);
      }
    }

    // Atualiza os metadados do tópico (name, color, totalDays, hoursPerDay, etc.)
    const updatedTopic = await this.studyRepository.updateTopic(topicId, input);
    this.toastService.success('Tema atualizado!');
    return updatedTopic;
  }

  private validate(input: UpdateStudyTopicInput): void {
    if (input.name !== undefined) {
      if (!input.name || input.name.trim().length < 2) {
        throw new ValidationError('O nome do tema deve ter pelo menos 2 caracteres.');
      }
    }

    if (input.totalDays !== undefined && input.totalDays <= 0) {
      throw new ValidationError('O total de dias deve ser maior que zero.');
    }

    if (input.hoursPerDay !== undefined && input.hoursPerDay <= 0) {
      throw new ValidationError('As horas por dia devem ser maiores que zero.');
    }

    if (input.color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new ValidationError('A cor deve ser um valor hexadecimal válido (ex: #FF5733).');
    }

    // Validar scheduledDates se fornecido
    if (input.scheduledDates !== undefined) {
      if (input.scheduledDates.length === 0) {
        throw new ValidationError('É necessário selecionar ao menos uma data de estudo.');
      }

      const totalDays = input.totalDays;
      if (totalDays !== undefined && input.scheduledDates.length !== totalDays) {
        throw new ValidationError(
          `O número de datas selecionadas (${input.scheduledDates.length}) deve ser igual ao total de dias (${totalDays}).`,
        );
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const date of input.scheduledDates) {
        if (!dateRegex.test(date)) {
          throw new ValidationError(`Data inválida: "${date}". Use o formato YYYY-MM-DD.`);
        }
        const parsed = new Date(date + 'T00:00:00');
        if (isNaN(parsed.getTime())) {
          throw new ValidationError(`Data inválida: "${date}".`);
        }
      }
    }
  }
}
