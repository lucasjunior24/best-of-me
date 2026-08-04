import type { ISummaryRepository } from '../ports/ISummaryRepository';
import type { IToastService } from '../ports/IToastService';
import type { UpdateSummaryInput, Summary } from '../entities/Summary';
import { validateSummary, normalizeTags } from '../entities/Summary';
import { NotFoundError } from '../../shared/errorHandler';

export class UpdateSummaryUseCase {
  constructor(
    private readonly summaryRepository: ISummaryRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(summaryId: string, input: UpdateSummaryInput): Promise<Summary> {
    // Buscar resumo existente
    const existing = await this.summaryRepository.getSummaryById(summaryId);
    if (!existing) {
      throw new NotFoundError('Summary', summaryId);
    }

    // Validar campos fornecidos
    validateSummary(input);

    // Preparar dados de atualização
    const data: UpdateSummaryInput = {};

    if (input.title !== undefined) {
      data.title = input.title.trim();
    }

    if (input.content !== undefined) {
      data.content = input.content;
    }

    if (input.tags !== undefined) {
      // Normalizar e substituir completamente as tags
      data.tags = normalizeTags(input.tags);
    }

    const updated = await this.summaryRepository.updateSummary(summaryId, data);

    this.toastService.success('Resumo atualizado! 📝');
    return updated;
  }
}
