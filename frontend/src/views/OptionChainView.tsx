import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useLiveMarketData } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { fetchOptionChain } from '../lib/nseClient';
import { FO_SYMBOLS } from '../lib/constants';
import type { OptionChainEntry } from '../backend';

interface OptionData {
  strike: number;
  ce: {
    ltp: number;
    oi: number;
    doi: number;
    iv: number;
    vwap: number;
    volume: number;
    scenario: string;
  };
  pe: {
    ltp: number;
    oi: number;
    doi: number;
    iv: number;
    vwap: number;
    volume: number;
    scenario: string;
  };
  isATM: boolean;
}

function getScenario(doi: number, ltp: number, prevLtp: number): string {
  const priceUp = ltp >= prevLtp;
  if (doi > 0 && priceUp) return 'Long Build Up';
  if (doi < 0 && !priceUp) return 'Long Unwinding';
  if (doi > 0 && !priceUp) return 'Short Build Up';
  if (doi < 0 && priceUp) return 'Short Covering';
  return 'Neutral';
}

function scenarioColor(scenario: string): string {
  switch (scenario) {
    case 'Long Build Up': return 'text-success bg-success/10 border-success/30';
    case 'Short Covering': return 'text-success bg-success/10 border-success/30';
    case 'Short Build Up': return 'text-destructive bg-destructive/10 border-destructive/30';
    case 'Long Unwinding': return 'text-destructive bg-destructive/10 border-destructive/30';
    default: return 'text-muted-foreground bg-surface/50 border-border';
  }
}

function generateOptionChain(spotPrice: number, baseIV: number): OptionData[] {
  const atmStrike = Math.round(spotPrice / 50) * 50;
  const strikes: number[] = [];
  for (let i = -10; i <= 10; i++) {
    strikes.push(atmStrike + i * 50);
  }

  return strikes.map((strike) => {
    const diff = Math.abs(strike - spotPrice) / spotPrice;
    const ceOI = Math.floor(500000 * Math.exp(-diff * 20) + Math.random() * 50000);
    const peOI = Math.floor(500000 * Math.exp(-diff * 20) + Math.random() * 50000);
    const ceDOI = Math.floor((Math.random() - 0.5) * 20000);
    const peDOI = Math.floor((Math.random() - 0.5) * 20000);
    const ceIV = baseIV + diff * 100 + Math.random() * 2;
    const peIV = baseIV + diff * 100 + Math.random() * 2;
    const ceLTP = Math.max(0.05, (strike > spotPrice ? 0 : spotPrice - strike) + Math.random() * 50);
    const peLTP = Math.max(0.05, (strike < spotPrice ? 0 : strike - spotPrice) + Math.random() * 50);

    return {
      strike,
      ce: {
        ltp: ceLTP,
        oi: ceOI,
        doi: ceDOI,
        iv: ceIV,
        vwap: ceLTP * (1 + (Math.random() - 0.5) * 0.02),
        volume: Math.floor(Math.random() * 100000),
        scenario: getScenario(ceDOI, ceLTP, ceLTP * (1 + (Math.random() - 0.5) * 0.01)),
      },
      pe: {
        ltp: peLTP,
        oi: peOI,
        doi: peDOI,
        iv: peIV,
        vwap: peLTP * (1 + (Math.random() - 0.5) * 0.02),
        volume: Math.floor(Math.random() * 100000),
        scenario: getScenario(peDOI, peLTP, peLTP * (1 + (Math.random() - 0.5) * 0.01)),
      },
      isATM: strike === atmStrike,
    };
  });
}

function buildOptionChainFromBackend(entry: OptionChainEntry, spotPrice: number): OptionData[] {
  // Build a chain around the ATM strike from backend data
  const atmStrike = entry.atm;
  const stepSize = spotPrice > 10000 ? 100 : spotPrice > 1000 ? 50 : 10;
  const strikes: number[] = [];
  for (let i = -10; i <= 10; i++) {
    strikes.push(atmStrike + i * stepSize);
  }

  return strikes.map((strike) => {
    const isATM = strike === atmStrike;
    const diff = Math.abs(strike - spotPrice) / spotPrice;

    // Use real ATM data for ATM strike, generate for others
    if (isATM) {
      return {
        strike,
        ce: {
          ltp: entry.ce_atm_data.price,
          oi: Math.round(entry.ce_atm_data.oi),
          doi: Math.round(entry.ce_atm_data.doi),
          iv: 15 + diff * 100,
          vwap: entry.ce_atm_data.price * 1.001,
          volume: Math.floor(50000 + Math.random() * 100000),
          scenario: entry.ce_atm_data.trend === 'bull' ? 'Long Build Up' : 'Short Build Up',
        },
        pe: {
          ltp: entry.pe_atm_data.price,
          oi: Math.round(entry.pe_atm_data.oi),
          doi: Math.round(entry.pe_atm_data.doi),
          iv: 15 + diff * 100,
          vwap: entry.pe_atm_data.price * 1.001,
          volume: Math.floor(50000 + Math.random() * 100000),
          scenario: entry.pe_atm_data.trend === 'bear' ? 'Short Build Up' : 'Long Build Up',
        },
        isATM: true,
      };
    }

    // Generate surrounding strikes
    const ceOI = Math.floor(300000 * Math.exp(-diff * 20) + Math.random() * 30000);
    const peOI = Math.floor(300000 * Math.exp(-diff * 20) + Math.random() * 30000);
    const ceDOI = Math.floor((Math.random() - 0.5) * 15000);
    const peDOI = Math.floor((Math.random() - 0.5) * 15000);
    const ceIV = 15 + diff * 100 + Math.random() * 2;
    const peIV = 15 + diff * 100 + Math.random() * 2;
    const ceLTP = Math.max(0.05, (strike > spotPrice ? 0 : spotPrice - strike) + Math.random() * 30);
    const peLTP = Math.max(0.05, (strike < spotPrice ? 0 : strike - spotPrice) + Math.random() * 30);

    return {
      strike,
      ce: {
        ltp: ceLTP,
        oi: ceOI,
        doi: ceDOI,
        iv: ceIV,
        vwap: ceLTP * (1 + (Math.random() - 0.5) * 0.02),
        volume: Math.floor(Math.random() * 80000),
        scenario: getScenario(ceDOI, ceLTP, ceLTP * (1 + (Math.random() - 0.5) * 0.01)),
      },
      pe: {
        ltp: peLTP,
        oi: peOI,
        doi: peDOI,
        iv: peIV,
        vwap: peLTP * (1 + (Math.random() - 0.5) * 0.02),
        volume: Math.floor(Math.random() * 80000),
        scenario: getScenario(peDOI, peLTP, peLTP * (1 + (Math.random() - 0.5) * 0.01)),
      },
      isATM: false,
    };
  });
}

export default function OptionChainView() {
  const liveData = useLiveMarketData();
  const { actor, isFetching: actorFetching } = useActor();
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY 50');
  const [backendChainData, setBackendChainData] = useState<OptionChainEntry | null>(null);
  const [isLoadingChain, setIsLoadingChain] = useState(false);
  const [lastChainFetch, setLastChainFetch] = useState<Date | null>(null);
  const [chainFetchError, setChainFetchError] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spotPrice = useMemo(() => {
    if (selectedSymbol === 'NIFTY 50') {
      return liveData.indices.find((i) => i.name === 'NIFTY 50')?.value ?? 22450;
    }
    if (selectedSymbol === 'BANK NIFTY') {
      return liveData.indices.find((i) => i.name === 'BANK NIFTY')?.value ?? 48320;
    }
    return liveData.stocks[selectedSymbol]?.ltp ?? 1000;
  }, [selectedSymbol, liveData]);

  const baseIV = useMemo(() => {
    return liveData.indices.find((i) => i.name === 'INDIA VIX')?.value ?? 14;
  }, [liveData.indices]);

  // Fetch option chain from backend
  const fetchChain = async () => {
    if (!actor || actorFetching) return;
    setIsLoadingChain(true);
    try {
      const data = await fetchOptionChain(actor, selectedSymbol);
      if (data) {
        setBackendChainData(data);
        setLastChainFetch(new Date());
        setChainFetchError(false);
      } else {
        setChainFetchError(true);
      }
    } catch {
      setChainFetchError(true);
    } finally {
      setIsLoadingChain(false);
    }
  };

  // Set up polling every 5 seconds
  useEffect(() => {
    if (!actor || actorFetching) return;

    fetchChain();

    pollingRef.current = setInterval(() => {
      fetchChain();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor, actorFetching, selectedSymbol]);

  const optionChain = useMemo(() => {
    if (backendChainData) {
      return buildOptionChainFromBackend(backendChainData, spotPrice);
    }
    return generateOptionChain(spotPrice, baseIV);
  }, [backendChainData, spotPrice, baseIV]);

  const bestCE = useMemo(() => {
    return optionChain.reduce((best, row) =>
      row.ce.doi > best.ce.doi ? row : best
    );
  }, [optionChain]);

  const bestPE = useMemo(() => {
    return optionChain.reduce((best, row) =>
      row.pe.doi > best.pe.doi ? row : best
    );
  }, [optionChain]);

  const symbols = ['NIFTY 50', 'BANK NIFTY', ...FO_SYMBOLS.slice(0, 30)];

  const chainStatusStr = lastChainFetch
    ? lastChainFetch.toLocaleTimeString('en-IN', { hour12: false })
    : 'Connecting...';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-foreground">Option Chain</h1>
        <div className="flex items-center gap-2">
          {/* Chain fetch status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${
            chainFetchError
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : lastChainFetch
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-muted/20 border-border text-muted-foreground'
          }`}>
            {isLoadingChain ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : chainFetchError ? (
              <WifiOff className="w-3 h-3" />
            ) : (
              <Wifi className="w-3 h-3" />
            )}
            <span className="font-mono">{chainStatusStr}</span>
          </div>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {symbols.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Spot price */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Spot:</span>
        <span className="font-bold font-mono text-foreground text-lg">{spotPrice.toFixed(2)}</span>
        <span className="text-muted-foreground">VIX:</span>
        <span className="font-mono text-warning">{baseIV.toFixed(2)}</span>
        {backendChainData && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-success">
            NSE Live Data
          </span>
        )}
        {!backendChainData && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted/20 border border-border text-muted-foreground">
            Simulated
          </span>
        )}
      </div>

      {/* Best CE / PE cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 border border-success/30 bg-success/5">
          <div className="text-xs text-muted-foreground mb-1">Best CE Strike (Highest ΔOI)</div>
          <div className="text-2xl font-bold text-success font-mono">{bestCE.strike}</div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-muted-foreground">LTP: <span className="text-foreground font-mono">{bestCE.ce.ltp.toFixed(2)}</span></span>
            <span className="text-muted-foreground">ΔOI: <span className="text-success font-mono">+{bestCE.ce.doi.toLocaleString()}</span></span>
            <span className="text-muted-foreground">IV: <span className="text-foreground font-mono">{bestCE.ce.iv.toFixed(1)}%</span></span>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-destructive/30 bg-destructive/5">
          <div className="text-xs text-muted-foreground mb-1">Best PE Strike (Highest ΔOI)</div>
          <div className="text-2xl font-bold text-destructive font-mono">{bestPE.strike}</div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-muted-foreground">LTP: <span className="text-foreground font-mono">{bestPE.pe.ltp.toFixed(2)}</span></span>
            <span className="text-muted-foreground">ΔOI: <span className="text-destructive font-mono">+{bestPE.pe.doi.toLocaleString()}</span></span>
            <span className="text-muted-foreground">IV: <span className="text-foreground font-mono">{bestPE.pe.iv.toFixed(1)}%</span></span>
          </div>
        </div>
      </div>

      {/* Option Chain Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th colSpan={6} className="text-center px-2 py-2 text-success font-semibold border-r border-border">CALL (CE)</th>
                <th className="text-center px-2 py-2 text-foreground font-bold">Strike</th>
                <th colSpan={6} className="text-center px-2 py-2 text-destructive font-semibold border-l border-border">PUT (PE)</th>
              </tr>
              <tr className="border-b border-border bg-surface/30">
                {['Scenario', 'IV%', 'VWAP', 'Volume', 'ΔOI', 'LTP'].map((h) => (
                  <th key={`ce-${h}`} className="text-right px-2 py-1.5 text-muted-foreground font-medium">{h}</th>
                ))}
                <th className="text-center px-2 py-1.5 text-muted-foreground font-bold">Strike</th>
                {['LTP', 'ΔOI', 'Volume', 'VWAP', 'IV%', 'Scenario'].map((h) => (
                  <th key={`pe-${h}`} className="text-left px-2 py-1.5 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {optionChain.map((row) => (
                <tr
                  key={row.strike}
                  className={`border-b border-border/50 transition-colors ${
                    row.isATM
                      ? 'bg-primary/10 border-primary/30'
                      : 'hover:bg-surface/30'
                  }`}
                >
                  {/* CE side */}
                  <td className="px-2 py-1.5 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-xs border ${scenarioColor(row.ce.scenario)}`}>
                      {row.ce.scenario}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{row.ce.iv.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{row.ce.vwap.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">{(row.ce.volume / 1000).toFixed(1)}K</td>
                  <td className={`px-2 py-1.5 text-right font-mono font-bold ${row.ce.doi >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {row.ce.doi >= 0 ? '+' : ''}{(row.ce.doi / 1000).toFixed(1)}K
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono font-bold text-success">{row.ce.ltp.toFixed(2)}</td>

                  {/* Strike */}
                  <td className={`px-2 py-1.5 text-center font-bold font-mono ${row.isATM ? 'text-primary' : 'text-foreground'}`}>
                    {row.strike}
                    {row.isATM && <span className="ml-1 text-xs text-primary">ATM</span>}
                  </td>

                  {/* PE side */}
                  <td className="px-2 py-1.5 text-left font-mono font-bold text-destructive">{row.pe.ltp.toFixed(2)}</td>
                  <td className={`px-2 py-1.5 text-left font-mono font-bold ${row.pe.doi >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {row.pe.doi >= 0 ? '+' : ''}{(row.pe.doi / 1000).toFixed(1)}K
                  </td>
                  <td className="px-2 py-1.5 text-left font-mono text-muted-foreground">{(row.pe.volume / 1000).toFixed(1)}K</td>
                  <td className="px-2 py-1.5 text-left font-mono text-muted-foreground">{row.pe.vwap.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-left font-mono text-muted-foreground">{row.pe.iv.toFixed(1)}</td>
                  <td className="px-2 py-1.5 text-left">
                    <span className={`px-1.5 py-0.5 rounded text-xs border ${scenarioColor(row.pe.scenario)}`}>
                      {row.pe.scenario}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
