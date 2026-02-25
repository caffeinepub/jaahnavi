export interface ScenarioResult {
  text: string;
  class: 'badge-bull' | 'badge-bear' | 'badge-neutral';
}

export function getScenario(priceChg: number, oiChg: number): ScenarioResult {
  if (priceChg > 0 && oiChg > 0) return { text: 'Long Build Up', class: 'badge-bull' };
  if (priceChg < 0 && oiChg > 0) return { text: 'Short Build Up', class: 'badge-bear' };
  if (priceChg < 0 && oiChg < 0) return { text: 'Long Liquidation', class: 'badge-bear' };
  if (priceChg > 0 && oiChg < 0) return { text: 'Short Covering', class: 'badge-bull' };
  return { text: 'Neutral', class: 'badge-neutral' };
}

export function generateOptionChain(symbol: string, spot: number) {
  const atm = Math.round(spot / 100) * 100;
  const strikes: number[] = [];
  for (let i = -5; i <= 5; i++) strikes.push(atm + i * 100);

  return strikes.map((strike) => {
    const dist = strike - spot;
    const ce_oi = Math.floor(Math.random() * 150000 + 50000);
    const pe_oi = Math.floor(Math.random() * 150000 + 50000);
    const ce_doi = Math.floor(Math.random() * 30000 - 10000);
    const pe_doi = Math.floor(Math.random() * 30000 - 10000);

    let ce_ltp = Math.max(0.1, -dist * 0.5 + Math.random() * 45 + 5 + (dist < 0 ? Math.abs(dist) : 0));
    let pe_ltp = Math.max(0.1, dist * 0.5 + Math.random() * 45 + 5 + (dist > 0 ? Math.abs(dist) : 0));

    const ce_chg = (Math.random() - 0.5) * 4;
    const pe_chg = (Math.random() - 0.5) * 4;

    const ce_scenario = getScenario(ce_chg, ce_doi);
    const pe_scenario = getScenario(pe_chg, pe_doi);

    return {
      strike,
      ce: {
        ltp: ce_ltp,
        chg: ce_chg,
        oi: ce_oi,
        doi: ce_doi,
        vwap: ce_ltp * (0.98 + Math.random() * 0.04),
        iv: (12 + Math.random() * 6).toFixed(1),
        ath: ce_ltp * 1.2,
        action: ce_doi > 5000 ? 'BUY' : ce_doi < -5000 ? 'SELL' : 'HOLD',
        scenario: ce_scenario,
      },
      pe: {
        ltp: pe_ltp,
        chg: pe_chg,
        oi: pe_oi,
        doi: pe_doi,
        vwap: pe_ltp * (0.98 + Math.random() * 0.04),
        iv: (12 + Math.random() * 6).toFixed(1),
        ath: pe_ltp * 1.2,
        action: pe_doi > 5000 ? 'BUY' : pe_doi < -5000 ? 'SELL' : 'HOLD',
        scenario: pe_scenario,
      },
      analysis: {
        pcr_oi: (pe_oi / ce_oi).toFixed(2),
        pcr_doi: ce_doi !== 0 ? (pe_doi / ce_doi).toFixed(2) : '0',
        trend: pe_doi > ce_doi ? 'Bullish' : 'Bearish',
        oi_diff: pe_oi - ce_oi,
        doi_diff: pe_doi - ce_doi,
      },
    };
  });
}

export interface CandlestickPatternResult {
  patternType: string;
  category: 'bullish' | 'bearish' | 'neutral';
}

export function detectCandlestickPatterns(
  open: number,
  high: number,
  low: number,
  close: number,
  prevOpen?: number,
  prevHigh?: number,
  prevLow?: number,
  prevClose?: number,
  prev2Open?: number,
  prev2High?: number,
  prev2Low?: number,
  prev2Close?: number
): CandlestickPatternResult[] {
  const patterns: CandlestickPatternResult[] = [];
  const body = Math.abs(close - open);
  const wickTop = high - Math.max(open, close);
  const wickBot = Math.min(open, close) - low;
  const range = high - low;
  const bodyPercent = range > 0 ? body / range : 0;

  // BULLISH PATTERNS

  // Hammer Pattern
  if (wickBot > body * 2 && wickTop < body * 0.3 && close > open && bodyPercent < 0.4) {
    patterns.push({ patternType: 'Hammer', category: 'bullish' });
  }

  // Inverse Hammer
  if (wickTop > body * 2 && wickBot < body * 0.3 && close > open && bodyPercent < 0.4) {
    patterns.push({ patternType: 'Inverse Hammer', category: 'bullish' });
  }

  // Bullish Engulfing (requires previous candle)
  if (prevOpen !== undefined && prevClose !== undefined) {
    const prevBearish = prevClose < prevOpen;
    const currentBullish = close > open;
    if (prevBearish && currentBullish && close > prevOpen && open < prevClose) {
      patterns.push({ patternType: 'Bullish Engulfing', category: 'bullish' });
    }

    // Piercing Line
    const prevBody = Math.abs(prevClose - prevOpen);
    const midpoint = prevClose + (prevOpen - prevClose) / 2;
    if (prevBearish && currentBullish && open < prevClose && close > midpoint && close < prevOpen) {
      patterns.push({ patternType: 'Piercing Line', category: 'bullish' });
    }
  }

  // Morning Star (requires two previous candles)
  if (
    prev2Open !== undefined &&
    prev2Close !== undefined &&
    prevOpen !== undefined &&
    prevClose !== undefined
  ) {
    const firstBearish = prev2Close < prev2Open;
    const middleSmall = Math.abs(prevClose - prevOpen) < Math.abs(prev2Close - prev2Open) * 0.3;
    const thirdBullish = close > open;
    const thirdCloseAboveMid = close > (prev2Open + prev2Close) / 2;
    if (firstBearish && middleSmall && thirdBullish && thirdCloseAboveMid) {
      patterns.push({ patternType: 'Morning Star', category: 'bullish' });
    }
  }

  // Three White Soldiers (requires two previous candles)
  if (
    prev2Open !== undefined &&
    prev2High !== undefined &&
    prev2Low !== undefined &&
    prev2Close !== undefined &&
    prevOpen !== undefined &&
    prevHigh !== undefined &&
    prevLow !== undefined &&
    prevClose !== undefined
  ) {
    const firstBullish = prev2Close > prev2Open;
    const secondBullish = prevClose > prevOpen;
    const thirdBullish = close > open;
    const consecutive = prevClose > prev2Close && close > prevClose;
    const longBodies =
      Math.abs(prev2Close - prev2Open) > (prev2High - prev2Low) * 0.6 &&
      Math.abs(prevClose - prevOpen) > (prevHigh - prevLow) * 0.6 &&
      body > range * 0.6;
    if (firstBullish && secondBullish && thirdBullish && consecutive && longBodies) {
      patterns.push({ patternType: 'Three White Soldiers', category: 'bullish' });
    }
  }

  // Dragonfly Doji (at support)
  const isDoji = body < range * 0.1;
  if (isDoji && wickBot > range * 0.6 && wickTop < range * 0.1) {
    patterns.push({ patternType: 'Dragonfly Doji', category: 'bullish' });
  }

  // BEARISH PATTERNS

  // Hanging Man
  if (wickBot > body * 2 && wickTop < body * 0.3 && close < open && bodyPercent < 0.4) {
    patterns.push({ patternType: 'Hanging Man', category: 'bearish' });
  }

  // Shooting Star
  if (wickTop > body * 2 && wickBot < body * 0.3 && close < open && bodyPercent < 0.4) {
    patterns.push({ patternType: 'Shooting Star', category: 'bearish' });
  }

  // Bearish Engulfing (requires previous candle)
  if (prevOpen !== undefined && prevClose !== undefined) {
    const prevBullish = prevClose > prevOpen;
    const currentBearish = close < open;
    if (prevBullish && currentBearish && close < prevOpen && open > prevClose) {
      patterns.push({ patternType: 'Bearish Engulfing', category: 'bearish' });
    }

    // Dark Cloud Cover
    const prevBody = Math.abs(prevClose - prevOpen);
    const midpoint = prevOpen + (prevClose - prevOpen) / 2;
    if (prevBullish && currentBearish && open > prevClose && close < midpoint && close > prevOpen) {
      patterns.push({ patternType: 'Dark Cloud Cover', category: 'bearish' });
    }
  }

  // Evening Star (requires two previous candles)
  if (
    prev2Open !== undefined &&
    prev2Close !== undefined &&
    prevOpen !== undefined &&
    prevClose !== undefined
  ) {
    const firstBullish = prev2Close > prev2Open;
    const middleSmall = Math.abs(prevClose - prevOpen) < Math.abs(prev2Close - prev2Open) * 0.3;
    const thirdBearish = close < open;
    const thirdCloseBelowMid = close < (prev2Open + prev2Close) / 2;
    if (firstBullish && middleSmall && thirdBearish && thirdCloseBelowMid) {
      patterns.push({ patternType: 'Evening Star', category: 'bearish' });
    }
  }

  // Three Black Crows (requires two previous candles)
  if (
    prev2Open !== undefined &&
    prev2High !== undefined &&
    prev2Low !== undefined &&
    prev2Close !== undefined &&
    prevOpen !== undefined &&
    prevHigh !== undefined &&
    prevLow !== undefined &&
    prevClose !== undefined
  ) {
    const firstBearish = prev2Close < prev2Open;
    const secondBearish = prevClose < prevOpen;
    const thirdBearish = close < open;
    const consecutive = prevClose < prev2Close && close < prevClose;
    const longBodies =
      Math.abs(prev2Close - prev2Open) > (prev2High - prev2Low) * 0.6 &&
      Math.abs(prevClose - prevOpen) > (prevHigh - prevLow) * 0.6 &&
      body > range * 0.6;
    if (firstBearish && secondBearish && thirdBearish && consecutive && longBodies) {
      patterns.push({ patternType: 'Three Black Crows', category: 'bearish' });
    }
  }

  // Gravestone Doji (at resistance)
  if (isDoji && wickTop > range * 0.6 && wickBot < range * 0.1) {
    patterns.push({ patternType: 'Gravestone Doji', category: 'bearish' });
  }

  // NEUTRAL PATTERNS

  // Doji
  if (isDoji && wickTop > range * 0.2 && wickBot > range * 0.2) {
    patterns.push({ patternType: 'Doji', category: 'neutral' });
  }

  // Spinning Top
  const smallBody = body < range * 0.3;
  const hasWicks = wickTop > body * 0.5 && wickBot > body * 0.5;
  if (smallBody && hasWicks && !isDoji) {
    patterns.push({ patternType: 'Spinning Top', category: 'neutral' });
  }

  return patterns.length > 0 ? patterns : [{ patternType: 'No Pattern', category: 'neutral' }];
}

// Legacy function for backward compatibility
export function detectCandlePattern(open: number, high: number, low: number, close: number): string {
  const patterns = detectCandlestickPatterns(open, high, low, close);
  return patterns[0]?.patternType || 'Neutral';
}
