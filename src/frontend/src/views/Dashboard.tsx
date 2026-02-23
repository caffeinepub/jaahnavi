import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarketData } from '../hooks/useQueries';
import CandlestickChart from '../components/CandlestickChart';

export default function Dashboard() {
  const { data: marketData } = useMarketData();

  const indices = [
    { name: 'NIFTY 50', symbol: 'NIFTY', change: 0.45, phase: 'Bullish' },
    { name: 'BANK NIFTY', symbol: 'BANKNIFTY', change: 0.30, phase: 'Bullish' },
    { name: 'SENSEX', symbol: 'SENSEX', change: 0.50, phase: 'Bullish' },
    { name: 'FINNIFTY', symbol: 'FINNIFTY', change: 0.20, phase: 'Neutral' },
    { name: 'INDIA VIX', symbol: 'VIX', change: -1.20, phase: 'Bearish' },
  ];

  const getPrice = (symbol: string) => {
    if (symbol === 'NIFTY') return marketData?.NIFTY || 22500;
    if (symbol === 'BANKNIFTY') return marketData?.BANKNIFTY || 47800;
    if (symbol === 'SENSEX') return 73800;
    if (symbol === 'FINNIFTY') return 21200;
    return 13.50;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {indices.map((index) => (
          <Card key={index.symbol} className="border-border bg-card/40 backdrop-blur-sm transition-all hover:border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {index.name}
                </CardTitle>
                <Badge variant={index.phase === 'Bullish' ? 'default' : index.phase === 'Bearish' ? 'destructive' : 'secondary'} className="text-xs">
                  {index.phase}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${index.change >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {getPrice(index.symbol).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`text-sm ${index.change >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {index.change > 0 ? '+' : ''}{index.change}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-border bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">FII Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">+₹1,200 Cr</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">DII Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">-₹850 Cr</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Market Breadth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Adv: 1450</div>
            <div className="text-sm text-destructive">Dec: 890</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Market Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <CandlestickChart symbol="NIFTY" />
        </CardContent>
      </Card>
    </div>
  );
}
