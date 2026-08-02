import type { IReviewRepository } from '../ports/IReviewRepository';
import type { Review, UpdateReviewInput } from '../entities/Review';
import { NotFoundError, ValidationError } from '../../shared/errorHandler';

export class UpdateReviewUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(reviewId: string, input: UpdateReviewInput): Promise<Review> {
    const existing = await this.reviewRepository.getReviewById(reviewId);
    if (!existing) {
      throw new NotFoundError('Review', reviewId);
    }

    this.validate(input);

    return this.reviewRepository.updateReview(reviewId, input);
  }

  private validate(input: UpdateReviewInput): void {
    if (input.name !== undefined && input.name.trim().length < 2) {
      throw new ValidationError('O nome da revisão deve ter pelo menos 2 caracteres.');
    }

    if (input.color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new ValidationError('Cor inválida. Use o formato hexadecimal (#RRGGBB).');
    }

    // Validar scheduledDates se fornecido
    if (input.scheduledDates !== undefined) {
      if (input.scheduledDates.length === 0) {
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
    }

    if (input.startDate !== undefined) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(input.startDate)) {
        throw new ValidationError('Data de início inválida. Use o formato YYYY-MM-DD.');
      }
      const parsed = new Date(input.startDate + 'T00:00:00');
      if (isNaN(parsed.getTime())) {
        throw new ValidationError('Data de início inválida.');
      }
    }

    if (input.intervalDays !== undefined) {
      if (input.intervalDays < 1 || !Number.isInteger(input.intervalDays)) {
        throw new ValidationError('O intervalo de dias deve ser um número inteiro >= 1.');
      }
    }

    if (input.totalReviews !== undefined) {
      if (input.totalReviews < 1 || !Number.isInteger(input.totalReviews)) {
        throw new ValidationError('O total de revisões deve ser um número inteiro >= 1.');
      }
      if (input.totalReviews > 365) {
        throw new ValidationError('O total de revisões não pode exceder 365.');
      }
    }
  }
}
