import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STOCKS } from '../lib/constants';
import { useMarketData } from '../hooks/useQueries';
import { detectCandlestickPatterns } from '../lib/analytics';
import CandlestickChart from '../components/CandlestickChart';

export default function CandleAnalysisView() {
  const { data: marketData } = useMarketData();

  // Analyze all stocks and categorize by pattern
  const analyzedStocks = STOCKS.map((symbol) => {
    const price = marketData?.[symbol] || Math.random() * 2000 + 500;
    const open = price * (0.98 + Math.random() * 0.04);
    const close = price * (0.98 + Math.random() * 0.04);
    const high = Math.max(open, close) * (1 + Math.random() * 0.03);
    const low = Math.min(open, close) * (1 - Math.random() * 0.03);

    // Generate previous candle data for multi-candle patterns
    const prevPrice = price * (0.97 + Math.random() * 0.06);
    const prevOpen = prevPrice * (0.98 + Math.random() * 0.04);
    const prevClose = prevPrice * (0.98 + Math.random() * 0.04);
    const prevHigh = Math.max(prevOpen, prevClose) * (1 + Math.random() * 0.03);
    const prevLow = Math.min(prevOpen, prevClose) * (1 - Math.random() * 0.03);

    const prev2Price = prevPrice * (0.97 + Math.random() * 0.06);
    const prev2Open = prev2Price * (0.98 + Math.random() * 0.04);
    const prev2Close = prev2Price * (0.98 + Math.random() * 0.04);
    const prev2High = Math.max(prev2Open, prev2Close) * (1 + Math.random() * 0.03);
    const prev2Low = Math.min(prev2Open, prev2Close) * (1 - Math.random() * 0.03);

    const patterns = detectCandlestickPatterns(
      open,
      high,
      low,
      close,
      prevOpen,
      prevHigh,
      prevLow,
      prevClose,
      prev2Open,
      prev2High,
      prev2Low,
      prev2Close
    );

    return {
      symbol,
      price,
      patterns,
    };
  });

  const bullishStocks = analyzedStocks.filter((stock) =>
    stock.patterns.some((p) => p.category === 'bullish')
  );
  const bearishStocks = analyzedStocks.filter((stock) =>
    stock.patterns.some((p) => p.category === 'bearish')
  );
  const neutralStocks = analyzedStocks.filter(
    (stock) =>
      stock.patterns.every((p) => p.category === 'neutral') &&
      !stock.patterns.some((p) => p.patternType === 'No Pattern')
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bullish Candles Section */}
        <Card className="border-chart-2/30 bg-card/40 backdrop-blur-sm">
          <CardHeader className="border-b border-chart-2/20 bg-chart-2/5">
            <CardTitle className="flex items-center gap-2 text-chart-2">
              <span className="text-2xl">🟢</span>
              <div>
                <div className="text-lg font-bold">Bullish Candles</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Expect Upside Reversal / Continuation
                </div>
              </div>
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              These indicate buying pressure
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4 rounded-md bg-chart-2/10 p-3 text-sm font-medium text-chart-2">
              👉 Bias: BUY / LONG Setup
            </div>
            {bullishStocks.length > 0 ? (
              <ul className="space-y-3">
                {bullishStocks.slice(0, 10).map((stock) => {
                  const bullishPatterns = stock.patterns.filter((p) => p.category === 'bullish');
                  return (
                    <li key={stock.symbol} className="flex items-start gap-2 border-b border-border/50 pb-2">
                      <span className="text-chart-2">✅</span>
                      <div className="flex-1">
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          ₹{stock.price.toFixed(2)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {bullishPatterns.map((pattern, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-chart-2/20 px-2 py-0.5 text-xs text-chart-2"
                            >
                              {pattern.patternType}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No bullish patterns detected</p>
            )}
          </CardContent>
        </Card>

        {/* Bearish Candles Section */}
        <Card className="border-destructive/30 bg-card/40 backdrop-blur-sm">
          <CardHeader className="border-b border-destructive/20 bg-destructive/5">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <span className="text-2xl">🔴</span>
              <div>
                <div className="text-lg font-bold">Bearish Candles</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Expect Downside Reversal / Continuation
                </div>
              </div>
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              These indicate selling pressure
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
              👉 Bias: SELL / SHORT Setup
            </div>
            {bearishStocks.length > 0 ? (
              <ul className="space-y-3">
                {bearishStocks.slice(0, 10).map((stock) => {
                  const bearishPatterns = stock.patterns.filter((p) => p.category === 'bearish');
                  return (
                    <li key={stock.symbol} className="flex items-start gap-2 border-b border-border/50 pb-2">
                      <span className="text-destructive">❌</span>
                      <div className="flex-1">
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          ₹{stock.price.toFixed(2)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {bearishPatterns.map((pattern, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive"
                            >
                              {pattern.patternType}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No bearish patterns detected</p>
            )}
          </CardContent>
        </Card>

        {/* Neutral Candles Section */}
        <Card className="border-muted/30 bg-card/40 backdrop-blur-sm">
          <CardHeader className="border-b border-muted/20 bg-muted/5">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <span className="text-2xl">⚪</span>
              <div>
                <div className="text-lg font-bold">Neutral Candles</div>
                <div className="text-xs font-normal text-muted-foreground">
                  Indecision / Sideways
                </div>
              </div>
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              Market confusion – wait for confirmation
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-4 rounded-md bg-muted/20 p-3 text-sm font-medium text-foreground">
              👉 Bias: WAIT / NO TRADE until breakout
            </div>
            {neutralStocks.length > 0 ? (
              <ul className="space-y-3">
                {neutralStocks.slice(0, 10).map((stock) => {
                  const neutralPatterns = stock.patterns.filter((p) => p.category === 'neutral');
                  return (
                    <li key={stock.symbol} className="flex items-start gap-2 border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">⏸️</span>
                      <div className="flex-1">
                        <div className="font-semibold">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          ₹{stock.price.toFixed(2)}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {neutralPatterns.map((pattern, idx) => (
                            <span
                              key={idx}
                              className="rounded-full bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {pattern.patternType}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No neutral patterns detected</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Pattern Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <CandlestickChart symbol="NIFTY" />
        </CardContent>
      </Card>
    </div>
  );
}
