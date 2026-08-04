import type { Summary, UpdateSummaryInput } from '../entities/Summary';

export interface ISummaryRepository {
  /** Cria um novo resumo e retorna o documento criado */
  createSummary(summary: Omit<Summary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Summary>;

  /** Atualiza um resumo existente com dados parciais */
  updateSummary(userId: string, id: string, data: UpdateSummaryInput): Promise<Summary>;

  /** Exclui um resumo permanentemente */
  deleteSummary(userId: string, id: string): Promise<void>;

  /** Lista todos os resumos de um usuário, ordenados por updatedAt DESC */
  getSummariesByUser(userId: string): Promise<Summary[]>;

  /** Busca um resumo específico por ID */
  getSummaryById(userId: string, id: string): Promise<Summary>;

  /** Busca resumos do usuário filtrados por tags (AND logic) */
  getSummariesByTags(userId: string, tags: string[]): Promise<Summary[]>;

  /** Busca resumos do usuário por termo de busca no título e conteúdo */
  searchSummaries(userId: string, query: string): Promise<Summary[]>;
}
