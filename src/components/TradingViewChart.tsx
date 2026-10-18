import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  IChartApi,
  ISeriesApi,
  Time,
} from 'lightweight-charts';
import { CoinSymbol } from '../types';
import { binanceFeed, CandleData, PriceTick } from '../services/binanceSocket';
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface TradingViewChartProps {
  coin: CoinSymbol;
  entryPrice: number;
  currentPrice: number;
  roundStatus: 'BETTING_OPEN' | 'LOCKED' | 'SETTLED';
  height?: number;
  compact?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  coin,
  entryPrice,
  currentPrice,
  roundStatus,
  height = 140,
  compact = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const entryLineRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  const effectiveHeight = isFullscreen ? window.innerHeight - 80 : height;

  // Initialize and recreate chart when coin changes
  useEffect(() => {
    if (!containerRef.current) return;

    setLoading(true);

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const container = containerRef.current;

    // Create chart with strict light theme
    const chart = createChart(container, {
      width: container.clientWidth,
      height: effectiveHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#78716C',
        fontSize: 10,
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
      },
      grid: {
        vertLines: { color: 'rgba(230, 225, 213, 0.4)' },
        horzLines: { color: 'rgba(230, 225, 213, 0.4)' },
      },
      crosshair: {
        vertLine: {
          color: '#F59E0B',
          width: 1,
          style: 3,
          labelBackgroundColor: '#F59E0B',
        },
        horzLine: {
          color: '#F59E0B',
          width: 1,
          style: 3,
          labelBackgroundColor: '#F59E0B',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(230, 225, 213, 0.6)',
        autoScale: true,
        visible: !compact || isFullscreen,
      },
      timeScale: {
        borderColor: 'rgba(230, 225, 213, 0.6)',
        timeVisible: true,
        secondsVisible: false,
        visible: !compact || isFullscreen,
      },
    });

    chartRef.current = chart;

    // Add Candlestick Series: Emerald UP (#10B981), Ruby Red DOWN (#EF4444)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: true,
      borderUpColor: '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    seriesRef.current = candleSeries;

    // Load initial historical candles from Binance
    let isSubscribed = true;
    binanceFeed.fetchHistoricalKlines(coin, 50).then((candles) => {
      if (!isSubscribed || !candleSeries) return;
      const formatted = candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      candleSeries.setData(formatted);
      chart.timeScale().fitContent();
      setLoading(false);
    });

    // Subscribe to live kline updates
    const unsubCandles = binanceFeed.subscribeCandles(coin, (candle: CandleData) => {
      if (seriesRef.current) {
        seriesRef.current.update({
          time: candle.time as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      }
    });

    // Also update current candle with tick prices
    const unsubPrice = binanceFeed.subscribePrice(coin, (tick: PriceTick) => {
      if (seriesRef.current) {
        const now = Math.floor(Date.now() / 1000);
        const candleTime = (now - (now % 60)) as Time;
        try {
          seriesRef.current.update({
            time: candleTime,
            open: tick.price,
            high: tick.price,
            low: tick.price,
            close: tick.price,
          });
        } catch {
          // Time sequence catch
        }
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isSubscribed = false;
      unsubCandles();
      unsubPrice();
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [coin]);

  // Update entry price horizontal reference line
  useEffect(() => {
    if (!seriesRef.current || !entryPrice) return;

    if (entryLineRef.current) {
      try {
        seriesRef.current.removePriceLine(entryLineRef.current);
      } catch {
        // Line already removed
      }
      entryLineRef.current = null;
    }

    entryLineRef.current = seriesRef.current.createPriceLine({
      price: entryPrice,
      color: '#D97706', // Warm Amber/Gold
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: `ENTRY: $${entryPrice.toLocaleString()}`,
    });
  }, [entryPrice]);

  return (
    <div
      className={`relative rounded-xl border border-[#E6E1D5] bg-[#FFFDF9] p-3 shadow-xs transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-[#FFFDF9] p-6 shadow-2xl' : ''
      }`}
    >
      {/* Top Chart Header */}
      <div className="mb-2 flex items-center justify-between border-b border-[#F3EFE6] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1F2937]">{coin}/USDT</span>
          <span className="rounded bg-[#10B981]/10 px-2 py-0.5 text-xs font-semibold text-[#10B981]">
            1M Candlesticks
          </span>
          <span className="flex items-center gap-1 text-xs text-[#78716C]">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            Binance Live
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Entry vs Current indicator */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="text-[#78716C]">
              Entry:{' '}
              <strong className="font-tabular font-semibold text-[#D97706]">
                ${entryPrice > 0 ? entryPrice.toLocaleString() : '---'}
              </strong>
            </span>
            <span className="text-[#78716C]">
              Live:{' '}
              <strong
                className={`font-tabular font-bold ${
                  currentPrice >= entryPrice ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                ${currentPrice.toLocaleString()}
              </strong>
            </span>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E6E1D5] bg-white text-[#4B5563] hover:bg-[#F5F2EB] transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Chart Canvas Container */}
      <div className="relative w-full flex-1" style={{ height: effectiveHeight, minHeight: effectiveHeight }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#FFFDF9]/60 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs text-[#78716C]">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#F59E0B]" />
              <span>Binance Feed...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" style={{ height: effectiveHeight }} />
      </div>

      {/* Bottom Chart Status Bar */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#F3EFE6] pt-2 text-xs text-[#78716C]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" />
            Bullish UP Candle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#EF4444]" />
            Bearish DOWN Candle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 border-t-2 border-dashed border-[#D97706]" />
            Locked Entry Price
          </span>
        </div>

        <div className="font-tabular text-[11px] text-[#A8A29E]">
          Target: Exit Price vs Entry at Round Settlement
        </div>
      </div>
    </div>
  );
};
