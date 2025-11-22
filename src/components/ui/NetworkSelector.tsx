import React from 'react';
import type { CryptoNetwork } from '../../types/currency';
import { Badge } from './Badge';

interface NetworkSelectorProps {
  availableNetworks: CryptoNetwork[];
  selectedNetworks: CryptoNetwork[];
  onChange: (networks: CryptoNetwork[]) => void;
  error?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  availableNetworks,
  selectedNetworks,
  onChange,
  error,
}) => {
  const handleToggleNetwork = (network: CryptoNetwork) => {
    if (selectedNetworks.includes(network)) {
      onChange(selectedNetworks.filter((n) => n !== network));
    } else {
      onChange([...selectedNetworks, network]);
    }
  };

  if (availableNetworks.length === 0) {
    return null;
  }

  // If only one network, auto-select and don't show selector
  if (availableNetworks.length === 1) {
    if (!selectedNetworks.includes(availableNetworks[0])) {
      onChange([availableNetworks[0]]);
    }
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Сеть: <Badge variant="blue">{availableNetworks[0]}</Badge>
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Выберите сеть (можно несколько) <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableNetworks.map((network) => {
          const isSelected = selectedNetworks.includes(network);
          return (
            <div
              key={network}
              onClick={() => handleToggleNetwork(network)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-dark-200 dark:border-dark-700 hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}} // Handled by div onClick
                  className="w-4 h-4 text-primary-500 rounded cursor-pointer"
                />
                <span className="font-medium text-sm">{network}</span>
              </div>
              {getNetworkInfo(network) && (
                <p className="text-xs text-dark-500 mt-1 ml-6">
                  {getNetworkInfo(network)}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      {selectedNetworks.length === 0 && (
        <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
          Выберите хотя бы одну сеть
        </p>
      )}
    </div>
  );
};

/**
 * Get additional information about a network
 */
function getNetworkInfo(network: CryptoNetwork): string | null {
  const info: Record<CryptoNetwork, string> = {
    TRC20: 'TRON сеть - низкие комиссии',
    ERC20: 'Ethereum сеть - высокие комиссии',
    BEP20: 'Binance Smart Chain - средние комиссии',
    BTC: 'Bitcoin сеть',
    ETH: 'Ethereum основная сеть',
    XRP: 'Ripple сеть',
    Solana: 'Solana сеть - быстрая',
    DOGE: 'Dogecoin сеть',
    XMR: 'Monero сеть - приватная',
    LTC: 'Litecoin сеть',
    Sui: 'Sui сеть',
  };
  return info[network] || null;
}
