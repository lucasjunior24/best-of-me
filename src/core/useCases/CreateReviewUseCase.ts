import type { IReviewRepository } from '../ports/IReviewRepository';
import type { Review, CreateReviewInput } from '../entities/Review';
import { ValidationError } from '../../shared/errorHandler';

export class CreateReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(userId: string, input: CreateReviewInput): Promise<Review> {
    this.validate(input);

    const review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      name: input.name.trim(),
      color: input.color,
      scheduledDates: input.scheduledDates,
      startDate: input.startDate,
      intervalDays: input.intervalDays,
      totalReviews: input.totalReviews,
    };

    return this.reviewRepository.createReview(review);
  }

  private validate(input: CreateReviewInput): void {
    if (!input.name || input.name.trim().length < 2) {
      throw new ValidationError('O nome da revisão deve ter pelo menos 2 caracteres.');
    }

    if (!input.color || !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new ValidationError('Cor inválida. Use o formato hexadecimal (#RRGGBB).');
    }

    // scheduledDates é obrigatório e deve ter ao menos 1 data
    if (!input.scheduledDates || input.scheduledDates.length === 0) {
      throw new ValidationError('É necessário selecionar ao menos 1 data de revisão.');
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

    // Validações dos metadados automáticos (opcionais)
    if (input.startDate !== undefined) {
      if (!dateRegex.test(input.startDate)) {
        throw new ValidationError('Data de início inválida. Use o formato YYYY-MM-DD.');
      }
      const parsed = new Date(input.startDate + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        throw new ValidationError('Data de início inválida.');
      }
    }

    if (input.intervalDays !== undefined) {
      if (input.intervalDays < 1) {
        throw new ValidationError('O intervalo de dias deve ser pelo menos 1.');
      }
      if (!Number.isInteger(input.intervalDays)) {
        throw new ValidationError('O intervalo de dias deve ser um número inteiro.');
      }
    }

    if (input.totalReviews !== undefined) {
      if (input.totalReviews < 1) {
        throw new ValidationError('O total de revisões deve ser pelo menos 1.');
      }
      if (!Number.isInteger(input.totalReviews)) {
        throw new ValidationError('O total de revisões deve ser um número inteiro.');
      }
      if (input.totalReviews > 365) {
        throw new ValidationError('O total de revisões não pode exceder 365.');
      }
    }
  }
}
