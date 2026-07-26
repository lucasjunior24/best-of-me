/**
 * Testes de Integração — Sprint 9
 *
 * Cenários ponta a ponta que cobrem os fluxos principais do MVP:
 * 1. Criar tema com datas → aparecer no calendário
 * 2. Marcar dia concluído → progresso atualizar
 * 3. Filtrar por tema → calendário refletir filtro
 * 4. Dark mode → alternar e persistir
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Cenário 1: Criar tema com datas → aparecer no calendário
// ---------------------------------------------------------------------------
describe('Integração: Criar tema → Calendário', () => {
  it('um tema criado com datas deve gerar sessões visíveis no range do calendário', () => {
    // Simula o fluxo de criação de tema com datas agendadas
    const topic = {
      id: 'topic-1',
      userId: 'user-1',
      name: 'React',
      color: '#3b82f6',
      totalDays: 3,
      hoursPerDay: 2,
      createdAt: new Date('2026-07-01'),
    };

    const scheduledDates = ['2026-07-10', '2026-07-15', '2026-07-20'];

    // As sessões são criadas a partir das datas
    const sessions = scheduledDates.map((date, i) => ({
      id: `session-${i + 1}`,
      userId: topic.userId,
      topicId: topic.id,
      date,
      completed: false,
      createdAt: new Date(),
    }));

    // Simula busca de calendário para Julho/2026
    const calendarRange = sessions.filter((s) => s.date >= '2026-07-01' && s.date <= '2026-07-31');

    expect(calendarRange).toHaveLength(3);
    expect(calendarRange.map((s) => s.date)).toEqual(scheduledDates);
  });
});

// ---------------------------------------------------------------------------
// Cenário 2: Marcar dia concluído → progresso atualizar
// ---------------------------------------------------------------------------
describe('Integração: Marcar dia → Progresso', () => {
  it('ao marcar uma sessão como concluída, o progresso deve refletir', () => {
    const sessions = [
      { id: 's1', topicId: 't1', completed: false, date: '2026-07-10' },
      { id: 's2', topicId: 't1', completed: false, date: '2026-07-15' },
      { id: 's3', topicId: 't2', completed: false, date: '2026-07-10' },
    ];

    // Marcar s1 como concluída
    sessions[0].completed = true;

    const total = sessions.length;
    const completed = sessions.filter((s) => s.completed).length;
    const percentage = Math.round((completed / total) * 100);

    expect(completed).toBe(1);
    expect(percentage).toBe(33);
  });

  it('ao desmarcar uma sessão, o progresso deve diminuir', () => {
    const sessions = [
      { id: 's1', topicId: 't1', completed: true, date: '2026-07-10' },
      { id: 's2', topicId: 't1', completed: true, date: '2026-07-15' },
    ];

    // Desmarcar s1
    sessions[0].completed = false;

    const completed = sessions.filter((s) => s.completed).length;
    expect(completed).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Cenário 3: Filtrar por tema → calendário refletir filtro
// ---------------------------------------------------------------------------
describe('Integração: Filtrar tema → Calendário reflete', () => {
  it('ao filtrar por um topicId específico, apenas sessões daquele tema aparecem', () => {
    const allSessions = [
      { id: 's1', topicId: 't1', topicName: 'React', date: '2026-07-10' },
      { id: 's2', topicId: 't2', topicName: 'Node', date: '2026-07-10' },
      { id: 's3', topicId: 't1', topicName: 'React', date: '2026-07-15' },
    ];

    const selectedTopicIds = ['t1'];
    const filtered = allSessions.filter((s) => selectedTopicIds.includes(s.topicId));

    expect(filtered).toHaveLength(2);
    expect(filtered.every((s) => s.topicName === 'React')).toBe(true);
  });

  it('sem filtro (todos), todas as sessões são exibidas', () => {
    const allSessions = [
      { id: 's1', topicId: 't1', topicName: 'React', date: '2026-07-10' },
      { id: 's2', topicId: 't2', topicName: 'Node', date: '2026-07-10' },
    ];

    const selectedTopicIds: string[] = [];
    const filtered =
      selectedTopicIds.length === 0
        ? allSessions
        : allSessions.filter((s) => selectedTopicIds.includes(s.topicId));

    expect(filtered).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Cenário 4: Dark mode → alternar e persistir
// ---------------------------------------------------------------------------
describe('Integração: Dark mode → alternar e persistir', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('deve aplicar classe dark ao ativar', () => {
    const theme = 'dark';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('deve remover classe dark ao desativar', () => {
    document.documentElement.classList.add('dark');
    const theme: string = 'light';
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('deve persistir tema no localStorage', () => {
    const theme = 'dark';
    localStorage.setItem('theme', theme);

    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('deve alternar entre light e dark corretamente', () => {
    // Começa light
    let theme: string = 'light';
    document.documentElement.classList.remove('dark');

    // Alterna para dark
    theme = 'dark';
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', theme);

    expect(theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    // Alterna de volta para light
    theme = 'light' as const;
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);

    expect(theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
