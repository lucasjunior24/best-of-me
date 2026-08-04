import type { ISummaryRepository } from '../ports/ISummaryRepository';
import type { Summary } from '../entities/Summary';
import { NotFoundError } from '../../shared/errorHandler';

export class GetSummaryByIdUseCase {
  constructor(private readonly summaryRepository: ISummaryRepository) {}

  async execute(summaryId: string): Promise<Summary> {
    const summary = await this.summaryRepository.getSummaryById(summaryId);
    if (!summary) {
      throw new NotFoundError('Summary', summaryId);
    }
    return summary;
  }
}
