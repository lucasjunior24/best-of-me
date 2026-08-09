import type { IReviewRepository } from '../ports/IReviewRepository';
import type { IToastService } from '../ports/IToastService';
import type { Review } from '../entities/Review';
import { ValidationError, NotFoundError } from '../../shared/errorHandler';

export class AddReviewDayUseCase {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(userId: string, reviewId: string, dates: string[]): Promise<Review> {
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

    // 2. Buscar revisão
    const review = await this.reviewRepository.getReviewById(reviewId);

    if (!review) {
      throw new NotFoundError('Review', reviewId);
    }

    // 3. Verificar que o usuário tem acesso (dono ou sharedWith)
    const isOwner = review.userId === userId;
    const isShared = review.sharedWith?.includes(userId) ?? false;

    if (!isOwner && !isShared) {
      throw new ValidationError('Você não tem permissão para modificar esta revisão.');
    }

    // 4. Concatenar novas datas ao scheduledDates existente, removendo duplicatas e ordenando
    const existingDates = new Set(review.scheduledDates);
    const newDates = dates.filter((date) => !existingDates.has(date));

    if (newDates.length === 0) {
      this.toastService.info('As datas selecionadas já estão agendadas para esta revisão.');
      return review;
    }

    const updatedDates = [...review.scheduledDates, ...newDates].sort((a, b) => a.localeCompare(b));

    // 5. Atualizar a revisão com as novas datas
    // Nota: Para o dono, usa a coleção normal. Para shared users, a atualização
    // precisa ser feita na collection do owner. Mas como o FirebaseReviewRepository
    // usa o _lastUserId, precisamos garantir que a revisão está na coleção correta.
    // A abordagem: sempre atualizar no repositório do owner do documento.
    // O IReviewRepository não tem updateReview com userId explícito, então
    // delegamos ao repositório que já está configurado com o userId via _lastUserId.

    const updatedReview = await this.reviewRepository.updateReview(reviewId, {
      scheduledDates: updatedDates,
    });

    this.toastService.success(
      `${newDates.length} dia(s) adicionado(s) à revisão "${review.name}"!`,
    );

    return updatedReview;
  }
}
