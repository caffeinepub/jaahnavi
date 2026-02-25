import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useLiveMarketData, useAddToWatchlist } from '../hooks/useQueries';
import { FO_SYMBOLS } from '../lib/constants';

interface FlashState {
  [symbol: string]: 'up' | 'down' | null;
}

export default function FOListView() {
  const liveData = useLiveMarketData();
  const addToWatchlist = useAddToWatchlist();
  const [flashStates, setFlashStates] = useState<FlashState>({});
  const prevPricesRef = useRef<Record<string, number>>({});
  const flashTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Detect price changes and trigger flash
  useEffect(() => {
    const newFlashes: FlashState = {};
    let hasChanges = false;

    FO_SYMBOLS.forEach((sym) => {
      const stock = liveData.stocks[sym];
      if (!stock) return;
      const prev = prevPricesRef.current[sym];
      if (prev !== undefined && prev !== stock.ltp) {
        newFlashes[sym] = stock.ltp > prev ? 'up' : 'down';
        hasChanges = true;
        // Clear existing timer
        if (flashTimersRef.current[sym]) {
          clearTimeout(flashTimersRef.current[sym]);
        }
        // Remove flash after 400ms
        flashTimersRef.current[sym] = setTimeout(() => {
          setFlashStates((prev) => ({ ...prev, [sym]: null }));
        }, 400);
      }
      prevPricesRef.current[sym] = stock.ltp;
    });

    if (hasChanges) {
      setFlashStates((prev) => ({ ...prev, ...newFlashes }));
    }
  }, [liveData.stocks]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(flashTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleAddToWatchlist = useCallback(
    (symbol: string, price: number) => {
      addToWatchlist.mutate([[symbol, price]]);
    },
    [addToWatchlist]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">F&O Stocks</h1>
        <span className="text-xs text-muted-foreground">{FO_SYMBOLS.length} symbols</span>
      </div>

      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Symbol</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">LTP</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Change%</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">Open</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">High</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">Low</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden lg:table-cell">Volume</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden lg:table-cell">VWAP</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden xl:table-cell">OI</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {FO_SYMBOLS.map((sym) => {
                const stock = liveData.stocks[sym];
                if (!stock) return null;
                const isUp = stock.changePercent >= 0;
                const flash = flashStates[sym];

                return (
                  <tr
                    key={sym}
                    className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                  >
                    <td className="px-3 py-2 font-semibold text-foreground">{sym}</td>
                    <td
                      className={`px-3 py-2 text-right font-mono font-bold transition-colors duration-300 ${
                        flash === 'up'
                          ? 'bg-success/20 text-success'
                          : flash === 'down'
                          ? 'bg-destructive/20 text-destructive'
                          : isUp
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {stock.ltp.toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-mono transition-colors duration-300 ${
                        flash === 'up'
                          ? 'text-success'
                          : flash === 'down'
                          ? 'text-destructive'
                          : isUp
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      <span className="flex items-center justify-end gap-0.5">
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden md:table-cell">
                      {stock.open.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-success hidden md:table-cell">
                      {stock.high.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-destructive hidden md:table-cell">
                      {stock.low.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden lg:table-cell">
                      {(stock.volume / 1000).toFixed(1)}K
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden lg:table-cell">
                      {stock.vwap.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden xl:table-cell">
                      {(stock.oi / 1000).toFixed(1)}K
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleAddToWatchlist(sym, stock.ltp)}
                        className="p-1 rounded hover:bg-primary/20 text-primary transition-colors"
                        title="Add to watchlist"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
