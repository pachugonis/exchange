import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Loader } from 'lucide-react';
import type { CoinGeckoSimpleCoin } from '../../types/currency';
import { Badge } from './Badge';

interface CryptoSelectProps {
  coins: CoinGeckoSimpleCoin[];
  isLoading: boolean;
  onSelect: (coin: CoinGeckoSimpleCoin) => void;
  selectedCoin: CoinGeckoSimpleCoin | null;
  error?: string;
}

export const CryptoSelect: React.FC<CryptoSelectProps> = ({
  coins,
  isLoading,
  onSelect,
  selectedCoin,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCoins, setFilteredCoins] = useState<CoinGeckoSimpleCoin[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter coins based on search term
  useEffect(() => {
    if (!searchTerm) {
      // Show top 100 popular coins by default
      setFilteredCoins(coins.slice(0, 100));
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(term) ||
        coin.symbol.toLowerCase().includes(term) ||
        coin.id.toLowerCase().includes(term)
    );
    setFilteredCoins(filtered.slice(0, 100)); // Limit to 100 results
  }, [searchTerm, coins]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (coin: CoinGeckoSimpleCoin) => {
    onSelect(coin);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium mb-2">
        Выберите криптовалюту <span className="text-red-500">*</span>
      </label>

      {/* Selected coin display / Search input */}
      <div
        className={`w-full px-4 py-2.5 bg-white dark:bg-dark-700 border rounded-lg cursor-pointer transition ${
          error
            ? 'border-red-500'
            : 'border-dark-300 dark:border-dark-600 hover:border-primary-500 dark:hover:border-primary-500'
        }`}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
      >
        {selectedCoin ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedCoin.iconUrl && (
                <img
                  src={selectedCoin.iconUrl}
                  alt={selectedCoin.name}
                  className="w-6 h-6 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div>
                <span className="font-semibold">{selectedCoin.name}</span>
                <span className="text-dark-500 ml-2">({selectedCoin.symbol})</span>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 transition ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        ) : (
          <div className="flex items-center justify-between text-dark-500">
            <span>Начните вводить название криптовалюты...</span>
            <ChevronDown className={`w-5 h-5 transition ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-dark-200 dark:border-dark-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск по названию или символу..."
                className="w-full pl-10 pr-4 py-2 bg-dark-50 dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-8 flex flex-col items-center justify-center text-dark-500">
              <Loader className="w-8 h-8 animate-spin mb-2" />
              <p>Загрузка списка криптовалют...</p>
            </div>
          )}

          {/* Coins list */}
          {!isLoading && (
            <div className="overflow-y-auto max-h-80">
              {filteredCoins.length > 0 ? (
                filteredCoins.map((coin) => (
                  <div
                    key={coin.id}
                    onClick={() => handleSelect(coin)}
                    className="px-4 py-3 hover:bg-dark-50 dark:hover:bg-dark-700 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {coin.iconUrl && (
                        <img
                          src={coin.iconUrl}
                          alt={coin.name}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium group-hover:text-primary-500">
                          {coin.name}
                        </div>
                        <div className="text-sm text-dark-500">{coin.symbol}</div>
                      </div>
                    </div>
                    {coin.platforms && coin.platforms.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                        {coin.platforms.slice(0, 3).map((platform) => (
                          <Badge key={platform} variant="blue" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                        {coin.platforms.length > 3 && (
                          <Badge variant="gray" className="text-xs">
                            +{coin.platforms.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-dark-500">
                  {searchTerm
                    ? 'Криптовалюта не найдена. Попробуйте другой запрос.'
                    : 'Список криптовалют пуст.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
