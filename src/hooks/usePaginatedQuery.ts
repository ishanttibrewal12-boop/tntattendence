import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaginationState<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UsePaginatedQueryOptions {
  table: string;
  select?: string;
  pageSize?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
  searchColumn?: string;
  searchQuery?: string;
}

export function usePaginatedQuery<T = any>(options: UsePaginatedQueryOptions) {
  const {
    table,
    select = '*',
    pageSize = 50,
    orderBy = 'created_at',
    ascending = false,
    filters = {},
    searchColumn,
    searchQuery,
  } = options;

  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    totalCount: 0,
    currentPage: 0,
    pageSize,
    totalPages: 0,
    isLoading: true,
    hasNext: false,
    hasPrev: false,
  });

  const fetchPage = useCallback(async (page: number) => {
    setState(prev => ({ ...prev, isLoading: true }));

    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from(table)
      .select(select, { count: 'exact' })
      .order(orderBy, { ascending })
      .range(from, to);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    // Apply search
    if (searchColumn && searchQuery) {
      query = query.ilike(searchColumn, `%${searchQuery}%`);
    }

    const { data, count, error } = await query;

    if (!error) {
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      setState({
        data: (data || []) as T[],
        totalCount,
        currentPage: page,
        pageSize,
        totalPages,
        isLoading: false,
        hasNext: page < totalPages - 1,
        hasPrev: page > 0,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [table, select, pageSize, orderBy, ascending, JSON.stringify(filters), searchColumn, searchQuery]);

  const nextPage = useCallback(() => {
    if (state.hasNext) fetchPage(state.currentPage + 1);
  }, [state.hasNext, state.currentPage, fetchPage]);

  const prevPage = useCallback(() => {
    if (state.hasPrev) fetchPage(state.currentPage - 1);
  }, [state.hasPrev, state.currentPage, fetchPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < state.totalPages) fetchPage(page);
  }, [state.totalPages, fetchPage]);

  const refresh = useCallback(() => {
    fetchPage(state.currentPage);
  }, [state.currentPage, fetchPage]);

  return {
    ...state,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    fetchPage,
  };
}
