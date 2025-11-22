# Testing Cryptocurrency Selection Feature

## Test Setup
1. Start the development server: `npm run dev`
2. Navigate to: http://localhost:5174/admin
3. Login with credentials: username: `admin`, password: `admin123`
4. Navigate to "Управление валютами" (Currency Management)

## Test Cases

### Test Case 1: Open Add Currency Modal with Crypto Type
**Steps:**
1. Click "Добавить валюту" (Add Currency) button
2. Select "Криптовалюта" (Cryptocurrency) from the type dropdown
3. Verify CoinGecko coins list starts loading

**Expected Results:**
- Modal opens successfully
- Type dropdown shows "Криптовалюта" selected
- Cryptocurrency selection dropdown appears
- Loading spinner shows while fetching coins list
- After loading, searchable dropdown shows cryptocurrency options

### Test Case 2: Search and Select Bitcoin
**Steps:**
1. In the crypto selection dropdown, type "bitcoin" in the search field
2. Click on "Bitcoin" from the filtered results

**Expected Results:**
- Search filters the list to show Bitcoin
- Upon selection:
  - Code auto-fills with "BTC"
  - Russian name auto-fills with "Биткоин"
  - English name auto-fills with "Bitcoin"
  - Symbol auto-fills with "BTC"
  - Decimals auto-fills with 8
  - Icon URL is fetched from CoinGecko
  - Current USD and RUB rates are displayed
  - Auto-populated info preview section appears with blue background

### Test Case 3: Multi-chain Cryptocurrency (USDT)
**Steps:**
1. Open add currency modal
2. Select "Криптовалюта" type
3. Search and select "Tether" (USDT)

**Expected Results:**
- All fields auto-populate
- Network selector appears showing:
  - TRC20 (TRON сеть - низкие комиссии)
  - ERC20 (Ethereum сеть - высокие комиссии)
- At least one network must be selected
- TRC20 is pre-selected by default

### Test Case 4: Network Selection Validation
**Steps:**
1. Select USDT cryptocurrency
2. Deselect all networks
3. Try to add the currency

**Expected Results:**
- Error message appears: "Выберите хотя бы одну сеть"
- Currency is not added
- Modal remains open

### Test Case 5: Duplicate Currency Prevention
**Steps:**
1. Try to add Bitcoin when BTC already exists in the list

**Expected Results:**
- Error toast appears: "Валюта с таким кодом уже существует"
- Currency is not added

### Test Case 6: Manual Override of Auto-filled Decimals
**Steps:**
1. Select any cryptocurrency
2. Wait for auto-population
3. Change the decimals field manually
4. Complete adding the currency

**Expected Results:**
- Decimals field is editable even after auto-fill
- Manual value is saved instead of auto-filled value
- Helper text shows "Авто-заполнено из CoinGecko (можно изменить)"

### Test Case 7: Switch from Crypto to Manual Type
**Steps:**
1. Select "Криптовалюта" type
2. Select a coin
3. Change type to "Пользовательская"

**Expected Results:**
- Crypto selection UI disappears
- Manual entry fields appear
- Previously auto-filled values are cleared
- Standard manual entry workflow is available

### Test Case 8: API Failure Handling
**Steps:**
1. Disconnect internet or block CoinGecko API
2. Open add currency modal
3. Select "Криптовалюта" type

**Expected Results:**
- Loading indicator appears
- After timeout, error toast shows: "Не удалось загрузить список криптовалют. Попробуйте позже."
- User can switch to manual entry mode

### Test Case 9: Complete Currency Addition Flow
**Steps:**
1. Select "Криптовалюта" type
2. Select "Dogecoin"
3. Verify auto-populated fields
4. Enter min amount: 100
5. Enter max amount: 500000
6. Enter reserve: 2000000
7. Click "Добавить" (Add)

**Expected Results:**
- Currency is added successfully
- Toast message: "Изменения сохранены"
- Modal closes
- New currency appears in the list with:
  - Code: DOGE
  - Name: Догикоин
  - Type badge: Криптовалюта (blue)
  - Icon from CoinGecko
  - All entered values preserved

### Test Case 10: Validation - Min/Max Amount
**Steps:**
1. Select any cryptocurrency
2. Enter min amount: 1000
3. Enter max amount: 500
4. Try to add

**Expected Results:**
- Error toast: "Минимальная сумма должна быть меньше максимальной"
- Currency is not added

### Test Case 11: Validation - Decimals Range
**Steps:**
1. Select any cryptocurrency
2. Change decimals to 25
3. Try to add

**Expected Results:**
- Error toast: "Количество знаков после запятой должно быть от 0 до 18"
- Currency is not added

## Performance Tests

### Test Case 12: Dropdown Performance
**Steps:**
1. Open cryptocurrency selector
2. Measure time to display coins list

**Expected Results:**
- List renders within 500ms with 100+ coins
- Dropdown is scrollable
- No UI lag or freeze

### Test Case 13: Search Performance
**Steps:**
1. Type rapidly in the search field
2. Observe filtering speed

**Expected Results:**
- Search filters results in real-time
- No noticeable delay (< 100ms)
- Results update smoothly

## Edge Cases

### Test Case 14: Cryptocurrency with No Icon
**Steps:**
1. Select a lesser-known cryptocurrency without icon

**Expected Results:**
- Icon URL fails gracefully
- Default crypto icon or no icon is shown
- Other fields populate correctly

### Test Case 15: Very Long Cryptocurrency Name
**Steps:**
1. Search for "Internet Computer"
2. Select it

**Expected Results:**
- Full name is displayed in the preview
- Name truncates with ellipsis in dropdown if too long
- All data saves correctly

## Regression Tests

### Test Case 16: Non-Crypto Currency Still Works
**Steps:**
1. Select type "Пользовательская"
2. Manually enter all fields
3. Add currency

**Expected Results:**
- Manual entry workflow unchanged
- No crypto-related fields appear
- Currency adds successfully

### Test Case 17: Edit Existing Currency
**Steps:**
1. Click "Редактировать" on existing currency
2. Modify fields
3. Save

**Expected Results:**
- Edit functionality works as before
- No regression in existing features

## Manual Verification Checklist

- [ ] CoinGecko API calls are made through proper endpoints
- [ ] Caching works (second open doesn't re-fetch)
- [ ] Icon URLs load correctly
- [ ] Russian translations appear for popular coins
- [ ] Network selection saves to localStorage
- [ ] All validations work correctly
- [ ] Error messages are in Russian
- [ ] Dark mode styling looks correct
- [ ] Mobile responsive layout works
- [ ] No console errors appear
- [ ] Currency persists after page refresh
- [ ] Added crypto currencies appear in exchange calculator
- [ ] Exchange rates fetch correctly for added cryptos

## Notes
- Test on both light and dark themes
- Test on different screen sizes
- Monitor browser console for errors
- Check network tab for API calls
- Verify localStorage updates correctly
