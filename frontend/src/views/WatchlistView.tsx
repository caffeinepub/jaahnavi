import React, { useMemo } from 'react';
import { Trash2, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { useLiveMarketData, useGetWatchlist, useRemoveFromWatchlist } from '../hooks/useQueries';

export default function WatchlistView() {
  const liveData = useLiveMarketData();
  const { data: watchlist = [], isLoading } = useGetWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  const enrichedWatchlist = useMemo(() => {
    return watchlist.map(([symbol]) => {
      const stock = liveData.stocks[symbol];
      return {
        symbol,
        ltp: stock?.ltp ?? 0,
        changePercent: stock?.changePercent ?? 0,
        high: stock?.high ?? 0,
        low: stock?.low ?? 0,
        volume: stock?.volume ?? 0,
        vwap: stock?.vwap ?? 0,
        oi: stock?.oi ?? 0,
        prevLtp: stock?.prevLtp ?? 0,
      };
    });
  }, [watchlist, liveData.stocks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-muted-foreground text-sm">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          Watchlist
        </h1>
        <span className="text-xs text-muted-foreground">{enrichedWatchlist.length} symbols</span>
      </div>

      {enrichedWatchlist.length === 0 ? (
        <div className="glass-card rounded-xl p-8 border border-border text-center">
          <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Your watchlist is empty.</p>
          <p className="text-muted-foreground text-xs mt-1">Add stocks from the F&O List view.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Symbol</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">LTP</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">Change%</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">High</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">Low</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden lg:table-cell">Volume</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden lg:table-cell">VWAP</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden xl:table-cell">OI</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {enrichedWatchlist.map((item) => {
                  const isUp = item.changePercent >= 0;
                  const priceChanged = item.ltp !== item.prevLtp;
                  const priceWentUp = item.ltp > item.prevLtp;

                  return (
                    <tr
                      key={item.symbol}
                      className="border-b border-border/50 hover:bg-surface/30 transition-colors"
                    >
                      <td className="px-3 py-2 font-semibold text-foreground">{item.symbol}</td>
                      <td
                        className={`px-3 py-2 text-right font-mono font-bold transition-colors duration-300 ${
                          priceChanged
                            ? priceWentUp
                              ? 'text-success'
                              : 'text-destructive'
                            : isUp
                            ? 'text-success'
                            : 'text-destructive'
                        }`}
                      >
                        {item.ltp.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${isUp ? 'text-success' : 'text-destructive'}`}>
                        <span className="flex items-center justify-end gap-0.5">
                          {isUp ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-success hidden md:table-cell">
                        {item.high.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-destructive hidden md:table-cell">
                        {item.low.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden lg:table-cell">
                        {(item.volume / 1000).toFixed(1)}K
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden lg:table-cell">
                        {item.vwap.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden xl:table-cell">
                        {(item.oi / 1000).toFixed(1)}K
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeFromWatchlist.mutate(item.symbol)}
                          className="p-1 rounded hover:bg-destructive/20 text-destructive transition-colors"
                          title="Remove from watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
