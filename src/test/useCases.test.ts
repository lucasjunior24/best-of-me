import { describe, it, expect, vi } from 'vitest';
import { CreateStudyTopicUseCase } from '../core/useCases/CreateStudyTopicUseCase';
import { DeleteStudyTopicUseCase } from '../core/useCases/DeleteStudyTopicUseCase';
import { ToggleSessionCompletionUseCase } from '../core/useCases/ToggleSessionCompletionUseCase';
import { GetStudyProgressUseCase } from '../core/useCases/GetStudyProgressUseCase';
import { GetCalendarSessionsUseCase } from '../core/useCases/GetCalendarSessionsUseCase';
import { UpdateStudyTopicUseCase } from '../core/useCases/UpdateStudyTopicUseCase';
import { ValidationError } from '../shared/errorHandler';

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
    const result = await useCase.execute('topic-1', { name: 'React Avançado', totalDays: 5 });

    expect(result).toEqual(updatedTopic);
    expect(toast.success).toHaveBeenCalledWith('Tema atualizado!');
  });
});
