# Quick Start Guide: Adding Cryptocurrencies via CoinGecko

## Access the Feature

1. **Login to Admin Panel**
   - Navigate to: http://localhost:5174/admin
   - Username: `admin`
   - Password: `admin123`

2. **Open Currency Management**
   - Click on "Управление валютами" in the admin sidebar

3. **Start Adding Cryptocurrency**
   - Click the "Добавить валюту" button in the top-right corner

## Step-by-Step: Add a Cryptocurrency

### Step 1: Select Type
In the modal that opens:
- Find the "Тип" (Type) dropdown
- Select **"Криптовалюта"** (Cryptocurrency)
- Wait 1-2 seconds for the coins list to load

### Step 2: Search and Select Coin
- A searchable dropdown will appear with label "Выберите криптовалюту"
- Click on it to open the dropdown
- Type to search (e.g., "bitcoin", "eth", "doge")
- Click on your desired cryptocurrency from the results

### Step 3: Review Auto-filled Information
After selection, you'll see a blue box showing:
- ✅ Code (e.g., BTC)
- ✅ Names (Russian and English)
- ✅ Current USD and RUB prices
- ✅ Decimal precision
- All this info is automatically populated!

### Step 4: Select Network (if applicable)
For multi-chain cryptocurrencies (like USDT):
- Network selection checkboxes will appear
- Check the networks you want to support:
  - ✅ TRC20 (TRON - low fees)
  - ✅ ERC20 (Ethereum - high fees)
  - ✅ BEP20 (BSC - medium fees)
- You must select at least one network

### Step 5: Enter Business Parameters
Scroll down and fill in:
- **Мин. сумма** (Min Amount): e.g., 100
- **Макс. сумма** (Max Amount): e.g., 500000
- **Резерв** (Reserve): e.g., 1000000

Optional fields:
- **Знаков после запятой** (Decimals): Auto-filled, but can be changed
- **Активна** (Active): Toggle on/off
- **Фиксированный курс** (Fixed Rate): Leave empty to use live rates
- **Комиссия** (Commission %): Leave empty to use global commission
- **Адрес для оплаты/получения** (Payment Address): Your wallet address

### Step 6: Add the Currency
- Click the **"Добавить"** (Add) button at the bottom
- Wait for the success toast: "Изменения сохранены"
- The modal will close automatically
- Your new cryptocurrency appears in the list!

## Example: Adding Dogecoin

1. Click "Добавить валюту"
2. Select type: "Криптовалюта"
3. Search: "doge"
4. Select: "Dogecoin"
5. Auto-filled data appears:
   - Code: DOGE
   - Name: Догикоин
   - Name (EN): Dogecoin
   - Symbol: DOGE
   - Decimals: 8
   - Current price shown
6. Network: DOGE (auto-selected)
7. Enter:
   - Min: 100
   - Max: 500000
   - Reserve: 2000000
8. Click "Добавить"
9. Done! ✅

## Example: Adding USDT (Multi-chain)

1. Click "Добавить валюту"
2. Select type: "Криптовалюта"
3. Search: "tether"
4. Select: "Tether"
5. Auto-filled data appears:
   - Code: USDT
   - Name: Тезер
   - Name (EN): Tether
   - Symbol: USDT
   - Decimals: 6
6. **Select networks** (important!):
   - ✅ Check TRC20
   - ✅ Check ERC20
   - Or select only one if you prefer
7. Enter amounts and reserve
8. Enter payment addresses for each network (optional)
9. Click "Добавить"
10. Done! ✅

## Common Actions

### Search Tips
- Type coin name: "bitcoin", "ethereum"
- Type symbol: "btc", "eth", "doge"
- Type CoinGecko ID: "ripple", "cardano"
- Search is case-insensitive
- Filters in real-time

### Modify Auto-filled Values
You can change auto-filled fields if needed:
- Click in the "Знаков после запятой" field to change decimals
- Auto-filled values serve as smart defaults
- System shows: "Авто-заполнено из CoinGecko (можно изменить)"

### Switch to Manual Entry
If you want to add a custom token not in CoinGecko:
1. Change "Тип" back to "Пользовательская"
2. All manual entry fields will appear
3. Fill everything manually

## Validation & Errors

### Required Fields
- ✅ Cryptocurrency must be selected
- ✅ At least one network (for multi-chain)
- ✅ Min amount < Max amount
- ✅ Decimals between 0-18

### Common Error Messages
| Error | Meaning | Solution |
|-------|---------|----------|
| "Выберите криптовалюту" | No coin selected | Select a coin from dropdown |
| "Выберите хотя бы одну сеть" | No network selected | Check at least one network |
| "Валюта с таким кодом уже существует" | Duplicate code | This coin is already added |
| "Минимальная сумма должна быть меньше максимальной" | Invalid range | Fix min/max values |

## Troubleshooting

### Coins list not loading?
- Check your internet connection
- CoinGecko API might be temporarily unavailable
- Switch to "Пользовательская" type for manual entry

### Icon not showing?
- Some coins may not have icons
- The system handles this gracefully
- Icon is optional, functionality remains intact

### Can't find a coin?
- Try different search terms
- Search by symbol instead of name
- Check if coin exists on CoinGecko
- Use manual entry as fallback

## Tips & Best Practices

### 🎯 Recommended Workflow
1. Add popular coins first (BTC, ETH, USDT)
2. For stablecoins, support multiple networks
3. Set realistic min/max amounts based on coin value
4. Keep reserves updated regularly
5. Enable only cryptocurrencies you can actually support

### 💡 Smart Defaults
The system suggests good defaults for:
- Decimals (based on blockchain standard)
- Networks (most popular pre-selected)
- Symbol (matches coin code)

### ⚠️ Important Notes
- Added cryptocurrencies are saved to localStorage
- Refresh doesn't lose your additions
- Cryptocurrencies appear in the main exchange calculator
- Live rates update automatically (if custom rate not set)
- You can edit added cryptocurrencies later

## Next Steps

After adding cryptocurrencies:
1. ✅ They appear in the currency list
2. ✅ Available in the exchange calculator
3. ✅ Rates update from CoinGecko (or use custom rate)
4. ✅ Users can select them for exchanges
5. ✅ Network-specific payment addresses can be set

## Need Help?

### Documentation
- Full feature documentation: `CRYPTO_FEATURE_SUMMARY.md`
- Test cases: `CRYPTO_SELECTION_TESTS.md`
- Design document: `.qoder/quests/admin-crypto-coin-selection.md`

### Support
- Check browser console for detailed error messages
- All errors are logged for debugging
- Network tab shows API calls to CoinGecko

---

**Last Updated:** November 22, 2025
**Feature Version:** 1.0.0
