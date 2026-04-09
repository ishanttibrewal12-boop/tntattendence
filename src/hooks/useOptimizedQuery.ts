import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

// Centralized cache config for different data types
const CACHE_CONFIG = {
  static: { staleTime: 1000 * 60 * 30, gcTime: 1000 * 60 * 60 }, // 30m stale, 1h gc (staff list, settings)
  semi: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30 },   // 5m stale, 30m gc (attendance, advances)
  live: { staleTime: 1000 * 60 * 1, gcTime: 1000 * 60 * 10 },    // 1m stale, 10m gc (dashboard KPIs)
} as const;

type CacheType = keyof typeof CACHE_CONFIG;

export function useSupabaseQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  cacheType: CacheType = 'semi',
  enabled = true
) {
  const config = CACHE_CONFIG[cacheType];
  return useQuery({
    queryKey: key,
    queryFn,
    ...config,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}

// Hook to subscribe to realtime changes and invalidate queries
export function useRealtimeInvalidation(table: string, queryKeys: string[][]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, queryClient]);
}

// Prefetch dashboard data on app load
export function usePrefetchDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Prefetch staff counts
    queryClient.prefetchQuery({
      queryKey: ['staff', 'counts'],
      queryFn: async () => {
        const { count } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        return count || 0;
      },
      ...CACHE_CONFIG.static,
    });

    // Prefetch pending advances
    queryClient.prefetchQuery({
      queryKey: ['advances', 'pending'],
      queryFn: async () => {
        const { data } = await supabase
          .from('advances')
          .select('amount')
          .eq('is_deducted', false);
        return (data || []).reduce((sum, a) => sum + Number(a.amount), 0);
      },
      ...CACHE_CONFIG.semi,
    });
  }, [queryClient]);
}
