import type { ISummaryRepository } from '../ports/ISummaryRepository';
import type { Summary } from '../entities/Summary';

export interface GetSummariesFilters {
  /** Filtrar por tags (AND logic — o resumo deve ter TODAS as tags) */
  tags?: string[];
  /** Buscar por termo no título e conteúdo */
  query?: string;
}

export class GetSummariesUseCase {
  constructor(private readonly summaryRepository: ISummaryRepository) {}

  async execute(userId: string, filters?: GetSummariesFilters): Promise<Summary[]> {
    // Caso 1: Sem filtros — retornar todos os resumos do usuário
    if (!filters || (!filters.tags && !filters.query)) {
      return this.summaryRepository.getSummariesByUser(userId);
    }

    // Caso 2: Ambos os filtros (tags + query)
    if (filters.tags && filters.tags.length > 0 && filters.query) {
      const byTags = await this.summaryRepository.getSummariesByTags(
        userId,
        filters.tags.map((t) => t.trim().toLowerCase()),
      );

      const query = filters.query.trim().toLowerCase();
      return byTags.filter(
        (s) => s.title.toLowerCase().includes(query) || s.content.toLowerCase().includes(query),
      );
    }

    // Caso 3: Apenas filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      return this.summaryRepository.getSummariesByTags(
        userId,
        filters.tags.map((t) => t.trim().toLowerCase()),
      );
    }

    // Caso 4: Apenas busca por texto
    if (filters.query) {
      return this.summaryRepository.searchSummaries(userId, filters.query.trim());
    }

    // Fallback: retornar todos
    return this.summaryRepository.getSummariesByUser(userId);
  }
}
