import { useEffect, useRef } from 'react';
import { useLiveMarketData } from '../hooks/useQueries';

interface CandlestickChartProps {
  symbol?: string;
}

export default function CandlestickChart({ symbol = 'NIFTY 50' }: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveData = useLiveMarketData();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = 400;

    const w = canvas.width;
    const h = canvas.height;

    // Get base price from live data
    const indexEntry = liveData.indices.find((i) => i.name === symbol);
    const stockEntry = liveData.stocks[symbol];
    let price = indexEntry?.value ?? stockEntry?.ltp ?? 22500;

    const candles: Array<{ o: number; c: number; h: number; l: number }> = [];

    for (let i = 0; i < 60; i++) {
      const open = price;
      const close = open + (Math.random() - 0.5) * (price * 0.003);
      const high = Math.max(open, close) + Math.random() * (price * 0.002);
      const low = Math.min(open, close) - Math.random() * (price * 0.002);
      candles.push({ o: open, c: close, h: high, l: low });
      price = close;
    }

    const allPrices = candles.flatMap((c) => [c.h, c.l]);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 1;
    const px = (val: number) => h - 30 - ((val - minP) / range) * (h - 60);

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = 30 + (i / 4) * (h - 60);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const candleW = (w - 60) / 60;
    const greenColor = 'oklch(0.696 0.17 162.48)';
    const redColor = 'oklch(0.577 0.245 27.325)';

    candles.forEach((c, i) => {
      const x = i * candleW + 30;
      const isGreen = c.c >= c.o;

      ctx.fillStyle = isGreen ? greenColor : redColor;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, px(c.h));
      ctx.lineTo(x + candleW / 2, px(c.l));
      ctx.stroke();

      // Body
      const bodyH = Math.max(Math.abs(px(c.o) - px(c.c)), 1);
      const bodyY = Math.min(px(c.o), px(c.c));
      ctx.fillRect(x, bodyY, candleW - 2, bodyH);
    });

    // Moving average line
    ctx.strokeStyle = 'oklch(0.769 0.188 70.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    candles.forEach((c, i) => {
      const x = i * candleW + 30 + candleW / 2;
      const y = px((c.o + c.c) / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [symbol, liveData.lastUpdated]);

  return <canvas ref={canvasRef} className="h-[400px] w-full" />;
}
