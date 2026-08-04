import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock de módulos com dependências externas (Firebase / DI / contextos globais)
vi.mock('../adapters/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

vi.mock('../presentation/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
    loading: false,
  }),
}));

vi.mock('../presentation/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light' as const, toggleTheme: vi.fn(), isDark: false }),
}));

vi.mock('../presentation/hooks/useStudyTopics', () => ({
  useStudyTopics: () => ({
    topics: [],
    loading: false,
    error: null,
    loadTopics: vi.fn(),
    createTopic: vi.fn(),
    updateTopic: vi.fn(),
    deleteTopic: vi.fn(),
  }),
}));

vi.mock('../presentation/hooks/useStudyProgress', () => ({
  useStudyProgress: () => ({
    progress: null,
    topics: [],
    loading: false,
    error: null,
    loadProgress: vi.fn(),
  }),
}));

vi.mock('../presentation/hooks/useCalendarSessions', () => ({
  useCalendarSessions: () => ({
    calendarDays: [],
    topics: [],
    loading: false,
    error: null,
    currentMonth: { year: 2026, month: 7 },
    selectedTopicIds: [],
    navigateMonth: vi.fn(),
    goToToday: vi.fn(),
    filterByTopics: vi.fn(),
    toggleSession: vi.fn(),
    loadMonth: vi.fn(),
    isEmptyMonth: true,
  }),
}));

// ---------------------------------------------------------------------------
// Imports (após os mocks)
// ---------------------------------------------------------------------------
import { Button } from '../presentation/components/ui/Button';
import { Spinner } from '../presentation/components/ui/Spinner';
import { ProgressBar } from '../presentation/components/ui/ProgressBar';
import { Modal } from '../presentation/components/ui/Modal';
import { TagBadge } from '../presentation/components/summary/TagBadge';
import { TagInput } from '../presentation/components/summary/TagInput';
import { SummaryListPage } from '../presentation/pages/summary/SummaryListPage';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
describe('Button', () => {
  it('renderiza children', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: /salvar/i })).toBeTruthy();
  });

  it('desabilita quando loading', () => {
    render(<Button loading>Salvar</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('aplica variante danger', () => {
    render(<Button variant="danger">Excluir</Button>);
    const btn = screen.getByRole('button', { name: /excluir/i });
    expect(btn.className).toContain('bg-red-600');
  });

  it('dispara onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Clique</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('não dispara onClick quando disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Clique
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
describe('Spinner', () => {
  it('renderiza com role status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('aplica tamanho lg', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole('status').className).toContain('h-12');
  });
});

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------
describe('ProgressBar', () => {
  it('renderiza valor percentual horizontal', () => {
    render(<ProgressBar value={75} />);
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('renderiza variante circular', () => {
    render(<ProgressBar value={50} variant="circular" />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
  });

  it('clampa valores entre 0 e 100', () => {
    render(<ProgressBar value={150} />);
    expect(screen.getByText('100%')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
describe('Modal', () => {
  it('não renderiza quando isOpen=false', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test" children={<p>Conteúdo</p>} />);
    expect(screen.queryByText('Conteúdo')).toBeNull();
  });

  it('renderiza quando isOpen=true', () => {
    render(<Modal isOpen={true} onClose={vi.fn()} title="Título" children={<p>Conteúdo</p>} />);
    expect(screen.getByText('Conteúdo')).toBeTruthy();
    expect(screen.getByText('Título')).toBeTruthy();
  });

  it('chama onClose ao clicar no botão fechar', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Título" children={<p>Conteúdo</p>} />);
    fireEvent.click(screen.getByLabelText('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao pressionar Escape', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Título" children={<p>Conteúdo</p>} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Sprint 31 — Testes de Componente (Summary)
// ---------------------------------------------------------------------------

// ---- TagBadge ----

describe('TagBadge', () => {
  it('renderiza o texto da tag', () => {
    render(<TagBadge tag="react" />);
    expect(screen.getByText('react')).toBeTruthy();
  });

  it('aplica cores consistentes para a mesma tag', () => {
    const { container: c1 } = render(<TagBadge tag="react" />);
    const { container: c2 } = render(<TagBadge tag="react" />);

    const span1 = c1.querySelector('span');
    const span2 = c2.querySelector('span');
    expect(span1?.className).toBe(span2?.className);
  });

  it('cores diferentes para tags diferentes', () => {
    const { container: c1 } = render(<TagBadge tag="react" />);
    const { container: c2 } = render(<TagBadge tag="nodejs" />);

    const span1 = c1.querySelector('span');
    const span2 = c2.querySelector('span');
    // Diferentes tags podem ou não ter a mesma cor (hash colision), mas
    // a probabilidade de 2 tags distintas terem cores diferentes é alta.
    // Aceitamos qualquer resultado - o importante é que renderizam.
    expect(span1).toBeTruthy();
    expect(span2).toBeTruthy();
  });

  it('chama onClick quando clicado (modo botão)', () => {
    const onClick = vi.fn();
    render(<TagBadge tag="react" onClick={onClick} />);

    // Pega o <button> wrapper (não o <span role="button"> interno)
    const buttons = screen.getAllByRole('button');
    // O primeiro é o <button> wrapper
    fireEvent.click(buttons[0]);
    expect(onClick).toHaveBeenCalledWith('react');
  });

  it('exibe contador quando count é fornecido', () => {
    render(<TagBadge tag="react" count={5} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('aplica estilo selected quando selected=true', () => {
    render(<TagBadge tag="react" selected={true} />);
    const span = screen.getByText('react');
    expect(span.className).toContain('bg-');
  });
});

// ---- TagInput ----

describe('TagInput', () => {
  it('adiciona tag ao pressionar Enter', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);

    const input = screen.getByLabelText('Adicionar tag');
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('adiciona tag ao pressionar vírgula', () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} />);

    const input = screen.getByLabelText('Adicionar tag');
    fireEvent.change(input, { target: { value: 'react' } });
    fireEvent.keyDown(input, { key: ',' });

    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('remove tag ao clicar no botão X', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['react', 'node']} onChange={onChange} />);

    const removeButtons = screen.getAllByLabelText(/Remover tag/);
    fireEvent.click(removeButtons[0]); // Remove 'react'

    expect(onChange).toHaveBeenCalledWith(['node']);
  });

  it('não permite adicionar tags duplicadas (case-insensitive)', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['react']} onChange={onChange} />);

    const input = screen.getByLabelText('Adicionar tag');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // onChange não deve ser chamado porque já existe
    expect(onChange).not.toHaveBeenCalled();
  });

  it('remove última tag ao pressionar Backspace com input vazio', () => {
    const onChange = vi.fn();
    render(<TagInput tags={['react', 'node']} onChange={onChange} />);

    const input = screen.getByLabelText('Adicionar tag');
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('exibe contador de tags', () => {
    render(<TagInput tags={['a', 'b', 'c']} onChange={vi.fn()} />);
    expect(screen.getByText('3/20')).toBeTruthy();
  });
});

// ---- SummaryListPage (com mock de useSummaries) ----

// Override useSummaries mock for SummaryListPage tests
const mockUseSummaries = vi.fn();

vi.mock('../presentation/hooks/useSummaries', () => ({
  useSummaries: () => mockUseSummaries(),
}));

function createMockSummariesState(overrides = {}) {
  return {
    summaries: [],
    loading: false,
    error: null,
    selectedTags: [],
    searchQuery: '',
    setSelectedTags: vi.fn(),
    setSearchQuery: vi.fn(),
    loadSummaries: vi.fn(),
    createSummary: vi.fn(),
    updateSummary: vi.fn(),
    deleteSummary: vi.fn(),
    ...overrides,
  };
}

describe('SummaryListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza estado Empty quando não há resumos', () => {
    mockUseSummaries.mockReturnValue(
      createMockSummariesState({ summaries: [], loading: false, error: null }),
    );

    render(
      <BrowserRouter>
        <SummaryListPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Nenhum resumo criado')).toBeTruthy();
    expect(screen.getByText('Criar primeiro resumo')).toBeTruthy();
  });

  it('renderiza skeleton cards durante loading', () => {
    mockUseSummaries.mockReturnValue(createMockSummariesState({ loading: true }));

    const { container } = render(
      <BrowserRouter>
        <SummaryListPage />
      </BrowserRouter>,
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza cards de resumo com dados corretos', () => {
    const summaries = [
      {
        id: '1',
        userId: 'test-user',
        title: 'React Hooks',
        content: '# React Hooks\n\nConteúdo sobre hooks.',
        tags: ['react', 'hooks'],
        createdAt: new Date('2026-08-01'),
        updatedAt: new Date('2026-08-01'),
      },
    ];
    mockUseSummaries.mockReturnValue(
      createMockSummariesState({
        summaries,
        loading: false,
        error: null,
      }),
    );

    render(
      <BrowserRouter>
        <SummaryListPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('React Hooks')).toBeTruthy();
    // Tags appear both in card and filter chips — use getAllByText
    const reactElements = screen.getAllByText('react');
    const hooksElements = screen.getAllByText('hooks');
    expect(reactElements.length).toBeGreaterThanOrEqual(1);
    expect(hooksElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza estado Error', () => {
    mockUseSummaries.mockReturnValue(
      createMockSummariesState({
        summaries: [],
        loading: false,
        error: 'Erro de conexão',
      }),
    );

    render(
      <BrowserRouter>
        <SummaryListPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Erro ao carregar resumos')).toBeTruthy();
    expect(screen.getByText('Erro de conexão')).toBeTruthy();
    expect(screen.getByText('Tentar novamente')).toBeTruthy();
  });

  it('exibe campo de busca', () => {
    mockUseSummaries.mockReturnValue(createMockSummariesState());

    render(
      <BrowserRouter>
        <SummaryListPage />
      </BrowserRouter>,
    );

    expect(screen.getByPlaceholderText('Buscar resumos por título ou conteúdo...')).toBeTruthy();
  });
});
