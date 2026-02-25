import React from 'react';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { useLiveMarketData } from '../hooks/useQueries';

const SECTOR_DETAILS: Record<string, { description: string; stocks: string[] }> = {
  'NIFTY IT': { description: 'Information Technology', stocks: ['TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM'] },
  'NIFTY BANK': { description: 'Banking & Finance', stocks: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK'] },
  'NIFTY AUTO': { description: 'Automobile', stocks: ['MARUTI', 'TATAMOTORS', 'EICHERMOT', 'HEROMOTOCO', 'BAJAJ-AUTO'] },
  'NIFTY PHARMA': { description: 'Pharmaceuticals', stocks: ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'APOLLOHOSP'] },
  'NIFTY FMCG': { description: 'Fast Moving Consumer Goods', stocks: ['HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'DABUR'] },
  'NIFTY METAL': { description: 'Metals & Mining', stocks: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'COALINDIA'] },
  'NIFTY ENERGY': { description: 'Energy & Power', stocks: ['RELIANCE', 'ONGC', 'NTPC', 'POWERGRID', 'ADANIENT'] },
  'NIFTY REALTY': { description: 'Real Estate', stocks: ['DLF', 'GODREJPROP', 'OBEROIRLTY', 'PRESTIGE', 'BRIGADE'] },
};

export default function SectorsView() {
  const liveData = useLiveMarketData();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Sector Performance
        </h1>
        <span className="text-xs text-muted-foreground">Live updates every second</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {liveData.sectors.map((sector) => {
          const isUp = sector.changePercent >= 0;
          const changed = sector.changePercent !== sector.prevChangePercent;
          const details = SECTOR_DETAILS[sector.name];
          const strength = Math.min(100, Math.abs(sector.changePercent) * 20);

          return (
            <div
              key={sector.name}
              className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
                changed
                  ? isUp
                    ? 'border-success/40'
                    : 'border-destructive/40'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground text-sm">{sector.name}</h3>
                  <p className="text-xs text-muted-foreground">{details?.description}</p>
                </div>
                <div className={`flex items-center gap-1 text-lg font-bold font-mono ${isUp ? 'text-success' : 'text-destructive'}`}>
                  {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isUp ? '+' : ''}{sector.changePercent.toFixed(2)}%
                </div>
              </div>

              {/* Strength bar */}
              <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isUp ? 'bg-success' : 'bg-destructive'}`}
                  style={{ width: `${strength}%` }}
                />
              </div>

              {/* Top stocks */}
              {details && (
                <div className="flex flex-wrap gap-1">
                  {details.stocks.map((sym) => {
                    const stock = liveData.stocks[sym];
                    const stockUp = (stock?.changePercent ?? 0) >= 0;
                    return (
                      <span
                        key={sym}
                        className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                          stockUp
                            ? 'bg-success/10 border-success/30 text-success'
                            : 'bg-destructive/10 border-destructive/30 text-destructive'
                        }`}
                      >
                        {sym} {stock ? `${stockUp ? '+' : ''}${stock.changePercent.toFixed(1)}%` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
