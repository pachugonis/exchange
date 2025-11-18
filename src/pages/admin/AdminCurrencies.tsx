import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminStore } from '../../store/adminStore';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Toggle } from '../../components/ui/Toggle';
import { currencies as initialCurrencies } from '../../data/currencies';
import type { Currency } from '../../types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminCurrencies: React.FC = () => {
  const { isAuthenticated } = useAdminStore();
  const [currencies, setCurrencies] = useState<Currency[]>(() => {
    const stored = localStorage.getItem('currencies-data');
    return stored ? JSON.parse(stored) : initialCurrencies;
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Currency>>({});
  const [filterType, setFilterType] = useState<string>('all');

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const saveCurrencies = (newCurrencies: Currency[]) => {
    setCurrencies(newCurrencies);
    localStorage.setItem('currencies-data', JSON.stringify(newCurrencies));
    toast.success('Изменения сохранены');
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

  const filteredCurrencies = currencies.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  const getCurrencyTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      crypto: 'Криптовалюта',
      ewallet: 'Электронный кошелек',
      card: 'Банковская карта',
      cash: 'Наличные',
    };
    return labels[type] || type;
  };

  const getCurrencyTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      crypto: 'blue',
      ewallet: 'purple',
      card: 'green',
      cash: 'orange',
    };
    return colors[type] || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Управление валютами</h1>
          <p className="text-dark-600 dark:text-dark-400">
            Настройка доступных валют для обмена
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Тип:</span>
          {['all', 'crypto', 'ewallet', 'card', 'cash'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                filterType === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600'
              }`}
            >
              {type === 'all' ? 'Все' : getCurrencyTypeLabel(type)}
            </button>
          ))}
        </div>
      </Card>

      {/* Currencies List */}
      <div className="space-y-4">
        {filteredCurrencies.map((currency) => {
          const isEditing = editingId === currency.id;
          const form = isEditing ? editForm : currency;

          return (
            <Card key={currency.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{currency.icon}</span>
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
                        Активна:
                      </span>
                      <Toggle
                        checked={currency.isActive}
                        onChange={() => handleToggleActive(currency.id)}
                        disabled={isEditing}
                      />
                    </div>
                    
                    {!isEditing ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(currency)}
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Редактировать
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" /> Сохранить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" /> Отмена
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dark-200 dark:border-dark-700">
                  <div>
                    <label className="block text-xs text-dark-500 mb-1">
                      Минимальная сумма
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
                      Максимальная сумма
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
                      Резерв
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
                      Символ
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
                      Знаков после запятой
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
                        Сети
                      </label>
                      <p className="font-medium text-sm">
                        {currency.networks.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            Всего валют
          </p>
          <p className="text-2xl font-bold">{currencies.length}</p>
        </Card>

        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            Активных
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {currencies.filter((c) => c.isActive).length}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            Криптовалют
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currencies.filter((c) => c.type === 'crypto').length}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
            Неактивных
          </p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {currencies.filter((c) => !c.isActive).length}
          </p>
        </Card>
      </div>
    </div>
  );
};
