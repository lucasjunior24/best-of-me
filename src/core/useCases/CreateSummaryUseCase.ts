import type { ISummaryRepository } from '../ports/ISummaryRepository';
import type { IToastService } from '../ports/IToastService';
import type { CreateSummaryInput, Summary } from '../entities/Summary';
import { validateSummary, normalizeTags } from '../entities/Summary';

export class CreateSummaryUseCase {
  constructor(
    private readonly summaryRepository: ISummaryRepository,
    private readonly toastService: IToastService,
  ) {}

  async execute(userId: string, input: CreateSummaryInput): Promise<Summary> {
    // Validação completa dos campos
    validateSummary(input);

    // Normalizar tags
    const normalizedTags = normalizeTags(input.tags);

    const summary: Omit<Summary, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      title: input.title.trim(),
      content: input.content,
      tags: normalizedTags,
    };

    const created = await this.summaryRepository.createSummary(summary);

    this.toastService.success('Resumo criado com sucesso! 📝');
    return created;
  }
}
