import { describe, it, expect, vi } from 'vitest';
import { CreateStudyTopicUseCase } from '../core/useCases/CreateStudyTopicUseCase';
import { DeleteStudyTopicUseCase } from '../core/useCases/DeleteStudyTopicUseCase';
import { ToggleSessionCompletionUseCase } from '../core/useCases/ToggleSessionCompletionUseCase';
import { GetStudyProgressUseCase } from '../core/useCases/GetStudyProgressUseCase';
import { GetCalendarSessionsUseCase } from '../core/useCases/GetCalendarSessionsUseCase';
import { UpdateStudyTopicUseCase } from '../core/useCases/UpdateStudyTopicUseCase';
import { CreateSummaryUseCase } from '../core/useCases/CreateSummaryUseCase';
import { UpdateSummaryUseCase } from '../core/useCases/UpdateSummaryUseCase';
import { DeleteSummaryUseCase } from '../core/useCases/DeleteSummaryUseCase';
import { GetSummariesUseCase } from '../core/useCases/GetSummariesUseCase';
import { GetSummaryByIdUseCase } from '../core/useCases/GetSummaryByIdUseCase';
import { AddStudyDayUseCase } from '../core/useCases/AddStudyDayUseCase';
import { AddReviewDayUseCase } from '../core/useCases/AddReviewDayUseCase';
import { ValidationError, NotFoundError } from '../shared/errorHandler';

function createMockRepo() {
  return {
    createTopic: vi.fn(),
    updateTopic: vi.fn(),
    deleteTopic: vi.fn(),
    getTopicsByUser: vi.fn(),
    scheduleSessions: vi.fn(),
    getSessionsByDateRange: vi.fn(),
    toggleSessionCompletion: vi.fn(),
    getProgress: vi.fn(),
    updateSessionNotes: vi.fn(),
    deleteSessionsByTopic: vi.fn(),
    updateTotalDays: vi.fn(),
  };
}

function createMockToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// CreateStudyTopicUseCase
// ---------------------------------------------------------------------------
describe('CreateStudyTopicUseCase', () => {
  it('deve criar um tópico e agendar sessões com sucesso', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    const createdTopic = {
      id: 'topic-1',
      userId: 'user-1',
      name: 'React',
      color: '#3b82f6',
      totalDays: 3,
      hoursPerDay: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.createTopic.mockResolvedValue(createdTopic);
    repo.scheduleSessions.mockResolvedValue(undefined);

    const useCase = new CreateStudyTopicUseCase(repo, toast);
    const input = {
      name: 'React',
      color: '#3b82f6',
      totalDays: 3,
      hoursPerDay: 2,
      scheduledDates: ['2026-07-01', '2026-07-02', '2026-07-03'],
    };

    const result = await useCase.execute('user-1', input);

    expect(result).toEqual(createdTopic);
    expect(repo.createTopic).toHaveBeenCalled();
    expect(repo.scheduleSessions).toHaveBeenCalledWith([
      { userId: 'user-1', topicId: 'topic-1', date: '2026-07-01', duration: 120 },
      { userId: 'user-1', topicId: 'topic-1', date: '2026-07-02', duration: 120 },
      { userId: 'user-1', topicId: 'topic-1', date: '2026-07-03', duration: 120 },
    ]);
    expect(toast.success).toHaveBeenCalledWith('Tema criado com sucesso! 🎉');
  });

  it('deve rejeitar nome muito curto', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    const useCase = new CreateStudyTopicUseCase(repo, toast);

    await expect(
      useCase.execute('user-1', {
        name: 'R',
        color: '#3b82f6',
        totalDays: 1,
        hoursPerDay: 1,
        scheduledDates: ['2026-07-01'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('deve rejeitar sem datas agendadas', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    const useCase = new CreateStudyTopicUseCase(repo, toast);

    await expect(
      useCase.execute('user-1', {
        name: 'React',
        color: '#3b82f6',
        totalDays: 5,
        hoursPerDay: 2,
        scheduledDates: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('deve rejeitar cor inválida', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    const useCase = new CreateStudyTopicUseCase(repo, toast);

    await expect(
      useCase.execute('user-1', {
        name: 'React',
        color: 'red',
        totalDays: 1,
        hoursPerDay: 1,
        scheduledDates: ['2026-07-01'],
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// DeleteStudyTopicUseCase
// ---------------------------------------------------------------------------
describe('DeleteStudyTopicUseCase', () => {
  it('deve deletar tópico e disparar toast', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    const useCase = new DeleteStudyTopicUseCase(repo, toast);

    await useCase.execute('topic-1', 'user-1');

    expect(repo.deleteTopic).toHaveBeenCalledWith('topic-1');
    expect(toast.success).toHaveBeenCalledWith('Tema removido');
  });
});

// ---------------------------------------------------------------------------
// ToggleSessionCompletionUseCase
// ---------------------------------------------------------------------------
describe('ToggleSessionCompletionUseCase', () => {
  it('deve alternar conclusão de sessão e disparar toast de sucesso', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    repo.toggleSessionCompletion.mockResolvedValue({ completed: true });
    const useCase = new ToggleSessionCompletionUseCase(repo, toast);

    await useCase.execute('session-1', 'user-1');

    expect(repo.toggleSessionCompletion).toHaveBeenCalledWith('session-1', 'user-1');
    expect(toast.success).toHaveBeenCalledWith('Dia concluído! 🎉');
  });

  it('deve desmarcar conclusão e disparar toast info', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    repo.toggleSessionCompletion.mockResolvedValue({ completed: false });
    const useCase = new ToggleSessionCompletionUseCase(repo, toast);

    await useCase.execute('session-1', 'user-1');

    expect(repo.toggleSessionCompletion).toHaveBeenCalledWith('session-1', 'user-1');
    expect(toast.info).toHaveBeenCalledWith('Dia reaberto');
  });
});

// ---------------------------------------------------------------------------
// GetStudyProgressUseCase
// ---------------------------------------------------------------------------
describe('GetStudyProgressUseCase', () => {
  it('deve retornar progresso com percentuais corretos', async () => {
    const repo = createMockRepo();
    const progressData = {
      totalPlannedSessions: 10,
      totalCompletedSessions: 4,
      completionPercentage: 40,
      byTopic: [
        {
          topicId: 't1',
          topicName: 'React',
          topicColor: '#3b82f6',
          totalSessions: 5,
          completedSessions: 2,
          percentage: 40,
        },
        {
          topicId: 't2',
          topicName: 'Node',
          topicColor: '#22c55e',
          totalSessions: 5,
          completedSessions: 2,
          percentage: 40,
        },
      ],
    };
    repo.getProgress.mockResolvedValue(progressData);

    const useCase = new GetStudyProgressUseCase(repo);
    const result = await useCase.execute('user-1');

    expect(result.completionPercentage).toBe(40);
    expect(result.byTopic).toHaveLength(2);
    expect(repo.getProgress).toHaveBeenCalledWith('user-1', undefined);
  });

  it('deve filtrar por topicIds', async () => {
    const repo = createMockRepo();
    repo.getProgress.mockResolvedValue({
      totalPlannedSessions: 5,
      totalCompletedSessions: 2,
      completionPercentage: 40,
      byTopic: [],
    });

    const useCase = new GetStudyProgressUseCase(repo);
    await useCase.execute('user-1', ['t1']);

    expect(repo.getProgress).toHaveBeenCalledWith('user-1', ['t1']);
  });
});

// ---------------------------------------------------------------------------
// GetCalendarSessionsUseCase
// ---------------------------------------------------------------------------
describe('GetCalendarSessionsUseCase', () => {
  it('deve agrupar sessões por data e enriquecer com dados do tópico', async () => {
    const repo = createMockRepo();
    const sessions = [
      {
        id: 's1',
        userId: 'user-1',
        topicId: 't1',
        date: '2026-07-15',
        completed: false,
        createdAt: new Date(),
      },
      {
        id: 's2',
        userId: 'user-1',
        topicId: 't2',
        date: '2026-07-15',
        completed: true,
        completedAt: new Date(),
        createdAt: new Date(),
      },
    ];
    const topics = [
      {
        id: 't1',
        name: 'React',
        color: '#3b82f6',
        totalDays: 5,
        hoursPerDay: 2,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 't2',
        name: 'Node',
        color: '#22c55e',
        totalDays: 3,
        hoursPerDay: 1,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    repo.getSessionsByDateRange.mockResolvedValue(sessions);
    repo.getTopicsByUser.mockResolvedValue(topics);

    const useCase = new GetCalendarSessionsUseCase(repo);
    const result = await useCase.execute('user-1', '2026-07-01', '2026-07-31');

    // Deve retornar todos os 31 dias de julho
    expect(result).toHaveLength(31);

    // O dia 15 deve ter as 2 sessões
    const day15 = result.find((d) => d.date === '2026-07-15')!;
    expect(day15).toBeDefined();
    expect(day15.studySessions).toHaveLength(2);
    expect(day15.studySessions[0].topicName).toBe('React');
    expect(day15.studySessions[0].topicColor).toBe('#3b82f6');
    expect(day15.anyCompleted).toBe(true);
    expect(day15.allCompleted).toBe(false);
    expect(day15.hasActivities).toBe(true);

    // Dias sem sessões devem ter hasActivities=false
    const day1 = result.find((d) => d.date === '2026-07-01')!;
    expect(day1.hasActivities).toBe(false);
    expect(day1.studySessions).toHaveLength(0);
    expect(day1.isCurrentMonth).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UpdateStudyTopicUseCase
// ---------------------------------------------------------------------------
describe('UpdateStudyTopicUseCase', () => {
  it('deve atualizar tópico com sucesso', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    const updatedTopic = {
      id: 'topic-1',
      userId: 'user-1',
      name: 'React Avançado',
      color: '#3b82f6',
      totalDays: 5,
      hoursPerDay: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.updateTopic.mockResolvedValue(updatedTopic);

    const useCase = new UpdateStudyTopicUseCase(repo, toast);
    const result = await useCase.execute('topic-1', 'user-1', {
      name: 'React Avançado',
      totalDays: 5,
    });

    expect(result).toEqual(updatedTopic);
    expect(toast.success).toHaveBeenCalledWith('Tema atualizado!');
  });

  it('deve reagendar sessões quando scheduledDates é fornecido', async () => {
    const repo = createMockRepo();
    const toast = createMockToast();
    const updatedTopic = {
      id: 'topic-1',
      userId: 'user-1',
      name: 'React',
      color: '#3b82f6',
      totalDays: 2,
      hoursPerDay: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.updateTopic.mockResolvedValue(updatedTopic);

    const useCase = new UpdateStudyTopicUseCase(repo, toast);
    await useCase.execute('topic-1', 'user-1', {
      scheduledDates: ['2026-08-10', '2026-08-11'],
      hoursPerDay: 1,
    });

    expect(repo.deleteSessionsByTopic).toHaveBeenCalledWith('user-1', 'topic-1');
    expect(repo.scheduleSessions).toHaveBeenCalledWith([
      { userId: 'user-1', topicId: 'topic-1', date: '2026-08-10', duration: 60 },
      { userId: 'user-1', topicId: 'topic-1', date: '2026-08-11', duration: 60 },
    ]);
    expect(repo.updateTopic).toHaveBeenCalledWith('topic-1', {
      scheduledDates: ['2026-08-10', '2026-08-11'],
      hoursPerDay: 1,
    });
    expect(toast.success).toHaveBeenCalledWith('Tema atualizado!');
  });
});

// ---------------------------------------------------------------------------
// Sprint 31 — Testes dos Use Cases de Summary
// ---------------------------------------------------------------------------

function createMockSummaryRepo() {
  return {
    createSummary: vi.fn(),
    updateSummary: vi.fn(),
    deleteSummary: vi.fn(),
    getSummariesByUser: vi.fn(),
    getSummaryById: vi.fn(),
    getSummariesByTags: vi.fn(),
    searchSummaries: vi.fn(),
  };
}

function createMockSummaryToast() {
  return {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };
}

// ---- CreateSummaryUseCase ----

describe('CreateSummaryUseCase', () => {
  it('deve criar um resumo com sucesso e normalizar tags', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const created = {
      id: 'summary-1',
      userId: 'user-1',
      title: 'Entendendo React Hooks',
      content: '# React Hooks\n\nConteúdo do resumo.',
      tags: ['react', 'hooks'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.createSummary.mockResolvedValue(created);

    const useCase = new CreateSummaryUseCase(repo, toast);
    const result = await useCase.execute('user-1', {
      title: 'Entendendo React Hooks',
      content: '# React Hooks\n\nConteúdo do resumo.',
      tags: ['React', '  Hooks  '],
    });

    expect(result).toEqual(created);
    expect(result.tags).toEqual(['react', 'hooks']); // normalized: trimmed + lowercased
    expect(repo.createSummary).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Resumo criado com sucesso! 📝');
  });

  it('deve rejeitar título muito curto', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const useCase = new CreateSummaryUseCase(repo, toast);

    await expect(
      useCase.execute('user-1', {
        title: 'A',
        content: 'Conteúdo válido',
        tags: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('deve rejeitar conteúdo vazio', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const useCase = new CreateSummaryUseCase(repo, toast);

    await expect(
      useCase.execute('user-1', {
        title: 'Título válido',
        content: '',
        tags: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('deve rejeitar mais de 20 tags', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const useCase = new CreateSummaryUseCase(repo, toast);

    const tags = Array.from({ length: 21 }, (_, i) => `tag-${i}`);
    await expect(
      useCase.execute('user-1', {
        title: 'Título válido',
        content: 'Conteúdo válido',
        tags,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('deve rejeitar tags duplicadas (case-insensitive)', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const useCase = new CreateSummaryUseCase(repo, toast);

    await expect(
      useCase.execute('user-1', {
        title: 'Título válido',
        content: 'Conteúdo válido',
        tags: ['React', 'react', 'REACT'],
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ---- UpdateSummaryUseCase ----

describe('UpdateSummaryUseCase', () => {
  it('deve atualizar um resumo com sucesso', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const existing = {
      id: 'summary-1',
      userId: 'user-1',
      title: 'Título antigo',
      content: 'Conteúdo antigo',
      tags: ['old'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updated = {
      ...existing,
      title: 'Novo título',
      content: 'Conteúdo novo',
      tags: ['new'],
      updatedAt: new Date(),
    };
    repo.getSummaryById.mockResolvedValue(existing);
    repo.updateSummary.mockResolvedValue(updated);

    const useCase = new UpdateSummaryUseCase(repo, toast);
    const result = await useCase.execute('user-1', 'summary-1', {
      title: 'Novo título',
      content: 'Conteúdo novo',
      tags: ['new'],
    });

    expect(result).toEqual(updated);
    expect(toast.success).toHaveBeenCalledWith('Resumo atualizado! 📝');
  });

  it('deve lançar NotFoundError se resumo não existir', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    repo.getSummaryById.mockResolvedValue(null);

    const useCase = new UpdateSummaryUseCase(repo, toast);
    await expect(useCase.execute('user-1', 'nonexistent', { title: 'Novo' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('deve suportar partial update (apenas título)', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const existing = {
      id: 'summary-1',
      userId: 'user-1',
      title: 'Título antigo',
      content: 'Conteúdo antigo',
      tags: ['tag'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getSummaryById.mockResolvedValue(existing);
    repo.updateSummary.mockResolvedValue({ ...existing, title: 'Só título' });

    const useCase = new UpdateSummaryUseCase(repo, toast);
    const result = await useCase.execute('user-1', 'summary-1', { title: 'Só título' });

    expect(result.title).toBe('Só título');
    expect(result.content).toBe('Conteúdo antigo'); // unchanged
  });
});

// ---- DeleteSummaryUseCase ----

describe('DeleteSummaryUseCase', () => {
  it('deve deletar um resumo com sucesso', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    const existing = {
      id: 'summary-1',
      userId: 'user-1',
      title: 'Teste',
      content: 'Conteúdo',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getSummaryById.mockResolvedValue(existing);
    repo.deleteSummary.mockResolvedValue(undefined);

    const useCase = new DeleteSummaryUseCase(repo, toast);
    await useCase.execute('user-1', 'summary-1');

    expect(repo.deleteSummary).toHaveBeenCalledWith('user-1', 'summary-1');
    expect(toast.success).toHaveBeenCalledWith('Resumo excluído');
  });

  it('deve lançar NotFoundError se resumo não existir', async () => {
    const repo = createMockSummaryRepo();
    const toast = createMockSummaryToast();
    repo.getSummaryById.mockResolvedValue(null);

    const useCase = new DeleteSummaryUseCase(repo, toast);
    await expect(useCase.execute('user-1', 'nonexistent')).rejects.toThrow(NotFoundError);
  });
});

// ---- GetSummariesUseCase ----

describe('GetSummariesUseCase', () => {
  it('deve listar todos os resumos do usuário', async () => {
    const repo = createMockSummaryRepo();
    const summaries = [
      {
        id: '1',
        userId: 'user-1',
        title: 'A',
        content: 'C',
        tags: ['x'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'user-1',
        title: 'B',
        content: 'D',
        tags: ['y'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    repo.getSummariesByUser.mockResolvedValue(summaries);

    const useCase = new GetSummariesUseCase(repo);
    const result = await useCase.execute('user-1', {});

    expect(result).toHaveLength(2);
    expect(result).toEqual(summaries);
  });

  it('deve filtrar por tags', async () => {
    const repo = createMockSummaryRepo();
    repo.getSummariesByTags.mockResolvedValue([
      {
        id: '1',
        userId: 'user-1',
        title: 'A',
        content: 'C',
        tags: ['react'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const useCase = new GetSummariesUseCase(repo);
    const result = await useCase.execute('user-1', { tags: ['react'] });

    expect(result).toHaveLength(1);
    expect(repo.getSummariesByTags).toHaveBeenCalledWith('user-1', ['react']);
  });

  it('deve buscar por query', async () => {
    const repo = createMockSummaryRepo();
    repo.searchSummaries.mockResolvedValue([
      {
        id: '2',
        userId: 'user-1',
        title: 'Hooks',
        content: 'Conteúdo sobre hooks',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const useCase = new GetSummariesUseCase(repo);
    const result = await useCase.execute('user-1', { query: 'hooks' });

    expect(result).toHaveLength(1);
    expect(repo.searchSummaries).toHaveBeenCalledWith('user-1', 'hooks');
  });

  it('deve combinar filtros de tags e query', async () => {
    const repo = createMockSummaryRepo();
    // When both tags AND query are provided, getSummariesByTags is called first,
    // then results are filtered by query client-side
    repo.getSummariesByTags.mockResolvedValue([
      {
        id: '1',
        userId: 'user-1',
        title: 'React Hooks',
        content: 'Conteúdo sobre react hooks',
        tags: ['react'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        userId: 'user-1',
        title: 'Node Basics',
        content: 'Conteúdo sobre node',
        tags: ['react'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const useCase = new GetSummariesUseCase(repo);
    const result = await useCase.execute('user-1', { tags: ['react'], query: 'hooks' });

    // Only the first result matches 'hooks' query
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(repo.getSummariesByTags).toHaveBeenCalledWith('user-1', ['react']);
  });
});

// ---- GetSummaryByIdUseCase ----

describe('GetSummaryByIdUseCase', () => {
  it('deve retornar resumo por ID', async () => {
    const repo = createMockSummaryRepo();
    const summary = {
      id: 'summary-1',
      userId: 'user-1',
      title: 'Teste',
      content: 'Conteúdo',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getSummaryById.mockResolvedValue(summary);

    const useCase = new GetSummaryByIdUseCase(repo);
    const result = await useCase.execute('user-1', 'summary-1');

    expect(result).toEqual(summary);
  });

  it('deve lançar NotFoundError se resumo não existir', async () => {
    const repo = createMockSummaryRepo();
    repo.getSummaryById.mockResolvedValue(null);

    const useCase = new GetSummaryByIdUseCase(repo);
    await expect(useCase.execute('user-1', 'nonexistent')).rejects.toThrow(NotFoundError);
  });
});

// ---------------------------------------------------------------------------
// Sprint 34 — Testes de AddStudyDayUseCase e AddReviewDayUseCase (T34.8)
// ---------------------------------------------------------------------------

function createMockSharingRepo() {
  return {
    shareTopic: vi.fn(),
    getPendingInvitations: vi.fn(),
    acceptInvitation: vi.fn(),
    rejectInvitation: vi.fn(),
    getSharedTopics: vi.fn(),
    removeShare: vi.fn(),
    findExistingShare: vi.fn(),
    getUserEmail: vi.fn(),
    removeShareForTopic: vi.fn(),
  };
}

function createMockReviewRepo() {
  return {
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    getReviewsByUser: vi.fn(),
    getReviewById: vi.fn(),
    createOrUpdateQuestionnaire: vi.fn(),
    getQuestionnairesByReview: vi.fn(),
    getQuestionnaireByDate: vi.fn(),
    getReviewSessionsByDateRange: vi.fn(),
    getReviewStats: vi.fn(),
  };
}

// ---- AddStudyDayUseCase ----

describe('AddStudyDayUseCase', () => {
  it('deve criar sessions e incrementar totalDays para datas válidas', async () => {
    const repo = createMockRepo();
    const sharingRepo = createMockSharingRepo();
    const toast = createMockToast();

    const existingTopic = {
      id: 'topic-1',
      userId: 'user-1',
      name: 'React',
      color: '#3b82f6',
      totalDays: 3,
      hoursPerDay: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getTopicsByUser.mockResolvedValue([existingTopic]);
    repo.getSessionsByDateRange.mockResolvedValue([]);
    repo.scheduleSessions.mockResolvedValue([]);
    repo.updateTotalDays.mockResolvedValue({
      ...existingTopic,
      totalDays: 4,
    });

    const useCase = new AddStudyDayUseCase(repo, sharingRepo, toast);
    await useCase.execute('user-1', 'topic-1', ['2026-08-10']);

    expect(repo.scheduleSessions).toHaveBeenCalledWith([
      {
        userId: 'user-1',
        topicId: 'topic-1',
        date: '2026-08-10',
        duration: 120,
        createdBy: 'user-1',
      },
    ]);
    expect(repo.updateTotalDays).toHaveBeenCalledWith('topic-1', 4, 'user-1');
    expect(toast.success).toHaveBeenCalledWith('1 dia(s) adicionado(s) ao tema "React"!');
  });

  it('deve ignorar datas duplicadas (já existentes)', async () => {
    const repo = createMockRepo();
    const sharingRepo = createMockSharingRepo();
    const toast = createMockToast();

    const existingTopic = {
      id: 'topic-1',
      userId: 'user-1',
      name: 'React',
      color: '#3b82f6',
      totalDays: 3,
      hoursPerDay: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getTopicsByUser.mockResolvedValue([existingTopic]);
    repo.getSessionsByDateRange.mockResolvedValue([
      {
        id: 'existing-session',
        userId: 'user-1',
        topicId: 'topic-1',
        date: '2026-08-10',
        completed: false,
        createdAt: new Date(),
      },
    ]);

    const useCase = new AddStudyDayUseCase(repo, sharingRepo, toast);
    await useCase.execute('user-1', 'topic-1', ['2026-08-10']);

    // scheduleSessions não deve ser chamado (todas as datas são duplicadas)
    expect(repo.scheduleSessions).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('As datas selecionadas já possuem sessões agendadas.');
  });

  it('deve rejeitar se nenhuma data fornecida', async () => {
    const repo = createMockRepo();
    const sharingRepo = createMockSharingRepo();
    const toast = createMockToast();

    const useCase = new AddStudyDayUseCase(repo, sharingRepo, toast);
    await expect(useCase.execute('user-1', 'topic-1', [])).rejects.toThrow(ValidationError);
  });

  it('deve rejeitar data com formato inválido', async () => {
    const repo = createMockRepo();
    const sharingRepo = createMockSharingRepo();
    const toast = createMockToast();

    const useCase = new AddStudyDayUseCase(repo, sharingRepo, toast);
    await expect(useCase.execute('user-1', 'topic-1', ['not-a-date'])).rejects.toThrow(
      ValidationError,
    );
  });

  it('deve lançar NotFoundError se tópico não pertencer ao usuário nem compartilhado', async () => {
    const repo = createMockRepo();
    const sharingRepo = createMockSharingRepo();
    const toast = createMockToast();

    repo.getTopicsByUser.mockResolvedValue([]); // usuário não tem tópicos
    sharingRepo.getSharedTopics.mockResolvedValue([]); // nem compartilhados

    const useCase = new AddStudyDayUseCase(repo, sharingRepo, toast);
    await expect(useCase.execute('user-1', 'nonexistent', ['2026-08-10'])).rejects.toThrow(
      NotFoundError,
    );
  });

  it('deve espelhar sessions para invited users se tópico compartilhado', async () => {
    const repo = createMockRepo();
    const sharingRepo = createMockSharingRepo();
    const toast = createMockToast();

    const existingTopic = {
      id: 'topic-1',
      userId: 'owner-1',
      name: 'React',
      color: '#3b82f6',
      totalDays: 3,
      hoursPerDay: 2,
      sharedWith: ['user-2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getTopicsByUser.mockResolvedValue([existingTopic]);
    repo.getSessionsByDateRange.mockResolvedValue([]); // sem duplicatas
    repo.scheduleSessions.mockResolvedValue([]);
    repo.updateTotalDays.mockResolvedValue({
      ...existingTopic,
      totalDays: 4,
    });

    const useCase = new AddStudyDayUseCase(repo, sharingRepo, toast);
    await useCase.execute('owner-1', 'topic-1', ['2026-08-10']);

    // scheduleSessions deve ser chamado 2 vezes: owner + convidado
    expect(repo.scheduleSessions).toHaveBeenCalledTimes(2);

    // Primeira chamada: sessions do owner
    expect(repo.scheduleSessions).toHaveBeenNthCalledWith(1, [
      {
        userId: 'owner-1',
        topicId: 'topic-1',
        date: '2026-08-10',
        duration: 120,
        createdBy: 'owner-1',
      },
    ]);

    // Segunda chamada: sessions espelhadas para o convidado
    expect(repo.scheduleSessions).toHaveBeenNthCalledWith(2, [
      {
        userId: 'user-2',
        topicId: 'topic-1',
        date: '2026-08-10',
        duration: 120,
        createdBy: 'owner-1',
      },
    ]);
  });

  it('deve permitir que usuário convidado adicione dias a tópico compartilhado', async () => {
    const repo = createMockRepo();
    const sharingRepo = createMockSharingRepo();
    const toast = createMockToast();

    const sharedTopic = {
      id: 'topic-1',
      userId: 'owner-1',
      name: 'React',
      color: '#3b82f6',
      totalDays: 3,
      hoursPerDay: 2,
      sharedWith: ['user-2'],
      ownerUserId: 'owner-1',
      isShared: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getTopicsByUser.mockResolvedValue([]); // convidado não tem tópicos próprios
    sharingRepo.getSharedTopics.mockResolvedValue([sharedTopic]);
    repo.getSessionsByDateRange.mockResolvedValue([]); // sem duplicatas
    repo.scheduleSessions.mockResolvedValue([]);
    repo.updateTotalDays.mockResolvedValue({
      ...sharedTopic,
      totalDays: 4,
    });

    const useCase = new AddStudyDayUseCase(repo, sharingRepo, toast);
    await useCase.execute('user-2', 'topic-1', ['2026-08-15']);

    // Deve criar session para o convidado (user-2) com userId = user-2
    expect(repo.scheduleSessions).toHaveBeenCalledWith([
      {
        userId: 'user-2',
        topicId: 'topic-1',
        date: '2026-08-15',
        duration: 120,
        createdBy: 'user-2',
      },
    ]);
    // totalDays deve ser atualizado com o ownerUserId (owner-1)
    expect(repo.updateTotalDays).toHaveBeenCalledWith('topic-1', 4, 'owner-1');
  });
});

// ---- AddReviewDayUseCase ----

describe('AddReviewDayUseCase', () => {
  it('deve adicionar datas ao scheduledDates de uma revisão', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    const existingReview = {
      id: 'review-1',
      userId: 'user-1',
      name: 'Revisão de React',
      color: '#3b82f6',
      scheduledDates: ['2026-08-01', '2026-08-05'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getReviewById.mockResolvedValue(existingReview);
    const updatedReview = {
      ...existingReview,
      scheduledDates: ['2026-08-01', '2026-08-05', '2026-08-10'],
    };
    repo.updateReview.mockResolvedValue(updatedReview);

    const useCase = new AddReviewDayUseCase(repo, toast);
    const result = await useCase.execute('user-1', 'review-1', ['2026-08-10']);

    expect(result.scheduledDates).toEqual(['2026-08-01', '2026-08-05', '2026-08-10']);
    expect(repo.updateReview).toHaveBeenCalledWith('review-1', {
      scheduledDates: ['2026-08-01', '2026-08-05', '2026-08-10'],
    });
    expect(toast.success).toHaveBeenCalledWith(
      '1 dia(s) adicionado(s) à revisão "Revisão de React"!',
    );
  });

  it('deve remover datas duplicadas e ordenar o resultado', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    const existingReview = {
      id: 'review-1',
      userId: 'user-1',
      name: 'Revisão',
      color: '#22c55e',
      scheduledDates: ['2026-08-10'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getReviewById.mockResolvedValue(existingReview);
    repo.updateReview.mockResolvedValue({
      ...existingReview,
      scheduledDates: ['2026-08-01', '2026-08-10', '2026-08-15'],
    });

    const useCase = new AddReviewDayUseCase(repo, toast);
    const result = await useCase.execute('user-1', 'review-1', [
      '2026-08-15',
      '2026-08-10', // duplicada
      '2026-08-01',
    ]);

    expect(result.scheduledDates).toEqual(['2026-08-01', '2026-08-10', '2026-08-15']);
    // Apenas 2 novas datas (15 e 01), 10 é duplicada
    expect(toast.success).toHaveBeenCalledWith('2 dia(s) adicionado(s) à revisão "Revisão"!');
  });

  it('deve informar se todas as datas já existem', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    const existingReview = {
      id: 'review-1',
      userId: 'user-1',
      name: 'Revisão',
      color: '#22c55e',
      scheduledDates: ['2026-08-10', '2026-08-15'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getReviewById.mockResolvedValue(existingReview);

    const useCase = new AddReviewDayUseCase(repo, toast);
    const result = await useCase.execute('user-1', 'review-1', ['2026-08-10', '2026-08-15']);

    // Deve retornar a revisão original sem chamar updateReview
    expect(result).toEqual(existingReview);
    expect(repo.updateReview).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      'As datas selecionadas já estão agendadas para esta revisão.',
    );
  });

  it('deve rejeitar se nenhuma data fornecida', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    const useCase = new AddReviewDayUseCase(repo, toast);
    await expect(useCase.execute('user-1', 'review-1', [])).rejects.toThrow(ValidationError);
  });

  it('deve rejeitar data com formato inválido', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    const useCase = new AddReviewDayUseCase(repo, toast);
    await expect(useCase.execute('user-1', 'review-1', ['10/08/2026'])).rejects.toThrow(
      ValidationError,
    );
  });

  it('deve lançar NotFoundError se revisão não existir', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    repo.getReviewById.mockResolvedValue(null);

    const useCase = new AddReviewDayUseCase(repo, toast);
    await expect(useCase.execute('user-1', 'nonexistent', ['2026-08-10'])).rejects.toThrow(
      NotFoundError,
    );
  });

  it('deve rejeitar se usuário não é dono nem compartilhado', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    repo.getReviewById.mockResolvedValue({
      id: 'review-1',
      userId: 'owner-1',
      name: 'Revisão',
      color: '#3b82f6',
      scheduledDates: ['2026-08-01'],
      createdAt: new Date(),
      updatedAt: new Date(),
      // sem sharedWith
    });

    const useCase = new AddReviewDayUseCase(repo, toast);
    await expect(useCase.execute('stranger', 'review-1', ['2026-08-10'])).rejects.toThrow(
      ValidationError,
    );
  });

  it('deve permitir que usuário compartilhado adicione datas', async () => {
    const repo = createMockReviewRepo();
    const toast = createMockToast();

    const sharedReview = {
      id: 'review-1',
      userId: 'owner-1',
      name: 'Revisão Compartilhada',
      color: '#3b82f6',
      scheduledDates: ['2026-08-01'],
      sharedWith: ['user-2'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repo.getReviewById.mockResolvedValue(sharedReview);
    repo.updateReview.mockResolvedValue({
      ...sharedReview,
      scheduledDates: ['2026-08-01', '2026-08-10'],
    });

    const useCase = new AddReviewDayUseCase(repo, toast);
    const result = await useCase.execute('user-2', 'review-1', ['2026-08-10']);

    expect(result.scheduledDates).toContain('2026-08-10');
    expect(toast.success).toHaveBeenCalled();
  });
});
