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

    // Build query using raw fetch to avoid deep type instantiation
    const params = new URLSearchParams();
    params.set('select', select);
    params.set('order', `${orderBy}.${ascending ? 'asc' : 'desc'}`);
    params.set('offset', from.toString());
    params.set('limit', pageSize.toString());

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, `eq.${value}`);
      }
    });

    // Apply search
    if (searchColumn && searchQuery) {
      params.set(searchColumn, `ilike.*${searchQuery}*`);
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Prefer': 'count=exact',
      },
    });

    const data = await res.json();
    const totalCount = parseInt(res.headers.get('content-range')?.split('/')[1] || '0', 10);

    if (res.ok) {
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
