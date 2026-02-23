import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { STOCKS } from '../lib/constants';
import { UserProfile } from '../backend';

export function useMarketData() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      if (!actor) return {};
      
      const data: Record<string, number> = {};
      STOCKS.forEach((symbol) => {
        const base = symbol === 'NIFTY' ? 22500 : symbol === 'BANKNIFTY' ? 47800 : Math.random() * 2000 + 500;
        data[symbol] = base + (Math.random() - 0.5) * base * 0.02;
      });
      
      return data;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 1000,
  });
}

export function useWatchlist() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getWatchlist();
      } catch {
        return [
          ['NIFTY', 22500],
          ['BANKNIFTY', 47800],
          ['RELIANCE', 2500],
          ['INFY', 1500],
        ] as Array<[string, number]>;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stockList: Array<[string, number]>) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addToWatchlist(stockList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useSignup() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ username, password, profile }: { username: string; password: string; profile: UserProfile }) => {
      if (!actor) throw new Error('Actor not initialized');
      
      // Register user with empty adminToken (non-admin signup)
      await actor.registerUser('', username);
      
      // Save user profile
      await actor.saveCallerUserProfile(profile);
    },
  });
}
