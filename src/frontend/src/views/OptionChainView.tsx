import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { STOCKS } from '../lib/constants';
import { useMarketData } from '../hooks/useQueries';
import { generateOptionChain, getScenario } from '../lib/analytics';

interface OptionChainViewProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

export default function OptionChainView({ selectedSymbol, onSymbolChange }: OptionChainViewProps) {
  const { data: marketData } = useMarketData();
  const spot = marketData?.[selectedSymbol] || 22500;
  const chainData = generateOptionChain(selectedSymbol, spot);

  const bestCE = chainData.reduce((prev, curr) => (curr.ce.doi > prev.ce.doi ? curr : prev));
  const bestPE = chainData.reduce((prev, curr) => (curr.pe.doi > prev.pe.doi ? curr : prev));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Option Chain: {selectedSymbol}</h2>
          <p className="text-sm text-muted-foreground">Spot: {spot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <Select value={selectedSymbol} onValueChange={onSymbolChange}>
          <SelectTrigger className="w-48 bg-background/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STOCKS.slice(0, 50).map((stock) => (
              <SelectItem key={stock} value={stock}>{stock}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-chart-2 bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best CE (OI Analysis)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{bestCE.strike} CE</div>
            <div className="text-sm text-muted-foreground">
              ΔOI: {bestCE.ce.doi.toLocaleString('en-IN')} | {bestCE.ce.scenario.text}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best PE (OI Analysis)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{bestPE.strike} PE</div>
            <div className="text-sm text-muted-foreground">
              ΔOI: {bestPE.pe.doi.toLocaleString('en-IN')} | {bestPE.pe.scenario.text}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Market Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${chainData[5]?.analysis.trend === 'Bullish' ? 'text-chart-2' : 'text-destructive'}`}>
              {chainData[5]?.analysis.trend || 'Neutral'}
            </div>
            <div className="text-sm text-muted-foreground">
              PCR: {chainData[5]?.analysis.pcr_oi || '1.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card/40 backdrop-blur-sm">
        <table className="w-full min-w-[2500px] border-collapse text-xs">
          <thead>
            <tr>
              <th colSpan={11} className="border-b-2 border-chart-2 bg-chart-2/10 p-3 text-center font-semibold text-chart-2">
                CALLS
              </th>
              <th rowSpan={2} className="border-x border-border bg-accent p-3 text-center font-bold">
                STRIKE
              </th>
              <th colSpan={11} className="border-b-2 border-destructive bg-destructive/10 p-3 text-center font-semibold text-destructive">
                PUTS
              </th>
              <th colSpan={5} rowSpan={2} className="border-l border-border bg-muted/50 p-3 text-center font-semibold">
                ANALYSIS
              </th>
            </tr>
            <tr className="border-b border-border bg-muted/20 text-muted-foreground">
              <th className="p-2 text-right">ATH</th>
              <th className="p-2 text-right">LTP</th>
              <th className="p-2 text-right">Chg</th>
              <th className="p-2 text-right">VWAP</th>
              <th className="p-2 text-right">Vol</th>
              <th className="p-2 text-right">OI</th>
              <th className="p-2 text-right">ΔOI</th>
              <th className="p-2 text-right">IV</th>
              <th className="p-2 text-right">ATP</th>
              <th className="p-2 text-right">Act</th>
              <th className="p-2 text-right">Sen</th>
              
              <th className="p-2 text-left">Sen</th>
              <th className="p-2 text-left">Act</th>
              <th className="p-2 text-left">ATP</th>
              <th className="p-2 text-left">IV</th>
              <th className="p-2 text-left">ΔOI</th>
              <th className="p-2 text-left">OI</th>
              <th className="p-2 text-left">Vol</th>
              <th className="p-2 text-left">VWAP</th>
              <th className="p-2 text-left">Chg</th>
              <th className="p-2 text-left">LTP</th>
              <th className="p-2 text-left">ATH</th>
            </tr>
          </thead>
          <tbody>
            {chainData.map((row) => (
              <tr key={row.strike} className="border-b border-border/50 transition-colors hover:bg-accent/30">
                <td className="p-2 text-right text-muted-foreground">{row.ce.ath.toFixed(2)}</td>
                <td className={`p-2 text-right font-semibold ${row.ce.action === 'BUY' ? 'text-chart-2' : ''}`}>
                  {row.ce.ltp.toFixed(2)}
                </td>
                <td className="p-2 text-right">{row.ce.chg.toFixed(2)}</td>
                <td className="p-2 text-right">{row.ce.vwap.toFixed(2)}</td>
                <td className="p-2 text-right">{Math.floor(Math.random() * 50000 + 1000).toLocaleString()}</td>
                <td className="p-2 text-right">{row.ce.oi.toLocaleString('en-IN')}</td>
                <td className={`p-2 text-right font-semibold ${row.ce.doi > 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {row.ce.doi.toLocaleString('en-IN')}
                </td>
                <td className="p-2 text-right">{row.ce.iv}%</td>
                <td className="p-2 text-right">{(row.ce.ltp * 0.99).toFixed(2)}</td>
                <td className={`p-2 text-right font-bold ${row.ce.action === 'BUY' ? 'text-chart-2' : ''}`}>
                  {row.ce.action}
                </td>
                <td className="p-2 text-right">
                  <Badge variant={row.ce.scenario.class === 'badge-bull' ? 'default' : row.ce.scenario.class === 'badge-bear' ? 'destructive' : 'secondary'} className="text-xs">
                    {row.ce.scenario.text}
                  </Badge>
                </td>

                <td className="border-x border-border bg-accent p-2 text-center font-bold">{row.strike}</td>

                <td className="p-2 text-left">
                  <Badge variant={row.pe.scenario.class === 'badge-bull' ? 'default' : row.pe.scenario.class === 'badge-bear' ? 'destructive' : 'secondary'} className="text-xs">
                    {row.pe.scenario.text}
                  </Badge>
                </td>
                <td className={`p-2 text-left font-bold ${row.pe.action === 'BUY' ? 'text-chart-2' : ''}`}>
                  {row.pe.action}
                </td>
                <td className="p-2 text-left">{(row.pe.ltp * 0.99).toFixed(2)}</td>
                <td className="p-2 text-left">{row.pe.iv}%</td>
                <td className={`p-2 text-left font-semibold ${row.pe.doi > 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {row.pe.doi.toLocaleString('en-IN')}
                </td>
                <td className="p-2 text-left">{row.pe.oi.toLocaleString('en-IN')}</td>
                <td className="p-2 text-left">{Math.floor(Math.random() * 50000 + 1000).toLocaleString()}</td>
                <td className="p-2 text-left">{row.pe.vwap.toFixed(2)}</td>
                <td className="p-2 text-left">{row.pe.chg.toFixed(2)}</td>
                <td className={`p-2 text-left font-semibold ${row.pe.action === 'BUY' ? 'text-chart-2' : ''}`}>
                  {row.pe.ltp.toFixed(2)}
                </td>
                <td className="p-2 text-left text-muted-foreground">{row.pe.ath.toFixed(2)}</td>

                <td className={`border-l border-border p-2 text-center ${row.analysis.oi_diff > 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {row.analysis.oi_diff.toLocaleString('en-IN')}
                </td>
                <td className={`p-2 text-center ${row.analysis.doi_diff > 0 ? 'text-chart-2' : 'text-destructive'}`}>
                  {row.analysis.doi_diff.toLocaleString('en-IN')}
                </td>
                <td className="p-2 text-center">{row.analysis.pcr_oi}</td>
                <td className="p-2 text-center">{row.analysis.pcr_doi}</td>
                <td className="p-2 text-center">{row.analysis.trend === 'Bullish' ? '✅' : '⚠️'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
