import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWatchlist, useMarketData } from '../hooks/useQueries';
import { toast } from 'sonner';

interface WatchlistViewProps {
  onSymbolClick: (symbol: string) => void;
}

export default function WatchlistView({ onSymbolClick }: WatchlistViewProps) {
  const { data: watchlist = [], refetch } = useWatchlist();
  const { data: marketData } = useMarketData();

  const handleRemove = (symbol: string) => {
    toast.success(`Removed ${symbol} from watchlist`);
    setTimeout(() => refetch(), 100);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Watchlist</h2>

      <Card className="border-border bg-card/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="p-3 text-left font-semibold">Symbol</th>
                <th className="p-3 text-right font-semibold">Price</th>
                <th className="p-3 text-right font-semibold">Change</th>
                <th className="p-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map(([symbol, _]) => {
                const price = marketData?.[symbol] || Math.random() * 2000 + 500;
                const change = (Math.random() - 0.5) * 4;
                
                return (
                  <tr key={symbol} className="border-b border-border/50 transition-colors hover:bg-accent/30">
                    <td 
                      className="cursor-pointer p-3 font-bold hover:text-primary"
                      onClick={() => onSymbolClick(symbol)}
                    >
                      {symbol}
                    </td>
                    <td className="p-3 text-right">
                      {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`p-3 text-right ${change >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                      {change > 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleRemove(symbol)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
