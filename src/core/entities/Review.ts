export interface Review {
  id: string;
  userId: string;
  name: string;
  color: string;
  /** Datas agendadas (YYYY-MM-DD) — fonte da verdade */
  scheduledDates: string[];
  /** Metadados do modo automático (opcionais, preservados para referência) */
  startDate?: string;
  intervalDays?: number;
  totalReviews?: number;
  /** IDs dos usuários com quem a revisão foi compartilhada */
  sharedWith?: string[];
  /** Indica se esta revisão foi recebida via compartilhamento */
  isShared?: boolean;
  /** ID do dono original (para revisões recebidas via compartilhamento) */
  ownerUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateReviewInput = {
  name: string;
  color: string;
  /** Datas agendadas manualmente ou geradas automaticamente */
  scheduledDates: string[];
  /** Metadados do modo automático (opcionais) */
  startDate?: string;
  intervalDays?: number;
  totalReviews?: number;
};

export type UpdateReviewInput = Partial<CreateReviewInput> & {
  /** Atualizar lista de usuários compartilhados (usado pelo AcceptReviewInvitationUseCase) */
  sharedWith?: string[];
};

/**
 * Gera as datas de revisão com base nos parâmetros do Review (modo automático).
 * Mantido como utilitário para compatibilidade e migração.
 *
 * Ex: startDate='2026-08-10', intervalDays=5, totalReviews=3
 *     → ['2026-08-10', '2026-08-15', '2026-08-20']
 */
export function generateReviewDates(
  startDate: string,
  intervalDays: number,
  totalReviews: number,
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');

  for (let i = 0; i < totalReviews; i++) {
    const reviewDate = new Date(start);
    reviewDate.setDate(reviewDate.getDate() + i * intervalDays);
    const year = reviewDate.getFullYear();
    const month = String(reviewDate.getMonth() + 1).padStart(2, '0');
    const day = String(reviewDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  return dates;
}

/**
 * Filtra as datas de revisão que caem dentro de um intervalo.
 */
export function filterReviewDatesInRange(
  dates: string[],
  rangeStart: string,
  rangeEnd: string,
): string[] {
  return dates.filter((date) => date >= rangeStart && date <= rangeEnd);
}
