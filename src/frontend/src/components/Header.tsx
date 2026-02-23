import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { STOCKS } from '../lib/constants';

interface HeaderProps {
  onLogout: () => void;
  onSymbolSelect: (symbol: string) => void;
}

export default function Header({ onLogout, onSymbolSelect }: HeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useState(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  });

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const symbol = searchValue.toUpperCase();
      if (STOCKS.includes(symbol)) {
        onSymbolSelect(symbol);
        toast.success(`Loaded ${symbol}`);
        setSearchValue('');
      } else {
        toast.error('Invalid symbol');
      }
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/70 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="font-mono">
          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
        </span>
        <span className="text-chart-2">Market Open</span>
        <span className="text-chart-5">Live Updates (1s)</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search Symbol..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearch}
            className="w-64 bg-background/60 pl-10"
          />
        </div>
        
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
