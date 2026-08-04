import type { ISummaryRepository } from '../ports/ISummaryRepository';
import type { IToastService } from '../ports/IToastService';
import { NotFoundError } from '../../shared/errorHandler';

export class DeleteSummaryUseCase {
  constructor(
    private readonly summaryRepository: ISummaryRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(userId: string, summaryId: string): Promise<void> {
    // Verificar se o resumo existe
    const existing = await this.summaryRepository.getSummaryById(userId, summaryId);
    if (!existing) {
      throw new NotFoundError('Summary', summaryId);
    }

    await this.summaryRepository.deleteSummary(userId, summaryId);

    this.toastService.success('Resumo excluído');
  }
}
