import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock de módulos com dependências externas (Firebase / DI / contextos globais)
vi.mock('../../adapters/firebase/config', () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

vi.mock('../../presentation/hooks/useAuth', () => ({
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

vi.mock('../../presentation/hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light' as const, toggleTheme: vi.fn(), isDark: false }),
}));

vi.mock('../../presentation/hooks/useStudyTopics', () => ({
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

vi.mock('../../presentation/hooks/useStudyProgress', () => ({
  useStudyProgress: () => ({
    progress: null,
    topics: [],
    loading: false,
    error: null,
    loadProgress: vi.fn(),
  }),
}));

vi.mock('../../presentation/hooks/useCalendarSessions', () => ({
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
