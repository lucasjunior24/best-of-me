import type { IStudyRepository } from '../ports/IStudyRepository';
import type { IToastService } from '../ports/IToastService';
import type { StudyTopic, UpdateStudyTopicInput } from '../entities/StudyTopic';
import { ValidationError } from '../../shared/errorHandler';

export class UpdateStudyTopicUseCase {
  constructor(
    private readonly studyRepository: IStudyRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(topicId: string, input: UpdateStudyTopicInput): Promise<StudyTopic> {
    this.validate(input);

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
  }
}
