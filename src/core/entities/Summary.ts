import { ValidationError } from '../../shared/errorHandler';

export interface Summary {
  id: string;
  userId: string;
  /** Título do resumo (obrigatório, min 2 chars, max 200) */
  title: string;
  /** Conteúdo em Markdown (texto longo) */
  content: string;
  /** Array de tags para filtro (normalizado: lowercase, trim) */
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSummaryInput = {
  title: string;
  content: string;
  tags: string[];
};

export type UpdateSummaryInput = Partial<CreateSummaryInput>;

/**
 * Normaliza um array de tags: trim, lowercase, remove duplicatas, remove vazias.
 * Máximo de 20 tags retornadas.
 */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const cleaned = tag.trim().toLowerCase();
    if (cleaned.length === 0) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    normalized.push(cleaned);
  }

  // Limitar a 20 tags
  return normalized.slice(0, 20);
}

/**
 * Valida os campos de criação/atualização de um resumo.
 * Lança ValidationError se inválido.
 */
export function validateSummary(input: CreateSummaryInput | UpdateSummaryInput): void {
  // Validação de título (obrigatório na criação)
  if ('title' in input && input.title !== undefined) {
    const title = input.title.trim();
    if (title.length < 2) {
      throw new ValidationError('O título do resumo deve ter pelo menos 2 caracteres.');
    }
    if (title.length > 200) {
      throw new ValidationError('O título do resumo deve ter no máximo 200 caracteres.');
    }
  }

  // Validação de conteúdo (obrigatório na criação)
  if ('content' in input && input.content !== undefined) {
    if (input.content.trim().length === 0) {
      throw new ValidationError('O conteúdo do resumo não pode estar vazio.');
    }
  }

  // Validação de tags
  if ('tags' in input && input.tags !== undefined) {
    if (input.tags.length > 20) {
      throw new ValidationError('O resumo pode ter no máximo 20 tags.');
    }

    for (const tag of input.tags) {
      const cleaned = tag.trim().toLowerCase();
      if (cleaned.length === 0) {
        throw new ValidationError('As tags não podem estar vazias.');
      }
      if (cleaned.length > 50) {
        throw new ValidationError(`A tag "${cleaned}" excede o limite de 50 caracteres.`);
      }
    }

    // Verificar duplicatas após normalização
    const normalized = normalizeTags(input.tags);
    if (normalized.length < input.tags.length) {
      throw new ValidationError('Não são permitidas tags duplicadas.');
    }
  }
}
