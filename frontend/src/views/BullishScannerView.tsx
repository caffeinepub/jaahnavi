import React, { useMemo } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { useLiveMarketData } from '../hooks/useQueries';
import { FO_SYMBOLS } from '../lib/constants';

const PROXIMITY_THRESHOLD = 0.5; // 0.5%

export default function BullishScannerView() {
  const liveData = useLiveMarketData();

  const bullishStocks = useMemo(() => {
    return FO_SYMBOLS
      .map((sym) => {
        const stock = liveData.stocks[sym];
        if (!stock) return null;
        const proximity = Math.abs(stock.open - stock.low) / stock.open * 100;
        return { symbol: sym, stock, proximity };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.proximity <= PROXIMITY_THRESHOLD)
      .sort((a, b) => a.proximity - b.proximity);
  }, [liveData.stocks]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-success font-bold text-sm">Open = Low → Bullish Mode</span>
        </div>
        <span className="text-xs text-muted-foreground">{bullishStocks.length} stocks qualifying</span>
      </div>

      {/* Explanation */}
      <div className="glass-card rounded-xl p-4 border border-success/20 bg-success/5">
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-success mb-1">Bullish Signal Detected</p>
            <p className="text-xs text-muted-foreground">
              When a stock opens at or near its day low, it signals that buyers dominated from the very start of the session.
              This indicates strong upward momentum and potential for continued buying pressure throughout the day.
              Stocks shown here have Open within <strong className="text-success">{PROXIMITY_THRESHOLD}%</strong> of their Low.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Symbol</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Signal</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">LTP</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Change%</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Open</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Low</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Proximity%</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden md:table-cell">Volume</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium hidden lg:table-cell">OI</th>
              </tr>
            </thead>
            <tbody>
              {bullishStocks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                    No stocks currently qualifying. Scanning live data...
                  </td>
                </tr>
              ) : (
                bullishStocks.map(({ symbol, stock, proximity }) => {
                  const isUp = stock.changePercent >= 0;
                  return (
                    <tr key={symbol} className="border-b border-border/50 hover:bg-surface/30 transition-colors">
                      <td className="px-3 py-2 font-semibold text-foreground">{symbol}</td>
                      <td className="px-3 py-2 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-bold border border-success/30">
                          BULLISH
                        </span>
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${isUp ? 'text-success' : 'text-destructive'}`}>
                        {stock.ltp.toFixed(2)}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${isUp ? 'text-success' : 'text-destructive'}`}>
                        {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">{stock.open.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-destructive">{stock.low.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-success font-bold">{proximity.toFixed(3)}%</td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden md:table-cell">
                        {(stock.volume / 1000).toFixed(1)}K
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground hidden lg:table-cell">
                        {(stock.oi / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
