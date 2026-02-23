import { ViewType } from '../App';
import { Home, Eye, BarChart3, TrendingUp, TrendingDown, List, CandlestickChart, Factory, Newspaper } from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

const navItems = [
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: Home },
  { id: 'watchlist' as ViewType, label: 'Watchlist', icon: Eye },
  { id: 'option-chain' as ViewType, label: 'Option Chain', icon: BarChart3 },
  { id: 'scanner-oh' as ViewType, label: 'Open=High', icon: TrendingUp },
  { id: 'scanner-ol' as ViewType, label: 'Open=Low', icon: TrendingDown },
  { id: 'fo-list' as ViewType, label: 'All F&O List', icon: List },
  { id: 'candle-analysis' as ViewType, label: 'Candle Analysis', icon: CandlestickChart },
  { id: 'sectors' as ViewType, label: 'Sectors', icon: Factory },
  { id: 'news' as ViewType, label: 'News Feed', icon: Newspaper },
];

export default function Sidebar({ currentView, onNavigate }: SidebarProps) {
  return (
    <aside className="flex w-64 flex-col border-r border-border bg-sidebar backdrop-blur-xl">
      <div className="border-b border-border p-6">
        <h1 className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          JAAHNAVI
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center gap-3 border-l-3 px-6 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'border-l-primary bg-primary/10 text-foreground'
                  : 'border-l-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-6">
        <div className="text-xs text-muted-foreground">Admin Panel</div>
        <div className="mt-1 text-sm font-semibold">Secure View</div>
      </div>
    </aside>
  );
}
