import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useEffect, useRef, useState, useCallback } from 'react';
import { FO_SYMBOLS } from '../lib/constants';
import type { MarketSymbolData } from '../backend';
import { fetchFOStockList, fetchAllIndices, triggerMarketRefresh } from '../lib/nseClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LiveStockData {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  changePercent: number;
  volume: number;
  vwap: number;
  oi: number;
  deltaOI: number;
  iv: number;
  prevLtp: number;
  cumulativePV: number;
  cumulativeVol: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  prevValue: number;
  /** Realistic bounds to prevent random-walk drift */
  minBound: number;
  maxBound: number;
}

export interface SectorData {
  name: string;
  changePercent: number;
  prevChangePercent: number;
}

export interface LiveMarketState {
  stocks: Record<string, LiveStockData>;
  indices: MarketIndex[];
  sectors: SectorData[];
  lastUpdated: Date;
  isLive: boolean;
}

// ─── NSE Fetch Status ─────────────────────────────────────────────────────────

export type NSEFetchStatus = 'live' | 'delayed' | 'offline';

export interface NSEDataStatus {
  lastFetchTime: Date | null;
  status: NSEFetchStatus;
  hasError: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

// Corrected realistic NSE index seed values (as of Feb 2026)
// NIFTY 50 ~25,450 | BANK NIFTY ~60,890 | SENSEX ~84,000 | FINNIFTY ~23,800 | VIX ~14
const INDEX_SEEDS: MarketIndex[] = [
  {
    name: 'NIFTY 50',
    value: 25450.0,
    change: 120.3,
    changePercent: 0.47,
    prevValue: 25450.0,
    minBound: 22000,
    maxBound: 29000,
  },
  {
    name: 'BANK NIFTY',
    value: 60890.0,
    change: -85.4,
    changePercent: -0.14,
    prevValue: 60890.0,
    minBound: 54000,
    maxBound: 68000,
  },
  {
    name: 'SENSEX',
    value: 84200.0,
    change: 310.6,
    changePercent: 0.37,
    prevValue: 84200.0,
    minBound: 74000,
    maxBound: 94000,
  },
  {
    name: 'FINNIFTY',
    value: 23800.0,
    change: 45.8,
    changePercent: 0.19,
    prevValue: 23800.0,
    minBound: 20000,
    maxBound: 27000,
  },
  {
    name: 'INDIA VIX',
    value: 14.25,
    change: -0.35,
    changePercent: -2.4,
    prevValue: 14.25,
    minBound: 8,
    maxBound: 35,
  },
];

const SECTOR_SEEDS: SectorData[] = [
  { name: 'NIFTY IT', changePercent: 1.2, prevChangePercent: 1.2 },
  { name: 'NIFTY BANK', changePercent: -0.3, prevChangePercent: -0.3 },
  { name: 'NIFTY AUTO', changePercent: 0.8, prevChangePercent: 0.8 },
  { name: 'NIFTY PHARMA', changePercent: 0.5, prevChangePercent: 0.5 },
  { name: 'NIFTY FMCG', changePercent: -0.1, prevChangePercent: -0.1 },
  { name: 'NIFTY METAL', changePercent: 1.5, prevChangePercent: 1.5 },
  { name: 'NIFTY ENERGY', changePercent: 0.3, prevChangePercent: 0.3 },
  { name: 'NIFTY REALTY', changePercent: -0.7, prevChangePercent: -0.7 },
];

// Base prices for F&O stocks (used as fallback when NSE data unavailable)
// Realistic NSE cash market prices as of Feb 2026
const BASE_PRICES: Record<string, number> = {
  RELIANCE: 1280.0,   TCS: 3920.0,      INFY: 1780.0,     HDFCBANK: 1650.0,  ICICIBANK: 1120.0,
  SBIN: 780.0,        WIPRO: 520.0,      AXISBANK: 1180.0,  KOTAKBANK: 1820.0, LT: 3450.0,
  BAJFINANCE: 7200.0, MARUTI: 12500.0,   TITAN: 3600.0,     SUNPHARMA: 1680.0, ULTRACEMCO: 9800.0,
  NESTLEIND: 2450.0,  POWERGRID: 320.0,  NTPC: 380.0,       ONGC: 280.0,       COALINDIA: 450.0,
  ADANIENT: 2800.0,   ADANIPORTS: 1350.0, TATAMOTORS: 980.0, TATASTEEL: 165.0,  JSWSTEEL: 920.0,
  HINDALCO: 680.0,    VEDL: 450.0,       GRASIM: 2400.0,    ASIANPAINT: 3200.0, BAJAJFINSV: 1680.0,
  HCLTECH: 1580.0,    TECHM: 1680.0,     DIVISLAB: 5200.0,  DRREDDY: 6800.0,   CIPLA: 1580.0,
  EICHERMOT: 4800.0,  HEROMOTOCO: 5200.0, APOLLOHOSP: 7200.0, BRITANNIA: 5800.0, DABUR: 620.0,
  GODREJCP: 1380.0,   HINDUNILVR: 2680.0, ITC: 480.0,        MARICO: 680.0,     PIDILITIND: 3200.0,
  BERGEPAINT: 580.0,  COLPAL: 3200.0,    EMAMILTD: 780.0,   TATACONSUM: 1180.0, UBL: 1980.0,
};

function seedPrice(symbol: string): number {
  return BASE_PRICES[symbol] ?? (100 + (symbol.charCodeAt(0) % 50) * 20 + Math.random() * 500);
}

function initStockData(symbol: string, snapshot?: MarketSymbolData): LiveStockData {
  const base = snapshot ? snapshot.lastPrice : seedPrice(symbol);
  const open = base * (1 + (Math.random() - 0.5) * 0.01);
  const high = base * (1 + Math.random() * 0.015);
  const low = base * (1 - Math.random() * 0.015);
  const vol = snapshot ? Number(snapshot.volume) : Math.floor(50000 + Math.random() * 500000);
  const oi = snapshot ? Number(snapshot.oi) : Math.floor(100000 + Math.random() * 2000000);
  return {
    symbol,
    ltp: base,
    open,
    high,
    low,
    close: base * (1 + (Math.random() - 0.5) * 0.005),
    changePercent: snapshot ? snapshot.changePercent : (Math.random() - 0.5) * 4,
    volume: vol,
    vwap: base * (1 + (Math.random() - 0.5) * 0.003),
    oi,
    deltaOI: Math.floor((Math.random() - 0.5) * 10000),
    iv: 15 + Math.random() * 30,
    prevLtp: base,
    cumulativePV: base * vol,
    cumulativeVol: vol,
  };
}

// ─── Random Walk (fallback when NSE data unavailable) ─────────────────────────

function randomWalk(stock: LiveStockData): LiveStockData {
  const changePct = (Math.random() - 0.5) * 0.004;
  const newLtp = stock.ltp * (1 + changePct);
  const newHigh = Math.max(stock.high, newLtp);
  const newLow = Math.min(stock.low, newLtp);
  const addVol = Math.floor(100 + Math.random() * 2000);
  const newVol = stock.volume + addVol;
  const newCumPV = stock.cumulativePV + newLtp * addVol;
  const newCumVol = stock.cumulativeVol + addVol;
  const newVwap = newCumPV / newCumVol;
  const newOI = Math.max(0, stock.oi + Math.floor((Math.random() - 0.5) * 5000));
  const newDeltaOI = newOI - stock.oi;
  const newIV = Math.max(5, stock.iv + (Math.random() - 0.5) * 0.5);
  const newChangePercent = ((newLtp - stock.open) / stock.open) * 100;

  return {
    ...stock,
    prevLtp: stock.ltp,
    ltp: newLtp,
    high: newHigh,
    low: newLow,
    changePercent: newChangePercent,
    volume: newVol,
    vwap: newVwap,
    oi: newOI,
    deltaOI: newDeltaOI,
    iv: newIV,
    cumulativePV: newCumPV,
    cumulativeVol: newCumVol,
  };
}

function randomWalkIndex(idx: MarketIndex): MarketIndex {
  const changePct = (Math.random() - 0.5) * 0.002;
  let newValue = idx.value * (1 + changePct);

  // Clamp to realistic bounds to prevent drift
  newValue = Math.max(idx.minBound, Math.min(idx.maxBound, newValue));

  const newChange = idx.change + (Math.random() - 0.5) * 5;
  const newChangePercent = idx.changePercent + (Math.random() - 0.5) * 0.05;
  return {
    ...idx,
    prevValue: idx.value,
    value: newValue,
    change: newChange,
    changePercent: newChangePercent,
  };
}

function randomWalkSector(s: SectorData): SectorData {
  const delta = (Math.random() - 0.5) * 0.1;
  return { ...s, prevChangePercent: s.changePercent, changePercent: s.changePercent + delta };
}

// ─── Module-level singleton state ─────────────────────────────────────────────

// Force reset state on module reload so corrected seed values take effect
let _state: LiveMarketState | null = null;
let _listeners: Array<(state: LiveMarketState) => void> = [];
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _nsePollingId: ReturnType<typeof setInterval> | null = null;

// NSE fetch status (module-level so all hooks share it)
let _nseStatus: NSEDataStatus = {
  lastFetchTime: null,
  status: 'offline',
  hasError: false,
};
let _nseStatusListeners: Array<(status: NSEDataStatus) => void> = [];

function notifyNSEStatus(status: NSEDataStatus) {
  _nseStatus = status;
  _nseStatusListeners.forEach((fn) => fn(status));
}

function computeNSEStatus(lastFetch: Date | null, hasError: boolean): NSEFetchStatus {
  if (!lastFetch || hasError) return 'offline';
  const secondsAgo = (Date.now() - lastFetch.getTime()) / 1000;
  if (secondsAgo <= 15) return 'live';
  if (secondsAgo <= 60) return 'delayed';
  return 'offline';
}

function getState(): LiveMarketState {
  if (!_state) {
    const stocks: Record<string, LiveStockData> = {};
    FO_SYMBOLS.forEach((sym) => {
      stocks[sym] = initStockData(sym);
    });
    _state = {
      stocks,
      // Deep-copy INDEX_SEEDS so mutations don't affect the seed constants
      indices: INDEX_SEEDS.map((idx) => ({ ...idx })),
      sectors: SECTOR_SEEDS.map((s) => ({ ...s })),
      lastUpdated: new Date(),
      isLive: true,
    };
  }
  return _state;
}

/** Force-reset the singleton so corrected seed values are picked up immediately */
function resetState() {
  _state = null;
  getState(); // re-initialize with corrected seeds
  _listeners.forEach((fn) => fn(_state!));
}

function tick() {
  const prev = getState();
  const newStocks: Record<string, LiveStockData> = {};
  Object.keys(prev.stocks).forEach((sym) => {
    newStocks[sym] = randomWalk(prev.stocks[sym]);
  });
  _state = {
    stocks: newStocks,
    indices: prev.indices.map(randomWalkIndex),
    sectors: prev.sectors.map(randomWalkSector),
    lastUpdated: new Date(),
    isLive: true,
  };
  _listeners.forEach((fn) => fn(_state!));
}

function subscribe(fn: (state: LiveMarketState) => void) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

function subscribeNSEStatus(fn: (status: NSEDataStatus) => void) {
  _nseStatusListeners.push(fn);
  return () => {
    _nseStatusListeners = _nseStatusListeners.filter((l) => l !== fn);
  };
}

function startInterval() {
  if (_intervalId) return;
  _intervalId = setInterval(tick, 1000);
}

function stopInterval() {
  if (_intervalId) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  if (_nsePollingId) {
    clearInterval(_nsePollingId);
    _nsePollingId = null;
  }
}

function seedFromSnapshot(snapshots: MarketSymbolData[]) {
  if (!_state) getState();
  const newStocks: Record<string, LiveStockData> = { ..._state!.stocks };
  snapshots.forEach((snap) => {
    if (snap.symbol && snap.symbol !== 'RAW_JSON') {
      newStocks[snap.symbol] = initStockData(snap.symbol, snap);
    }
  });
  _state = { ..._state!, stocks: newStocks, lastUpdated: new Date() };
  _listeners.forEach((fn) => fn(_state!));
}

function seedIndicesFromSnapshot(
  indicesData: Array<{ name: string; lastPrice: number; changePercent: number; volume: bigint; oi: bigint }>
) {
  if (!_state) getState();
  if (indicesData.length === 0) return;

  const updatedIndices = _state!.indices.map((idx) => {
    const live = indicesData.find((d) => d.name === idx.name);
    if (!live) return idx;
    const newValue = live.lastPrice;
    const newChangePercent = live.changePercent;
    const newChange = (newValue * newChangePercent) / 100;
    return {
      ...idx,
      prevValue: idx.value,
      value: newValue,
      change: newChange,
      changePercent: newChangePercent,
    };
  });

  _state = { ..._state!, indices: updatedIndices, lastUpdated: new Date() };
  _listeners.forEach((fn) => fn(_state!));
}

// ─── NSE Polling Engine ───────────────────────────────────────────────────────

type ActorRef = {
  refreshMarketData: () => Promise<string>;
  getMarketSnapshot: () => Promise<MarketSymbolData[]>;
  getIndicesSnapshot: () => Promise<Array<{ name: string; lastPrice: number; changePercent: number; volume: bigint; oi: bigint }>>;
} | null;

let _actorRef: ActorRef = null;
let _nsePollingStarted = false;

async function runNSEFetchCycle() {
  if (!_actorRef) return;

  try {
    // Trigger backend HTTP outcall to NSE
    await triggerMarketRefresh(_actorRef);

    // Fetch updated snapshots
    const [stocks, indices] = await Promise.all([
      fetchFOStockList(_actorRef),
      fetchAllIndices(_actorRef),
    ]);

    // Update state if we got real data
    if (stocks.length > 0) {
      seedFromSnapshot(stocks);
    }
    if (indices.length > 0) {
      seedIndicesFromSnapshot(indices);
    }

    // Update NSE status
    const now = new Date();
    notifyNSEStatus({
      lastFetchTime: now,
      status: 'live',
      hasError: false,
    });
  } catch {
    // On error, retain last cached data but mark as errored
    notifyNSEStatus({
      lastFetchTime: _nseStatus.lastFetchTime,
      status: computeNSEStatus(_nseStatus.lastFetchTime, true),
      hasError: true,
    });
  }
}

function startNSEPolling(actor: ActorRef) {
  _actorRef = actor;
  if (_nsePollingStarted) return;
  _nsePollingStarted = true;

  // Initial fetch
  runNSEFetchCycle();

  // Poll every 5 seconds
  _nsePollingId = setInterval(() => {
    runNSEFetchCycle();
    // Also update status age on each tick
    notifyNSEStatus({
      ..._nseStatus,
      status: computeNSEStatus(_nseStatus.lastFetchTime, _nseStatus.hasError),
    });
  }, 5000);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveMarketData() {
  const [state, setState] = useState<LiveMarketState>(getState);

  useEffect(() => {
    // On mount, check if current index values are out of realistic bounds.
    // If so, reset to corrected seed values (handles stale module-level state
    // from previous sessions with wrong seed values).
    const currentState = getState();
    const nifty = currentState.indices.find((i) => i.name === 'NIFTY 50');
    const bankNifty = currentState.indices.find((i) => i.name === 'BANK NIFTY');
    const niftyOutOfBounds = nifty && (nifty.value < 22000 || nifty.value > 29000);
    const bankNiftyOutOfBounds = bankNifty && (bankNifty.value < 54000 || bankNifty.value > 68000);

    if (niftyOutOfBounds || bankNiftyOutOfBounds) {
      resetState();
    }

    const unsub = subscribe(setState);
    startInterval();
    return () => {
      unsub();
    };
  }, []);

  return state;
}

export function useNSEDataStatus() {
  const [status, setStatus] = useState<NSEDataStatus>(_nseStatus);

  useEffect(() => {
    const unsub = subscribeNSEStatus(setStatus);
    // Update status every second to reflect age
    const timer = setInterval(() => {
      setStatus({
        ..._nseStatus,
        status: computeNSEStatus(_nseStatus.lastFetchTime, _nseStatus.hasError),
      });
    }, 1000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  return status;
}

// ─── NSE Polling Hook (call once at app root) ─────────────────────────────────

export function useNSEPolling() {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) return;
    startNSEPolling(actor as ActorRef);
  }, [actor, isFetching]);
}

// ─── Backend Snapshot Hooks ───────────────────────────────────────────────────

export function useGetMarketSnapshot() {
  const { actor, isFetching } = useActor();
  return useQuery<MarketSymbolData[]>({
    queryKey: ['marketSnapshot'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const data = await actor.getAllMarketSymbols();
        const filtered = data.filter(
          (d) => d.symbol !== 'RAW_JSON' && d.symbol !== 'raw_equities_data'
        );
        if (filtered.length > 0) {
          seedFromSnapshot(filtered);
        }
        return filtered;
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
  });
}

export function useSaveMarketSnapshot() {
  const { actor } = useActor();

  const save = useCallback(
    async (stocks: Record<string, LiveStockData>) => {
      if (!actor) return;
      const entries = Object.values(stocks).slice(0, 50);
      for (const s of entries) {
        try {
          await actor.updateMarketSymbolData(s.symbol, {
            symbol: s.symbol,
            lastPrice: s.ltp,
            changePercent: s.changePercent,
            volume: BigInt(s.volume),
            oi: BigInt(s.oi),
          });
        } catch {
          // ignore individual failures
        }
      }
    },
    [actor]
  );

  return save;
}

export function useMarketSnapshotSync() {
  const { actor } = useActor();
  const saveSnapshot = useSaveMarketSnapshot();
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!actor) return;
    snapshotIntervalRef.current = setInterval(() => {
      const currentState = getState();
      saveSnapshot(currentState.stocks);
    }, 30000);

    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }
    };
  }, [actor, saveSnapshot]);
}

// ─── Watchlist Hooks ──────────────────────────────────────────────────────────

export function useGetWatchlist() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, number]>>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWatchlist();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (stockList: Array<[string, number]>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addToWatchlist(stockList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (!actor) throw new Error('Actor not available');
      const current = await actor.getWatchlist();
      const updated = current.filter(([s]) => s !== symbol);
      await actor.addToWatchlist(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}

// ─── User Profile Hooks ───────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: { name: string; username: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export { stopInterval as stopLiveMarket };
