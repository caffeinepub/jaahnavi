import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const sectors = [
  { name: 'NIFTY IT', change: 1.2, strength: 'High' },
  { name: 'NIFTY BANK', change: 0.8, strength: 'High' },
  { name: 'NIFTY AUTO', change: -0.5, strength: 'Medium' },
  { name: 'NIFTY PHARMA', change: 0.3, strength: 'Medium' },
  { name: 'NIFTY FMCG', change: 0.6, strength: 'High' },
  { name: 'NIFTY METAL', change: -1.2, strength: 'Low' },
];

export default function SectorsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sector Performance</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sectors.map((sector) => (
          <Card 
            key={sector.name}
            className="cursor-pointer border-border bg-card/40 backdrop-blur-sm transition-all hover:border-border/50 hover:shadow-lg"
            onClick={() => toast.info(`Loading ${sector.name} details...`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sector.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${sector.change >= 0 ? 'text-chart-2' : 'text-destructive'}`}>
                {sector.change > 0 ? '+' : ''}{sector.change.toFixed(2)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Strength: {sector.strength}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
