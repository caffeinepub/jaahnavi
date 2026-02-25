import type { MarketSymbolData, IndicesSnapshot, OptionChainEntry } from '../backend';

// ─── TypeScript interfaces for NSE data shapes ────────────────────────────────

export interface NSEMarketSymbol {
  symbol: string;
  lastPrice: number;
  changePercent: number;
  volume: bigint;
  oi: bigint;
}

export interface NSEIndicesData {
  name: string;
  lastPrice: number;
  changePercent: number;
  volume: bigint;
  oi: bigint;
}

export interface NSEOptionChainData {
  symbol: string;
  atm: number;
  ce_atm_data: {
    symbol: string;
    strike: string;
    price: number;
    oi: number;
    doi: number;
    trend: string;
  };
  pe_atm_data: {
    symbol: string;
    strike: string;
    price: number;
    oi: number;
    doi: number;
    trend: string;
  };
  price: {
    high: number;
    open: number;
    close: number;
    low: number;
    vwap: number;
  };
  scenarios: {
    trending: boolean;
    pcr_tested: boolean;
    high_oi: boolean;
    reversal: boolean;
  };
}

// ─── NSE Client Functions ─────────────────────────────────────────────────────

/**
 * Fetch all F&O stock market data from the backend proxy.
 * Returns an array of MarketSymbolData or empty array on error.
 */
export async function fetchFOStockList(
  actor: { getMarketSnapshot: () => Promise<MarketSymbolData[]> } | null
): Promise<MarketSymbolData[]> {
  if (!actor) return [];
  try {
    const data = await actor.getMarketSnapshot();
    // Filter out placeholder entries
    return data.filter(
      (d) => d.symbol !== 'RAW_JSON' && d.symbol !== 'raw_equities_data'
    );
  } catch {
    return [];
  }
}

/**
 * Fetch all indices snapshot from the backend proxy.
 * Returns an array of IndicesSnapshot or empty array on error.
 */
export async function fetchAllIndices(
  actor: { getIndicesSnapshot: () => Promise<IndicesSnapshot[]> } | null
): Promise<IndicesSnapshot[]> {
  if (!actor) return [];
  try {
    const data = await actor.getIndicesSnapshot();
    // Filter out placeholder entries
    return data.filter(
      (d) => d.name !== 'RAW_JSON' && d.name !== 'raw_indices_data'
    );
  } catch {
    return [];
  }
}

/**
 * Fetch option chain data for a given symbol from the backend proxy.
 * Returns OptionChainEntry or null on error.
 */
export async function fetchOptionChain(
  actor: { getOptionChainData: (symbol: string) => Promise<OptionChainEntry> } | null,
  symbol: string
): Promise<OptionChainEntry | null> {
  if (!actor) return null;
  try {
    const data = await actor.getOptionChainData(symbol);
    return data;
  } catch {
    return null;
  }
}

/**
 * Trigger a backend refresh of NSE market data via HTTP outcalls.
 * Returns true if successful, false on error.
 */
export async function triggerMarketRefresh(
  actor: { refreshMarketData: () => Promise<string> } | null
): Promise<boolean> {
  if (!actor) return false;
  try {
    await actor.refreshMarketData();
    return true;
  } catch {
    return false;
  }
}
