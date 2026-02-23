import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STOCKS } from '../lib/constants';
import { useMarketData } from '../hooks/useQueries';

export default function BullishScannerView() {
  const { data: marketData } = useMarketData();
  
  // Generate stock data with Open = Low pattern (bullish)
  const bullishStocks = STOCKS.map((symbol) => {
    const price = marketData?.[symbol] || Math.random() * 2000 + 500;
    const low = price * (0.98 + Math.random() * 0.01);
    const open = low;
    const high = price * (1.01 + Math.random() * 0.02);
    const close = low + (high - low) * (0.4 + Math.random() * 0.5);
    
    // Calculate proximity: how close is current price to Open=Low level
    const proximity = Math.abs((close - low) / low);
    
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
    // Filter stocks where Open equals Low (within 0.1% threshold)
    const isOpenEqualsLow = Math.abs(stock.open - stock.low) / stock.low < 0.001;
    // And current price is within 0.5% of the Open=Low level
    const isNearLevel = stock.proximity < 0.005;
    return isOpenEqualsLow && isNearLevel;
  })
  .slice(0, 25);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Open = Low (Bullish) Scanner</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stocks where Open equals Low, indicating bullish momentum. Current price within 0.5% of Open=Low level.
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
              {bullishStocks.map((stock) => {
                return (
                  <tr key={stock.symbol} className="border-b border-border/50 transition-colors hover:bg-accent/30">
                    <td className="p-3 font-bold text-chart-2">{stock.symbol}</td>
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
                      <span className="text-chart-2 font-medium">
                        {(stock.proximity * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Badge variant="default" className="bg-chart-2">Bullish</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {bullishStocks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No stocks matching Open = Low pattern near current levels
          </div>
        )}
      </Card>
    </div>
  );
}
