# Specification

## Summary
**Goal:** Replace all mock/random price data with live NSE India prices by routing all market data fetches through a backend HTTP outcall proxy, and update all views to display real-time NSE data.

**Planned changes:**
- Add HTTP outcall logic in `backend/main.mo` to fetch F&O stock prices and index values from NSE India public endpoints, including required NSE headers; persist results in a stable HashMap; expose `getMarketSnapshot()`, `getIndicesSnapshot()`, `refreshMarketData()`, and `getOptionChain(symbol)` methods
- Update `frontend/src/lib/nseClient.ts` to call backend actor methods instead of making direct browser-to-NSE requests; export typed functions matching the `NSESnapshot` interface
- Update `frontend/src/hooks/useQueries.ts` to remove all `Math.random()` price mutation logic; on load, call `refreshMarketData()` then seed the central store; poll every 5 seconds via the backend proxy; ensure all views (Dashboard, FOListView, WatchlistView, BullishScannerView, BearishScannerView, OptionChainView, SectorsView) read from this single store
- Update `OptionChainView.tsx` to poll the backend `getOptionChain(symbol)` every 5 seconds while active, routing to the correct NSE endpoint (equities vs. indices); display live LTP, IV, OI, ΔOI, and Volume; recalculate Best CE / Best PE cards on each refresh
- Update the Header component and Dashboard status indicator to show "NSE LIVE" (green blinking dot), "DELAYED" (amber dot), or "OFFLINE" (red dot) based on time since last successful backend fetch, and display the last successful fetch timestamp

**User-visible outcome:** All views display the same real NSE India live prices simultaneously, refreshing every 5 seconds via the backend proxy, with a status badge accurately reflecting the live data connection state.
