import type { ISummaryRepository } from '../ports/ISummaryRepository';
import type { IToastService } from '../ports/IToastService';
import { NotFoundError } from '../../shared/errorHandler';

export class DeleteSummaryUseCase {
  constructor(
    private readonly summaryRepository: ISummaryRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(summaryId: string): Promise<void> {
    // Verificar se o resumo existe
    const existing = await this.summaryRepository.getSummaryById(summaryId);
    if (!existing) {
      throw new NotFoundError('Summary', summaryId);
    }

    await this.summaryRepository.deleteSummary(summaryId);

    this.toastService.success('Resumo excluído');
  }
}
