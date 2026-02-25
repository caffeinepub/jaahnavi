import React, { useState, useEffect } from 'react';
import { Search, LogOut, TrendingUp, Wifi, WifiOff, Clock } from 'lucide-react';
import { useLiveMarketData, useNSEDataStatus } from '../hooks/useQueries';

interface HeaderProps {
  onLogout: () => void;
  userName?: string;
}

function NSEStatusBadge({ compact = false }: { compact?: boolean }) {
  const nseStatus = useNSEDataStatus();

  const statusConfig = {
    live: {
      label: 'NSE LIVE',
      dotClass: 'bg-success animate-ping',
      dotStaticClass: 'bg-success',
      containerClass: 'bg-success/10 border-success/30',
      textClass: 'text-success',
      icon: <Wifi className="w-3 h-3" />,
    },
    delayed: {
      label: 'DELAYED',
      dotClass: 'bg-warning',
      dotStaticClass: 'bg-warning',
      containerClass: 'bg-warning/10 border-warning/30',
      textClass: 'text-warning',
      icon: <Clock className="w-3 h-3" />,
    },
    offline: {
      label: 'OFFLINE',
      dotClass: 'bg-destructive',
      dotStaticClass: 'bg-destructive',
      containerClass: 'bg-destructive/10 border-destructive/30',
      textClass: 'text-destructive',
      icon: <WifiOff className="w-3 h-3" />,
    },
  };

  const cfg = statusConfig[nseStatus.status];

  const lastFetchStr = nseStatus.lastFetchTime
    ? nseStatus.lastFetchTime.toLocaleTimeString('en-IN', { hour12: false })
    : '--:--:--';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${cfg.containerClass}`}>
      <span className="relative flex h-2 w-2 flex-shrink-0">
        {nseStatus.status === 'live' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dotClass} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dotStaticClass}`}></span>
      </span>
      <span className={`text-xs font-bold tracking-wider ${cfg.textClass}`}>{cfg.label}</span>
      {!compact && (
        <span className="text-xs text-muted-foreground font-mono hidden lg:inline">{lastFetchStr}</span>
      )}
    </div>
  );
}

export { NSEStatusBadge };

export default function Header({ onLogout, userName }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [search, setSearch] = useState('');
  const liveData = useLiveMarketData();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isMarketOpen = () => {
    const h = time.getHours();
    const m = time.getMinutes();
    const totalMin = h * 60 + m;
    return totalMin >= 555 && totalMin <= 930; // 9:15 to 15:30
  };

  const nifty = liveData.indices.find((i) => i.name === 'NIFTY 50');
  const bankNifty = liveData.indices.find((i) => i.name === 'BANK NIFTY');

  return (
    <header className="glass-card border-b border-border px-4 py-2 flex items-center gap-3 sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-fit">
        <TrendingUp className="text-primary w-5 h-5" />
        <span className="font-bold text-foreground text-sm tracking-wide">F&O Analytics</span>
      </div>

      {/* Quick index display */}
      <div className="hidden md:flex items-center gap-4 text-xs">
        {nifty && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">NIFTY</span>
            <span className="font-mono font-semibold text-foreground">{nifty.value.toFixed(2)}</span>
            <span className={nifty.changePercent >= 0 ? 'text-success' : 'text-destructive'}>
              {nifty.changePercent >= 0 ? '▲' : '▼'} {Math.abs(nifty.changePercent).toFixed(2)}%
            </span>
          </div>
        )}
        {bankNifty && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">BANKNIFTY</span>
            <span className="font-mono font-semibold text-foreground">{bankNifty.value.toFixed(2)}</span>
            <span className={bankNifty.changePercent >= 0 ? 'text-success' : 'text-destructive'}>
              {bankNifty.changePercent >= 0 ? '▲' : '▼'} {Math.abs(bankNifty.changePercent).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* NSE Status Badge */}
      <NSEStatusBadge />

      {/* Market status */}
      <div className="hidden sm:flex items-center gap-1 text-xs">
        <span className={`w-2 h-2 rounded-full ${isMarketOpen() ? 'bg-success' : 'bg-muted-foreground'}`}></span>
        <span className="text-muted-foreground">{isMarketOpen() ? 'Market Open' : 'Market Closed'}</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xs relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          className="w-full bg-surface border border-border rounded-lg pl-7 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Time */}
      <div className="hidden sm:block text-xs font-mono text-muted-foreground">
        {time.toLocaleTimeString('en-IN', { hour12: false })}
      </div>

      {/* User & Logout */}
      <div className="flex items-center gap-2 ml-auto">
        {userName && (
          <span className="hidden sm:block text-xs text-muted-foreground">
            👤 {userName}
          </span>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
