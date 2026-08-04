import { useState, useCallback, useRef, useEffect } from 'react';
import type { Summary, CreateSummaryInput, UpdateSummaryInput } from '../../core/entities/Summary';
import { container } from '../../di/container';
import { handleError } from '../../shared/errorHandler';

interface UseSummariesReturn {
  summaries: Summary[];
  loading: boolean;
  error: string | null;
  selectedTags: string[];
  searchQuery: string;
  setSelectedTags: (tags: string[]) => void;
  setSearchQuery: (query: string) => void;
  loadSummaries: (userId: string) => Promise<void>;
  createSummary: (userId: string, input: CreateSummaryInput) => Promise<Summary | null>;
  updateSummary: (
    summaryId: string,
    userId: string,
    input: UpdateSummaryInput,
  ) => Promise<Summary | null>;
  deleteSummary: (summaryId: string, userId: string) => Promise<boolean>;
}

export function useSummaries(): UseSummariesReturn {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const userIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSummaries = useCallback(
    async (userId: string) => {
      setLoading(true);
      setError(null);
      try {
        userIdRef.current = userId;
        const filters: { tags?: string[]; query?: string } = {};
        if (selectedTags.length > 0) filters.tags = selectedTags;
        if (searchQuery.trim()) filters.query = searchQuery.trim();

        const result = await container.useCases.getSummaries.execute(userId, filters);
        setSummaries(result);
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
      } finally {
        setLoading(false);
      }
    },
    [selectedTags, searchQuery],
  );

  // Reload when filters change (with debounce for search)
  useEffect(() => {
    if (!userIdRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadSummaries(userIdRef.current!);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [selectedTags, searchQuery, loadSummaries]);

  const createSummary = useCallback(
    async (userId: string, input: CreateSummaryInput): Promise<Summary | null> => {
      setError(null);
      try {
        const created = await container.useCases.createSummary.execute(userId, input);
        setSummaries((prev) => [created, ...prev]);
        container.toastService.success('Resumo criado com sucesso! 📝');
        return created;
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
        return null;
      }
    },
    [],
  );

  const updateSummary = useCallback(
    async (
      summaryId: string,
      userId: string,
      input: UpdateSummaryInput,
    ): Promise<Summary | null> => {
      setError(null);
      try {
        const updated = await container.useCases.updateSummary.execute(userId, summaryId, input);
        setSummaries((prev) => prev.map((s) => (s.id === summaryId ? updated : s)));
        container.toastService.success('Resumo atualizado! 📝');
        return updated;
      } catch (err) {
        const message = handleError(err);
        setError(message);
        container.toastService.error(message);
        return null;
      }
    },
    [],
  );

  const deleteSummary = useCallback(async (summaryId: string, userId: string): Promise<boolean> => {
    setError(null);
    try {
      await container.useCases.deleteSummary.execute(userId, summaryId);
      setSummaries((prev) => prev.filter((s) => s.id !== summaryId));
      container.toastService.success('Resumo excluído');
      return true;
    } catch (err) {
      const message = handleError(err);
      setError(message);
      container.toastService.error(message);
      return false;
    }
  }, []);

  return {
    summaries,
    loading,
    error,
    selectedTags,
    searchQuery,
    setSelectedTags,
    setSearchQuery,
    loadSummaries,
    createSummary,
    updateSummary,
    deleteSummary,
  };
}
