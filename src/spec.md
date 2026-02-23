# Specification

## Summary
**Goal:** Expand candlestick pattern detection with 12 additional patterns and categorize all patterns into Bullish/Bearish/Neutral sections with trading bias indicators.

**Planned changes:**
- Add detection for 12 new candlestick patterns: Inverse Hammer, Piercing Line, Morning Star, Three White Soldiers, Dragonfly Doji, Hanging Man, Evening Star, Three Black Crows, Dark Cloud Cover, Gravestone Doji, Doji, and Spinning Top in frontend/src/lib/analytics.ts
- Categorize all patterns into three sections in CandleAnalysisView: Bullish Candles (green styling with "BUY/LONG Setup" bias), Bearish Candles (red styling with "SELL/SHORT Setup" bias), and Neutral Candles (gray/white styling with "WAIT/NO TRADE" bias)
- Add category descriptions for each section: "Expect Upside Reversal / Continuation" for bullish, "Expect Downside Reversal / Continuation" for bearish, and "Indecision / Sideways" for neutral
- Display pattern names with corresponding emoji indicators (🟢 for bullish, 🔴 for bearish, ⚪ for neutral)

**User-visible outcome:** Users can view detected candlestick patterns organized into three color-coded categories (Bullish, Bearish, Neutral) with clear trading bias indicators and descriptions to guide their trading decisions.
