import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart2, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { useLiveMarketData, useNSEDataStatus } from '../hooks/useQueries';
import { NSEStatusBadge } from '../components/Header';
import CandlestickChart from '../components/CandlestickChart';

export default function Dashboard() {
  const liveData = useLiveMarketData();
  const nseStatus = useNSEDataStatus();
  const [lastUpdatedStr, setLastUpdatedStr] = useState('');

  useEffect(() => {
    setLastUpdatedStr(
      liveData.lastUpdated.toLocaleTimeString('en-IN', { hour12: false })
    );
  }, [liveData.lastUpdated]);

  const fiiDii = [
    { label: 'FII Cash', buy: 12450.5, sell: 11230.8 },
    { label: 'DII Cash', buy: 8920.3, sell: 9450.6 },
    { label: 'FII F&O', buy: 45230.0, sell: 43120.5 },
  ];

  const breadth = { advances: 1245, declines: 892, unchanged: 63, total: 2200 };

  const lastNSEFetchStr = nseStatus.lastFetchTime
    ? nseStatus.lastFetchTime.toLocaleTimeString('en-IN', { hour12: false })
    : 'Connecting...';

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-foreground">Market Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* NSE Status */}
          <NSEStatusBadge />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="w-3 h-3 animate-spin text-chart-2" />
            <span>
              NSE fetch:{' '}
              <span className="font-mono text-chart-2">{lastNSEFetchStr}</span>
            </span>
          </div>
        </div>
      </div>

      {/* NSE Data Source Info Banner */}
      <div className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${
        nseStatus.status === 'live'
          ? 'border-success/30 bg-success/5 text-success'
          : nseStatus.status === 'delayed'
          ? 'border-warning/30 bg-warning/5 text-warning'
          : 'border-destructive/30 bg-destructive/5 text-destructive'
      }`}>
        {nseStatus.status === 'live' ? (
          <Wifi className="w-3.5 h-3.5 flex-shrink-0" />
        ) : nseStatus.status === 'delayed' ? (
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span>
          {nseStatus.status === 'live'
            ? `Live NSE India data — last fetched at ${lastNSEFetchStr}. Prices update every 5 seconds via NSE backend proxy.`
            : nseStatus.status === 'delayed'
            ? `NSE data delayed — last fetched at ${lastNSEFetchStr}. Attempting to reconnect...`
            : `NSE data unavailable — showing simulated prices. Backend proxy connecting to NSE India...`}
        </span>
      </div>

      {/* Market Indices */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {liveData.indices.map((idx) => {
          const isUp = idx.changePercent >= 0;
          const changed = idx.value !== idx.prevValue;
          return (
            <div
              key={idx.name}
              className={`rounded-xl border bg-card/40 p-3 backdrop-blur-sm transition-all duration-300 ${
                changed
                  ? isUp
                    ? 'border-chart-2/40 shadow-[0_0_8px_rgba(0,200,100,0.12)]'
                    : 'border-destructive/40 shadow-[0_0_8px_rgba(255,80,80,0.12)]'
                  : 'border-border'
              }`}
            >
              <div className="mb-1 truncate text-xs text-muted-foreground">{idx.name}</div>
              <div className="font-mono text-base font-bold text-foreground">
                {idx.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div
                className={`mt-0.5 flex items-center gap-1 text-xs font-medium ${
                  isUp ? 'text-chart-2' : 'text-destructive'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isUp ? '+' : ''}
                {idx.changePercent.toFixed(2)}%
              </div>
              <div
                className={`text-xs ${isUp ? 'text-chart-2/70' : 'text-destructive/70'}`}
              >
                {isUp ? '+' : ''}
                {idx.change.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Performance */}
      <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Activity className="h-4 w-4 text-primary" />
          Sector Performance
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {liveData.sectors.map((s) => {
            const isUp = s.changePercent >= 0;
            return (
              <div
                key={s.name}
                className="flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2"
              >
                <span className="truncate text-xs text-muted-foreground">{s.name}</span>
                <span
                  className={`ml-2 font-mono text-xs font-bold ${
                    isUp ? 'text-chart-2' : 'text-destructive'
                  }`}
                >
                  {isUp ? '+' : ''}
                  {s.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FII/DII + Breadth */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* FII/DII */}
        <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <BarChart2 className="h-4 w-4 text-primary" />
            FII / DII Activity
          </h2>
          <div className="space-y-2">
            {fiiDii.map((row) => {
              const net = row.buy - row.sell;
              const isPositive = net >= 0;
              return (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <span className="w-20 text-muted-foreground">{row.label}</span>
                  <span className="font-mono text-chart-2">B: ₹{row.buy.toFixed(1)}Cr</span>
                  <span className="font-mono text-destructive">S: ₹{row.sell.toFixed(1)}Cr</span>
                  <span
                    className={`font-mono font-bold ${
                      isPositive ? 'text-chart-2' : 'text-destructive'
                    }`}
                  >
                    {isPositive ? '+' : ''}₹{net.toFixed(1)}Cr
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Breadth */}
        <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            Market Breadth
          </h2>
          <div className="mb-3 flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-chart-2">{breadth.advances}</div>
              <div className="text-xs text-muted-foreground">Advances</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-destructive">{breadth.declines}</div>
              <div className="text-xs text-muted-foreground">Declines</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground">{breadth.unchanged}</div>
              <div className="text-xs text-muted-foreground">Unchanged</div>
            </div>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/30">
            <div
              className="h-full bg-chart-2 transition-all duration-500"
              style={{ width: `${(breadth.advances / breadth.total) * 100}%` }}
            />
            <div
              className="h-full bg-destructive transition-all duration-500"
              style={{ width: `${(breadth.declines / breadth.total) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{((breadth.advances / breadth.total) * 100).toFixed(1)}% Adv</span>
            <span>{((breadth.declines / breadth.total) * 100).toFixed(1)}% Dec</span>
          </div>
        </div>
      </div>

      {/* Candlestick Chart */}
      <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">NIFTY 50 Live Chart</h2>
        <CandlestickChart symbol="NIFTY 50" />
      </div>
    </div>
  );
}
