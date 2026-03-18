// app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import PriceChart from '@/components/PriceChart';

function formatNumber(num: number): string {
  if (!num) return 'N/A';
  if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

type SortKey = 'market_cap' | 'current_price' | 'price_change_percentage_24h' | 'total_volume';
type SortDir = 'asc' | 'desc';

export default function Home() {
  const [coins, setCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('market_cap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [countdown, setCountdown] = useState(30);
  const [selectedCoin, setSelectedCoin] = useState<{ id: string; name: string } | null>(null);

  const loadData = useCallback(async () => {
    const res = await fetch('/api/markets');
    const data = await res.json();
    setCoins(data);
    setLoading(false);
    setCountdown(30);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-xs">
      {sortKey === col ? (sortDir === 'desc' ? '▼' : '▲') : '⇅'}
    </span>
  );

  const filteredCoins = coins
    .filter(coin =>
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      return mult * ((a[sortKey] || 0) - (b[sortKey] || 0));
    });

  if (loading && coins.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xl text-white">Cargando datos en tiempo real...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              🪙 CryptoTrack Pro
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-black/50 px-4 py-2 rounded-full border border-white/10">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-mono font-bold text-green-400">
                  Live · {countdown}s
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar Bitcoin, ETH..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-black/50 border border-white/20 px-4 py-2 rounded-full w-64 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">

        {/* Top 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {coins.slice(0, 4).map((coin: any, i: number) => (
            <div
              key={coin.id}
              onClick={() => setSelectedCoin({ id: coin.id, name: coin.name })}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xl font-black text-blue-400">#{i + 1}</span>
              </div>
              <h3 className="text-lg font-bold mb-1">{coin.name}</h3>
              <div className="text-2xl font-black mb-2">
                ${coin.current_price?.toLocaleString()}
              </div>
              <div className={`text-base font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
              </div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold">Top 100 Cryptocurrencies</h2>
            <p className="text-gray-400 text-sm mt-1">
              {filteredCoins.length} resultados · Clic en una fila para ver el gráfico histórico
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/30 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4 text-left">#</th>
                  <th className="p-4 text-left">Nombre</th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('current_price')}>
                    Precio <SortIcon col="current_price" />
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('market_cap')}>
                    Market Cap <SortIcon col="market_cap" />
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('total_volume')}>
                    Volumen 24h <SortIcon col="total_volume" />
                  </th>
                  <th className="p-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price_change_percentage_24h')}>
                    24h % <SortIcon col="price_change_percentage_24h" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin: any, index: number) => {
                  const change = coin.price_change_percentage_24h || 0;
                  return (
                    <tr
                      key={coin.id}
                      onClick={() => setSelectedCoin({ id: coin.id, name: coin.name })}
                      className="border-t border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-blue-400">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="w-9 h-9 rounded-full shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div>
                            <div className="font-semibold">{coin.name}</div>
                            <div className="text-xs text-gray-400 uppercase">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-lg font-black">${coin.current_price?.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-gray-300">
                        {formatNumber(coin.market_cap)}
                      </td>
                      <td className="p-4 text-right font-mono text-sm text-gray-300">
                        {formatNumber(coin.total_volume)}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          change >= 0
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-gray-600">
          Datos desde CoinGecko API · CryptoTrack Pro © 2026
        </p>
      </div>

      {/* Modal gráfico */}
      {selectedCoin && (
        <PriceChart
          coinId={selectedCoin.id}
          coinName={selectedCoin.name}
          onClose={() => setSelectedCoin(null)}
        />
      )}
    </div>
  );
}