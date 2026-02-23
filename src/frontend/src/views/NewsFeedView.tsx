import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NEWS_HEADLINES } from '../lib/constants';
import { Newspaper } from 'lucide-react';

export default function NewsFeedView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Live Market News</h2>

      <div className="space-y-4">
        {NEWS_HEADLINES.map((headline, index) => {
          const [title, subtitle] = headline.split(',');
          
          return (
            <Card key={index} className="border-border bg-card/40 backdrop-blur-sm">
              <CardContent className="flex gap-4 p-6">
                <div className="flex-shrink-0">
                  <Newspaper className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 font-bold">{title}</div>
                  <div className="text-sm text-muted-foreground">{subtitle || 'Market Update'}</div>
                  <div className="mt-3">
                    <Button variant="outline" size="sm">
                      Read Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
