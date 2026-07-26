import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';
import type { CreateStudyTopicInput, StudyTopic } from '../entities/StudyTopic';
import { ValidationError } from '../../shared/errorHandler';

export class CreateStudyTopicUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(userId: string, input: CreateStudyTopicInput): Promise<StudyTopic> {
    this.validate(input);

    const topic: Omit<StudyTopic, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      name: input.name.trim(),
      color: input.color,
      totalDays: input.totalDays,
      hoursPerDay: input.hoursPerDay,
    };
    const createdTopic = await this.studyRepository.createTopic(topic);
    console.log('created RESULT:', createdTopic);

    if (input.scheduledDates.length > 0) {
      const sessions = input.scheduledDates.map((date) => ({
        userId,
        topicId: createdTopic.id,
        date,
        duration: input.hoursPerDay * 60,
      }));

      await this.studyRepository.scheduleSessions(sessions);
    }

    this.toastService.success('Tema criado com sucesso! 🎉');
    return createdTopic;
  }

  private validate(input: CreateStudyTopicInput): void {
    if (!input.name || input.name.trim().length < 2) {
      throw new ValidationError('O nome do tema deve ter pelo menos 2 caracteres.');
    }

    if (input.totalDays <= 0) {
      throw new ValidationError('O total de dias deve ser maior que zero.');
    }

    if (input.hoursPerDay <= 0) {
      throw new ValidationError('As horas por dia devem ser maiores que zero.');
    }

    if (!input.color || !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new ValidationError('A cor deve ser um valor hexadecimal válido (ex: #FF5733).');
    }

    if (!input.scheduledDates || input.scheduledDates.length === 0) {
      throw new ValidationError('É necessário selecionar ao menos uma data de estudo.');
    }

    // Validar formato das datas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const date of input.scheduledDates) {
      if (!dateRegex.test(date)) {
        throw new ValidationError(`Data inválida: ${date}. Use o formato YYYY-MM-DD.`);
      }

      const parsed = new Date(date + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        throw new ValidationError(`Data inválida: ${date}.`);
      }
    }
  }
}
