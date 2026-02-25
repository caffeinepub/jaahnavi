import { NEWS_HEADLINES } from '../lib/constants';

export default function NewsTicker() {
  return (
    <div className="h-10 overflow-hidden border-b border-border bg-background/30">
      <div className="flex h-full items-center">
        <div className="animate-ticker flex whitespace-nowrap">
          {NEWS_HEADLINES.map((headline, index) => (
            <div key={index} className="mr-12 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded bg-chart-2/20 px-2 py-0.5 text-xs font-semibold text-chart-2">LIVE</span>
              {headline}
            </div>
          ))}
          {NEWS_HEADLINES.map((headline, index) => (
            <div key={`dup-${index}`} className="mr-12 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded bg-chart-2/20 px-2 py-0.5 text-xs font-semibold text-chart-2">LIVE</span>
              {headline}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
