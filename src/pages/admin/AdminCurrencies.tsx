import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { useTranslation } from '../../hooks/useTranslation';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Toggle } from '../../components/ui/Toggle';
import { Modal } from '../../components/ui/Modal';
import { CurrencyIcon } from '../../components/ui/CurrencyIcon';
import { CryptoSelect } from '../../components/ui/CryptoSelect';
import { NetworkSelector } from '../../components/ui/NetworkSelector';
import { currencies as initialCurrencies } from '../../data/currencies';
import type { Currency, CurrencyType, CryptoNetwork, CoinGeckoSimpleCoin, CoinDetailsResponse } from '../../types';
import { Plus, Edit2, Trash2, Save, X, Upload, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCoinsList, fetchCoinDetails } from '../../api/cryptoAPI';
import { getCryptoRussianName } from '../../utils/cryptoTranslations';

export const AdminCurrencies: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const stored = localStorage.getItem('currencies-data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Merge default currencies with stored custom currencies
        const defaultMap = new Map(initialCurrencies.map(c => [c.code, c]));
        const storedMap = new Map(parsed.map((c: Currency) => [c.code, c]));
        
        // Start with initial currencies and update with stored values
        const merged = initialCurrencies.map(defaultCurrency => {
          const stored = storedMap.get(defaultCurrency.code);
          return stored ? { ...defaultCurrency, ...stored } : defaultCurrency;
        });
        
        // Add custom currencies that are not in defaults
        parsed.forEach((currency: Currency) => {
          if (currency.isCustom && !defaultMap.has(currency.code)) {
            merged.push(currency);
          }
        });
        
        return merged;
      } catch (error) {
        console.error('Error loading currencies:', error);
        return initialCurrencies;
      }
    }
    return initialCurrencies;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Currency>>({});
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCurrency, setNewCurrency] = useState<Partial<Currency>>({
    type: 'custom',
    isActive: true,
    decimals: 2,
    minAmount: 0,
    maxAmount: 1000000,
    reserve: 0,
    icon: '💱',
    isCustom: true,
  });

  // CoinGecko state
  const [availableCoins, setAvailableCoins] = useState<CoinGeckoSimpleCoin[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinGeckoSimpleCoin | null>(null);
  const [coinDetails, setCoinDetails] = useState<CoinDetailsResponse | null>(null);
  const [selectedNetworks, setSelectedNetworks] = useState<CryptoNetwork[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Load coins list when modal opens with crypto type
  useEffect(() => {
    if (showAddModal && newCurrency.type === 'crypto' && availableCoins.length === 0) {
      loadCoinsList();
    }
  }, [showAddModal, newCurrency.type]);

  // Load coin details when a coin is selected
  useEffect(() => {
    if (selectedCoin) {
      loadCoinDetails(selectedCoin.id);
    }
  }, [selectedCoin]);

  const loadCoinsList = async () => {
    setIsLoadingCoins(true);
    try {
      const coins = await fetchCoinsList();
      // Add icon URLs from CoinGecko
      const coinsWithIcons = coins.map(coin => ({
        ...coin,
        iconUrl: `https://assets.coingecko.com/coins/images/${getCoinImageId(coin.id)}/small/${coin.id}.png`,
      }));
      setAvailableCoins(coinsWithIcons);
    } catch (error) {
      console.error('Failed to load coins list:', error);
      toast.error(t('admin.currencies.messages.loadCoinsError'));
    } finally {
      setIsLoadingCoins(false);
    }
  };

  const loadCoinDetails = async (coinId: string) => {
    setIsLoadingDetails(true);
    try {
      const details = await fetchCoinDetails(coinId);
      if (details) {
        setCoinDetails(details);
        // Auto-populate fields
        const russianName = getCryptoRussianName(details.name);
        setNewCurrency(prev => ({
          ...prev,
          code: details.symbol,
          name: russianName,
          nameEn: details.name,
          symbol: details.symbol,
          iconUrl: details.iconUrl,
          decimals: details.decimals,
        }));
        // Set available networks
        if (details.networks.length > 0) {
          // Auto-select first network or all if only one
          setSelectedNetworks(details.networks.length === 1 ? details.networks : [details.networks[0]]);
        }
      } else {
        toast.error(t('admin.currencies.messages.loadDetailsError'));
      }
    } catch (error) {
      console.error('Failed to load coin details:', error);
      toast.error(t('admin.currencies.messages.loadDetailsError'));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Helper function to get CoinGecko image ID (simplified)
  const getCoinImageId = (coinId: string): string => {
    // CoinGecko uses sequential IDs, but we'll use a simple mapping for popular coins
    const mapping: Record<string, string> = {
      'bitcoin': '1',
      'ethereum': '279',
      'tether': '325',
      'binancecoin': '825',
      'ripple': '44',
      'dogecoin': '5',
      'cardano': '975',
      'solana': '4128',
      'polkadot': '12171',
    };
    return mapping[coinId] || '1'; // Fallback to bitcoin icon
  };

  const handleCoinSelect = (coin: CoinGeckoSimpleCoin) => {
    setSelectedCoin(coin);
  };

  const saveCurrencies = (newCurrencies: Currency[]) => {
    setCurrencies(newCurrencies);
    localStorage.setItem('currencies-data', JSON.stringify(newCurrencies));
    toast.success(t('admin.currencies.messages.saved'));
  };

  const handleToggleActive = (id: string) => {
    const updated = currencies.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    saveCurrencies(updated);
  };

  const handleEdit = (currency: Currency) => {
    setEditingId(currency.id);
    setEditForm(currency);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updated = currencies.map((c) =>
      c.id === editingId ? { ...c, ...editForm } : c
    );
    saveCurrencies(updated);
    setEditingId(null);
    setEditForm({});
  };

  const handleUpdateField = (field: keyof Currency, value: any) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleAddCurrency = () => {
    // Validate required fields
    if (!newCurrency.code || !newCurrency.name || !newCurrency.nameEn) {
      toast.error(t('admin.currencies.messages.fillRequired'));
      return;
    }

    // Additional validation for crypto type
    if (newCurrency.type === 'crypto') {
      if (!selectedCoin) {
        toast.error(t('admin.currencies.form.selectCrypto'));
        return;
      }
      if (coinDetails && coinDetails.networks.length > 1 && selectedNetworks.length === 0) {
        toast.error(t('admin.currencies.form.selectNetworks'));
        return;
      }
    }

    // Check if code already exists
    if (currencies.some(c => c.code === newCurrency.code)) {
      toast.error(t('admin.common.messages.saveError'));
      return;
    }

    // Validate decimals
    if (newCurrency.decimals !== undefined && (newCurrency.decimals < 0 || newCurrency.decimals > 18)) {
      toast.error(t('admin.common.messages.saveError'));
      return;
    }

    // Validate amounts
    if (newCurrency.minAmount !== undefined && newCurrency.maxAmount !== undefined && 
        newCurrency.minAmount >= newCurrency.maxAmount) {
      toast.error(t('admin.common.messages.saveError'));
      return;
    }

    const currency: Currency = {
      id: `custom-${Date.now()}`,
      code: newCurrency.code!.toUpperCase(),
      name: newCurrency.name!,
      nameEn: newCurrency.nameEn!,
      type: newCurrency.type || 'custom',
      icon: newCurrency.icon || '💱',
      iconUrl: newCurrency.iconUrl,
      minAmount: newCurrency.minAmount || 0,
      maxAmount: newCurrency.maxAmount || 1000000,
      reserve: newCurrency.reserve || 0,
      isActive: newCurrency.isActive ?? true,
      symbol: newCurrency.symbol || newCurrency.code,
      decimals: newCurrency.decimals || 2,
      paymentAddress: newCurrency.paymentAddress,
      customRate: newCurrency.customRate,
      customCommission: newCurrency.customCommission,
      isCustom: true,
      // Add CoinGecko ID for automatic rate fetching
      coinGeckoId: selectedCoin?.id,
      // Add networks for crypto
      networks: newCurrency.type === 'crypto' && selectedNetworks.length > 0 ? selectedNetworks : undefined,
    };

    const updated = [...currencies, currency];
    saveCurrencies(updated);
    setShowAddModal(false);
    resetNewCurrency();
  };

  const handleDeleteCurrency = (id: string) => {
    if (!currencies.find(c => c.id === id)?.isCustom) {
      toast.error('Можно удалять только пользовательские валюты');
      return;
    }

    if (confirm('Вы уверены, что хотите удалить эту валюту?')) {
      const updated = currencies.filter(c => c.id !== id);
      saveCurrencies(updated);
    }
  };

  const resetNewCurrency = () => {
    setNewCurrency({
      type: 'custom',
      isActive: true,
      decimals: 2,
      minAmount: 0,
      maxAmount: 1000000,
      reserve: 0,
      icon: '💱',
      isCustom: true,
    });
    // Reset crypto-related state
    setSelectedCoin(null);
    setCoinDetails(null);
    setSelectedNetworks([]);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCurrency({ ...newCurrency, iconUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredCurrencies = currencies.filter((c) => {
    // Filter by type
    const matchesType = filterType === 'all' || c.type === filterType;
    
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const getCurrencyTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      crypto: t('admin.currencies.modal.cryptocurrency'),
      ewallet: t('admin.currencies.modal.ewallet'),
      card: t('admin.currencies.modal.bankCard'),
      cash: t('admin.currencies.modal.cash'),
      custom: t('admin.currencies.modal.custom'),
    };
    return labels[type] || type;
  };

  const getCurrencyTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      crypto: 'blue',
      ewallet: 'purple',
      card: 'green',
      cash: 'orange',
      custom: 'cyan',
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('admin.currencies.title')}</h1>
          <p className="text-dark-600 dark:text-dark-400">
            {t('admin.currencies.subtitle')}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> {t('admin.currencies.addNew')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('admin.common.buttons.search')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder={t('admin.currencies.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{t('admin.currencies.filters.type')}:</span>
            {['all', 'crypto', 'ewallet', 'card', 'cash', 'custom'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-sm transition ${
                  filterType === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600'
                }`}
              >
                {type === 'all' ? t('admin.currencies.filters.allTypes') : 
                 type === 'crypto' ? t('admin.currencies.filters.crypto') :
                 type === 'ewallet' ? t('admin.currencies.filters.ewallet') :
                 type === 'card' ? t('admin.currencies.filters.card') :
                 type === 'cash' ? t('admin.currencies.filters.cash') :
                 type === 'custom' ? t('admin.currencies.filters.custom') : type}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Currencies List */}
      <div className="space-y-4">
        {filteredCurrencies.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-dark-500">
                {searchQuery || filterType !== 'all' 
                  ? t('admin.common.messages.noData')
                  : t('admin.common.messages.noData')
                }
              </p>
            </div>
          </Card>
        ) : (
          <>
            {searchQuery && (
              <div className="text-sm text-dark-600 dark:text-dark-400">
                {t('admin.currencies.found')} {filteredCurrencies.length} {t('admin.currencies.currencies')}
              </div>
            )}
            {filteredCurrencies.map((currency) => {
          const isEditing = editingId === currency.id;
          const form = isEditing ? editForm : currency;

          return (
            <Card key={currency.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CurrencyIcon currency={currency} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {currency.name} ({currency.code})
                        </h3>
                        <Badge variant={getCurrencyTypeColor(currency.type) as any}>
                          {getCurrencyTypeLabel(currency.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-dark-500">{currency.nameEn}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-dark-600 dark:text-dark-400">
                        {t('admin.common.labels.active')}:
                      </span>
                      <Toggle
                        checked={currency.isActive}
                        onChange={() => handleToggleActive(currency.id)}
                        disabled={isEditing}
                      />
                    </div>
                    
                    {!isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(currency)}
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" /> {t('admin.common.buttons.edit')}
                        </Button>
                        {currency.isCustom && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCurrency(currency.id)}
                            className="gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" /> {t('admin.common.buttons.delete')}
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" /> {t('admin.common.buttons.save')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" /> {t('admin.common.buttons.cancel')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dark-200 dark:border-dark-700">
                  <div>
                    <label className="block text-xs text-dark-500 mb-1">
                      {t('admin.currencies.fields.minAmount')}
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={form.minAmount || 0}
                        onChange={(e) =>
                          handleUpdateField('minAmount', parseFloat(e.target.value))
                        }
                        className="text-sm"
                      />
                    ) : (
                      <p className="font-medium">{currency.minAmount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">
                      {t('admin.currencies.fields.maxAmount')}
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={form.maxAmount || 0}
                        onChange={(e) =>
                          handleUpdateField('maxAmount', parseFloat(e.target.value))
                        }
                        className="text-sm"
                      />
                    ) : (
                      <p className="font-medium">{currency.maxAmount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">
                      {t('admin.currencies.fields.reserve')}
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={form.reserve || 0}
                        onChange={(e) =>
                          handleUpdateField('reserve', parseFloat(e.target.value))
                        }
                        className="text-sm"
                      />
                    ) : (
                      <p className="font-medium">{currency.reserve}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">
                      {t('admin.currencies.fields.symbol')}
                    </label>
                    {isEditing ? (
                      <Input
                        type="text"
                        value={form.symbol || ''}
                        onChange={(e) => handleUpdateField('symbol', e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <p className="font-medium">{currency.symbol}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-dark-500 mb-1">
                      {t('admin.currencies.fields.decimals')}
                    </label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={form.decimals || 0}
                        onChange={(e) =>
                          handleUpdateField('decimals', parseInt(e.target.value))
                        }
                        className="text-sm"
                      />
                    ) : (
                      <p className="font-medium">{currency.decimals}</p>
                    )}
                  </div>

                  {currency.networks && (
                    <div>
                      <label className="block text-xs text-dark-500 mb-1">
                        {t('admin.currencies.fields.networks')}
                      </label>
                      <p className="font-medium text-sm">
                        {currency.networks.join(', ')}
                      </p>
                    </div>
                  )}

                  {currency.isCustom && (
                    <>
                      <div>
                        <label className="block text-xs text-dark-500 mb-1">
                          {t('admin.currencies.fields.fixedRate')}
                        </label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.0001"
                            value={form.customRate || ''}
                            onChange={(e) =>
                              handleUpdateField('customRate', parseFloat(e.target.value))
                            }
                            placeholder="Не указан"
                            className="text-sm"
                          />
                        ) : (
                          <p className="font-medium">{currency.customRate || 'Не указан'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-dark-500 mb-1">
                          {t('admin.currencies.fields.commission')}
                        </label>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={form.customCommission ? form.customCommission * 100 : ''}
                            onChange={(e) =>
                              handleUpdateField('customCommission', parseFloat(e.target.value) / 100)
                            }
                            placeholder="Использовать общую"
                            className="text-sm"
                          />
                        ) : (
                          <p className="font-medium">
                            {currency.customCommission ? `${(currency.customCommission * 100).toFixed(2)}%` : 'Общая'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Payment Address */}
                <div className="pt-4 border-t border-dark-200 dark:border-dark-700">
                  <label className="block text-xs text-dark-500 mb-2">
                    {t('admin.currencies.fields.paymentAddress')}
                  </label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={form.paymentAddress || ''}
                      onChange={(e) => handleUpdateField('paymentAddress', e.target.value)}
                      placeholder="Введите адрес"
                      className="font-mono text-sm"
                    />
                  ) : (
                    <p className="font-mono text-sm break-all">
                      {currency.paymentAddress || 'Не указан'}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
          </>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            {t('admin.currencies.stats.total')}
          </p>
          <p className="text-2xl font-bold">{currencies.length}</p>
        </Card>

        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            {t('admin.currencies.stats.active')}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {currencies.filter((c) => c.isActive).length}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            {t('admin.currencies.stats.crypto')}
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currencies.filter((c) => c.type === 'crypto').length}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            {t('admin.currencies.stats.inactive')}
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {currencies.filter((c) => !c.isActive).length}
          </p>
        </Card>
      </div>

      {/* Add Currency Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetNewCurrency();
        }}
        title={t('admin.currencies.modal.addTitle')}
      >
        <div className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.currencies.modal.type')}
            </label>
            <select
              className="w-full px-4 py-2.5 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg"
              value={newCurrency.type}
              onChange={(e) => {
                setNewCurrency({ ...newCurrency, type: e.target.value as CurrencyType });
                // Reset crypto-specific state when changing type
                if (e.target.value !== 'crypto') {
                  setSelectedCoin(null);
                  setCoinDetails(null);
                  setSelectedNetworks([]);
                }
              }}
            >
              <option value="custom">{t('admin.currencies.modal.custom')}</option>
              <option value="crypto">{t('admin.currencies.modal.cryptocurrency')}</option>
              <option value="ewallet">{t('admin.currencies.modal.ewallet')}</option>
              <option value="card">{t('admin.currencies.modal.bankCard')}</option>
              <option value="cash">{t('admin.currencies.modal.cash')}</option>
            </select>
          </div>

          {/* Cryptocurrency Selection */}
          {newCurrency.type === 'crypto' && (
            <>
              <CryptoSelect
                coins={availableCoins}
                isLoading={isLoadingCoins}
                onSelect={handleCoinSelect}
                selectedCoin={selectedCoin}
              />

              {/* Auto-populated Info Preview */}
              {coinDetails && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3 text-blue-900 dark:text-blue-100">
                    {t('admin.currencies.modal.autoInfo')}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">{t('admin.currencies.modal.code')}</span>
                      <Badge variant="blue" className="ml-2">{coinDetails.symbol}</Badge>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">{t('admin.currencies.modal.decimalsLabel')}</span>
                      <span className="ml-2 font-medium">{coinDetails.decimals}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-blue-700 dark:text-blue-300">{t('admin.currencies.modal.name')}</span>
                      <span className="ml-2 font-medium">{coinDetails.name} ({coinDetails.nameRu})</span>
                    </div>
                    {coinDetails.currentPrice && (
                      <div className="col-span-2">
                        <span className="text-blue-700 dark:text-blue-300">{t('admin.currencies.modal.currentRate')}</span>
                        <span className="ml-2 font-medium">
                          ${coinDetails.currentPrice.usd.toFixed(2)} / ₽{coinDetails.currentPrice.rub.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Network Selection */}
              {coinDetails && coinDetails.networks.length > 0 && (
                <NetworkSelector
                  availableNetworks={coinDetails.networks}
                  selectedNetworks={selectedNetworks}
                  onChange={setSelectedNetworks}
                />
              )}
            </>
          )}

          {/* Manual Entry Fields (for non-crypto) */}
          {newCurrency.type !== 'crypto' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.currencies.modal.currencyCode')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newCurrency.code || ''}
                    onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                    placeholder="USD, EUR, GBP..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.currencies.fields.symbol')}
                  </label>
                  <Input
                    type="text"
                    value={newCurrency.symbol || ''}
                    onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                    placeholder="$"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.currencies.modal.nameRu')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newCurrency.name || ''}
                    onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                    placeholder="Доллар США"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.currencies.modal.nameEn')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={newCurrency.nameEn || ''}
                    onChange={(e) => setNewCurrency({ ...newCurrency, nameEn: e.target.value })}
                    placeholder="US Dollar"
                  />
                </div>
              </div>

              {/* Icon */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.currencies.modal.iconSymbol')}
                  </label>
                  <Input
                    type="text"
                    value={newCurrency.icon || ''}
                    onChange={(e) => setNewCurrency({ ...newCurrency, icon: e.target.value })}
                    placeholder="$, €, 💱..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.currencies.modal.uploadImage')}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="icon-upload"
                      />
                      <label
                        htmlFor="icon-upload"
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white dark:bg-dark-700 border border-dark-300 dark:border-dark-600 rounded-lg cursor-pointer hover:bg-dark-50 dark:hover:bg-dark-600 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm">{t('admin.currencies.modal.chooseFile')}</span>
                      </label>
                    </div>
                    {newCurrency.iconUrl && (
                      <img src={newCurrency.iconUrl} alt="Icon" className="w-10 h-10 rounded" />
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Common Fields - shown for all types */}
          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.currencies.modal.minAmount')}
              </label>
              <Input
                type="number"
                step="0.01"
                value={newCurrency.minAmount || 0}
                onChange={(e) => setNewCurrency({ ...newCurrency, minAmount: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.currencies.modal.maxAmount')}
              </label>
              <Input
                type="number"
                step="0.01"
                value={newCurrency.maxAmount || 0}
                onChange={(e) => setNewCurrency({ ...newCurrency, maxAmount: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.currencies.modal.reserve')}
              </label>
              <Input
                type="number"
                step="0.01"
                value={newCurrency.reserve || 0}
                onChange={(e) => setNewCurrency({ ...newCurrency, reserve: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Symbol - only for non-crypto (crypto auto-fills this) */}
            {newCurrency.type !== 'crypto' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('admin.currencies.modal.symbolField')}
                </label>
                <Input
                  type="text"
                  value={newCurrency.symbol || ''}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  placeholder="$"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.currencies.modal.decimalsField')}
              </label>
              <Input
                type="number"
                value={newCurrency.decimals || 2}
                onChange={(e) => setNewCurrency({ ...newCurrency, decimals: parseInt(e.target.value) })}
                disabled={newCurrency.type === 'crypto' && isLoadingDetails}
              />
              {newCurrency.type === 'crypto' && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {t('admin.currencies.modal.autoFilled')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.currencies.modal.active')}
              </label>
              <div className="flex items-center h-10">
                <Toggle
                  checked={newCurrency.isActive ?? true}
                  onChange={(checked) => setNewCurrency({ ...newCurrency, isActive: checked })}
                />
              </div>
            </div>
          </div>

          {/* Custom Rate and Commission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.currencies.modal.fixedRate')}
              </label>
              <Input
                type="number"
                step="0.0001"
                value={newCurrency.customRate || ''}
                onChange={(e) => setNewCurrency({ ...newCurrency, customRate: parseFloat(e.target.value) })}
                placeholder={t('admin.currencies.modal.fixedRatePlaceholder')}
              />
              <p className="text-xs text-dark-500 mt-1">
                {t('admin.currencies.modal.fixedRateHint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin.currencies.modal.commissionField')}
              </label>
              <Input
                type="number"
                step="0.01"
                value={newCurrency.customCommission ? newCurrency.customCommission * 100 : ''}
                onChange={(e) => setNewCurrency({ ...newCurrency, customCommission: parseFloat(e.target.value) / 100 })}
                placeholder={t('admin.currencies.modal.commissionPlaceholder')}
              />
              <p className="text-xs text-dark-500 mt-1">
                {t('admin.currencies.modal.commissionHint')}
              </p>
            </div>
          </div>

          {/* Payment Address */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('admin.currencies.modal.paymentAddressField')}
            </label>
            <Input
              type="text"
              value={newCurrency.paymentAddress || ''}
              onChange={(e) => setNewCurrency({ ...newCurrency, paymentAddress: e.target.value })}
              placeholder={t('admin.currencies.modal.paymentAddressPlaceholder')}
              className="font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetNewCurrency();
              }}
            >
              {t('admin.currencies.modal.cancel')}
            </Button>
            <Button onClick={handleAddCurrency} className="gap-2">
              <Plus className="w-4 h-4" /> {t('admin.currencies.modal.add')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
