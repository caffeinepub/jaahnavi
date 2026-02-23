import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { STOCKS } from '../lib/constants';
import { useMarketData, useAddToWatchlist } from '../hooks/useQueries';
import { toast } from 'sonner';

interface FOListViewProps {
  onSymbolClick: (symbol: string) => void;
}

export default function FOListView({ onSymbolClick }: FOListViewProps) {
  const { data: marketData } = useMarketData();
  const addToWatchlist = useAddToWatchlist();

  const handleAddToWatchlist = (symbol: string) => {
    addToWatchlist.mutate([[symbol, marketData?.[symbol] || 0]], {
      onSuccess: () => toast.success(`Added ${symbol} to watchlist`),
      onError: () => toast.error('Already in watchlist')
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">All F&O Stocks ({STOCKS.length})</h2>

      <Card className="border-border bg-card/40 backdrop-blur-sm">
        <div className="max-h-[80vh] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
              <tr className="border-b border-border">
                <th className="p-3 text-left font-semibold">Symbol</th>
                <th className="p-3 text-right font-semibold">Price</th>
                <th className="p-3 text-right font-semibold">Change</th>
                <th className="p-3 text-right font-semibold">Volume</th>
                <th className="p-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {STOCKS.slice(0, 100).map((symbol) => {
                const price = marketData?.[symbol] || Math.random() * 2000 + 500;
                const change = (Math.random() - 0.5) * 4;
                const volume = Math.random() * 1000000;
                
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
                    <td className="p-3 text-right">{(volume / 1000).toFixed(1)}K</td>
                    <td className="p-3 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddToWatchlist(symbol)}
                        disabled={addToWatchlist.isPending}
                      >
                        + WL
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
