'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';

interface Props {
  coinId: string;
  coinName: string;
  coinSymbol?: string;
  onClose: () => void;
}

const PERIODS = [
  { label: '7D',  days: '7' },
  { label: '30D', days: '30' },
  { label: '90D', days: '90' },
];

export default function PriceChart({ coinId, coinName, coinSymbol, onClose }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  const [days, setDays] = useState('7');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ min: number; max: number; change: number } | null>(null);

  // Crear chart una sola vez
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 340,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#ffffff08' },
        horzLines: { color: '#ffffff08' },
      },
      crosshair: {
        vertLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#6366f1',
        },
        horzLine: {
          color: '#6366f1',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#6366f1',
        },
      },
      rightPriceScale: {
        borderColor: '#ffffff15',
      },
      timeScale: {
        borderColor: '#ffffff15',
        timeVisible: false,
      },
    });

    // ✅ v4 API: addAreaSeries
    const series = chart.addAreaSeries({
      lineColor: '#6366f1',
      topColor: 'rgba(99, 102, 241, 0.4)',
      bottomColor: 'rgba(99, 102, 241, 0.0)',
      lineWidth: 2,
      priceLineVisible: true,
      priceLineColor: '#6366f180',
      priceLineStyle: LineStyle.Dashed,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
      crosshairMarkerBackgroundColor: '#6366f1',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Responsive
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Cargar datos cuando cambia días o coinId
  useEffect(() => {
    if (!seriesRef.current) return;

    setLoading(true);
    setError('');

    fetch(`/api/history/${coinId}?days=${days}`)
      .then(async res => {
        const text = await res.text();
        if (!text || text.trim() === '') throw new Error('Rate limit de CoinGecko. Espera 30s.');
        return JSON.parse(text);
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        if (!Array.isArray(data) || data.length === 0) throw new Error('Sin datos.');

        // Formato { time: 'YYYY-MM-DD', value: number }
        const formatted = data.map((d: { date: string; price: number }) => ({
          time: d.date,
          value: d.price,
        }));

        // Estadísticas
        const prices = data.map((d: any) => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const change = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
        setStats({ min, max, change });

        seriesRef.current.setData(formatted);
        chartRef.current.timeScale().fitContent();
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [coinId, days]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-white">{coinName}</h2>
              {coinSymbol && (
                <span className="text-xs bg-white/10 px-2 py-1 rounded font-mono text-gray-400 uppercase">
                  {coinSymbol}/USD
                </span>
              )}
            </div>
            {stats && (
              <div className="flex items-center space-x-4 mt-1">
                <span className={`text-sm font-bold ${stats.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stats.change >= 0 ? '▲' : '▼'} {Math.abs(stats.change).toFixed(2)}%
                </span>
                <span className="text-xs text-gray-500">
                  H: ${stats.max.toLocaleString()} · L: ${stats.min.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex bg-white/5 rounded-lg p-1 space-x-1">
              {PERIODS.map(p => (
                <button
                  key={p.days}
                  onClick={() => setDays(p.days)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    days === p.days
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="relative px-2 py-4" style={{ height: '380px' }}>
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 bg-[#0f1117]">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent"></div>
              <p className="text-gray-500 text-sm">Cargando datos...</p>
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 z-10">
              <p className="text-4xl">⚠️</p>
              <p className="text-red-400 font-bold text-sm">{error}</p>
              <button
                onClick={() => setDays(d => d)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold"
              >
                🔄 Reintentar
              </button>
            </div>
          )}
          <div ref={chartContainerRef} className="w-full h-full" />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-gray-600">Datos: CoinGecko API</span>
          <span className="text-xs text-gray-600">Powered by TradingView Lightweight Charts</span>
        </div>
      </div>
    </div>
  );
}