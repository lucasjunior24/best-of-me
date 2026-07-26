import type { IReviewRepository } from '../ports/IReviewRepository';
import type {
  ReviewQuestionnaire,
  CreateQuestionnaireInput,
} from '../entities/ReviewQuestionnaire';
import { ValidationError, NotFoundError } from '../../shared/errorHandler';

export class CreateOrUpdateQuestionnaireUseCase {
  constructor(private readonly reviewRepository: IReviewRepository) {}

  async execute(userId: string, input: CreateQuestionnaireInput): Promise<ReviewQuestionnaire> {
    // Verificar se a revisão existe
    const review = await this.reviewRepository.getReviewById(input.reviewId);
    if (!review) {
      throw new NotFoundError('Review', input.reviewId);
    }

    this.validate(input);

    return this.reviewRepository.createOrUpdateQuestionnaire({
      userId,
      reviewId: input.reviewId,
      date: input.date,
      totalQuestions: input.totalQuestions,
      correctAnswers: input.correctAnswers,
    });
  }

  private validate(input: CreateQuestionnaireInput): void {
    if (!input.totalQuestions || input.totalQuestions < 1) {
      throw new ValidationError('O total de questões deve ser pelo menos 1.');
    }

    if (!Number.isInteger(input.totalQuestions)) {
      throw new ValidationError('O total de questões deve ser um número inteiro.');
    }

    if (input.correctAnswers < 0) {
      throw new ValidationError('O número de acertos não pode ser negativo.');
    }

    if (!Number.isInteger(input.correctAnswers)) {
      throw new ValidationError('O número de acertos deve ser um número inteiro.');
    }

    if (input.correctAnswers > input.totalQuestions) {
      throw new ValidationError(
        `O número de acertos (${input.correctAnswers}) não pode exceder o total de questões (${input.totalQuestions}).`,
      );
    }

    if (!input.date) {
      throw new ValidationError('A data do questionário é obrigatória.');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(input.date)) {
      throw new ValidationError('Data inválida. Use o formato YYYY-MM-DD.');
    }

    const parsed = new Date(input.date + 'T00:00:00');
    if (isNaN(parsed.getTime())) {
      throw new ValidationError('Data inválida.');
    }
  }
}
