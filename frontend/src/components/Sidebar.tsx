import React from 'react';
import type { ViewType } from '../App';
import {
  Home,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  List,
  CandlestickChart,
  Factory,
  Newspaper,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
  accent?: 'bullish' | 'bearish';
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'watchlist', label: 'Watchlist', icon: Eye },
  { id: 'option-chain', label: 'Option Chain', icon: BarChart3 },
  { id: 'bearish-scanner', label: 'Open=High (Bearish)', icon: TrendingDown, accent: 'bearish' },
  { id: 'bullish-scanner', label: 'Open=Low (Bullish)', icon: TrendingUp, accent: 'bullish' },
  { id: 'fo-list', label: 'All F&O List', icon: List },
  { id: 'candle-analysis', label: 'Candle Analysis', icon: CandlestickChart },
  { id: 'sectors', label: 'Sectors', icon: Factory },
  { id: 'news', label: 'News Feed', icon: Newspaper },
];

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-64 flex-col border-r border-border bg-sidebar backdrop-blur-xl">
      <div className="border-b border-border p-6">
        <h1 className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          JAAHNAVI
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">F&O Intelligence Platform</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          const accentIconClass =
            item.accent === 'bullish'
              ? 'text-emerald-400'
              : item.accent === 'bearish'
              ? 'text-red-400'
              : '';

          const accentLabelClass =
            item.accent === 'bullish'
              ? 'text-emerald-400'
              : item.accent === 'bearish'
              ? 'text-red-400'
              : '';

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 border-l-[3px] px-6 py-3 text-sm font-medium transition-all ${
                isActive
                  ? item.accent === 'bullish'
                    ? 'border-l-emerald-400 bg-emerald-500/10 text-foreground'
                    : item.accent === 'bearish'
                    ? 'border-l-red-400 bg-red-500/10 text-foreground'
                    : 'border-l-primary bg-primary/10 text-foreground'
                  : 'border-l-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon
                className={`h-4 w-4 ${item.accent ? accentIconClass : ''}`}
              />
              <span className={item.accent && !isActive ? accentLabelClass : ''}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-xs text-emerald-400 font-semibold">LIVE DATA</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Real-time simulation active</div>
      </div>
    </aside>
  );
}
