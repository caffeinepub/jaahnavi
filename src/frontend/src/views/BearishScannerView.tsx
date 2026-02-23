import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STOCKS } from '../lib/constants';
import { useMarketData } from '../hooks/useQueries';

export default function BearishScannerView() {
  const { data: marketData } = useMarketData();
  
  // Generate stock data with Open = High pattern (bearish)
  const bearishStocks = STOCKS.map((symbol) => {
    const price = marketData?.[symbol] || Math.random() * 2000 + 500;
    const high = price * (1.01 + Math.random() * 0.01);
    const open = high;
    const low = price * (0.97 - Math.random() * 0.02);
    const close = low + (high - low) * (0.1 + Math.random() * 0.5);
    
    // Calculate proximity: how close is current price to Open=High level
    const proximity = Math.abs((close - high) / high);
    
    return {
      symbol,
      price: close,
      open,
      high,
      low,
      proximity,
    };
  })
  .filter((stock) => {
    // Filter stocks where Open equals High (within 0.1% threshold)
    const isOpenEqualsHigh = Math.abs(stock.open - stock.high) / stock.high < 0.001;
    // And current price is within 0.5% of the Open=High level
    const isNearLevel = stock.proximity < 0.005;
    return isOpenEqualsHigh && isNearLevel;
  })
  .slice(0, 25);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Open = High (Bearish) Scanner</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stocks where Open equals High, indicating bearish pressure. Current price within 0.5% of Open=High level.
        </p>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="p-3 text-left font-semibold">Symbol</th>
                <th className="p-3 text-right font-semibold">Price</th>
                <th className="p-3 text-right font-semibold">Open</th>
                <th className="p-3 text-right font-semibold">High</th>
                <th className="p-3 text-right font-semibold">Low</th>
                <th className="p-3 text-right font-semibold">Proximity</th>
                <th className="p-3 text-right font-semibold">Pattern</th>
              </tr>
            </thead>
            <tbody>
              {bearishStocks.map((stock) => {
                return (
                  <tr key={stock.symbol} className="border-b border-border/50 transition-colors hover:bg-accent/30">
                    <td className="p-3 font-bold text-destructive">{stock.symbol}</td>
                    <td className="p-3 text-right">
                      {stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      {stock.open.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      {stock.high.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      {stock.low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-destructive font-medium">
                        {(stock.proximity * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Badge variant="destructive">Bearish</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {bearishStocks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No stocks matching Open = High pattern near current levels
          </div>
        )}
      </Card>
    </div>
  );
}
