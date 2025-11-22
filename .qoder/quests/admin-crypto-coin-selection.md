# Admin Cryptocurrency Selection Enhancement

## Overview

Enhance the admin currency management interface to provide a streamlined cryptocurrency addition workflow. When adding a new currency with type "Cryptocurrency" in the Custom section, administrators will be presented with a dropdown list of available cryptocurrencies from CoinGecko, automatically populating all relevant metadata including current rates, icons, network information, and display names.

## Business Goals

- Simplify cryptocurrency addition process for administrators
- Ensure accurate and up-to-date cryptocurrency metadata
- Reduce manual data entry errors
- Leverage CoinGecko API for comprehensive cryptocurrency information
- Maintain consistency with existing currency management workflow

## Scope

### In Scope

- CoinGecko API integration for cryptocurrency listing
- Cryptocurrency dropdown selection component when type is "Cryptocurrency"
- Automatic population of cryptocurrency metadata (name, symbol, icon, decimals, networks)
- Real-time rate fetching from CoinGecko API
- Icon URL retrieval from CoinGecko
- Backend proxy endpoint for CoinGecko coins list API
- Caching mechanism for cryptocurrency list to reduce API calls
- Support for selecting multiple network types for multi-chain cryptocurrencies
- Validation to prevent duplicate cryptocurrency additions

### Out of Scope

- Historical price data or charting
- Automated price updates for already added currencies (existing mechanism handles this)
- Support for NFTs or other non-fungible tokens
- Custom cryptocurrency creation (manual fields remain available for non-CoinGecko coins)
- Cryptocurrency wallet integration
- Trading pair recommendations

## User Flow

### Current Behavior

When an administrator adds a new currency in the Custom section:

1. Administrator clicks "Add Currency" button
2. Modal opens with manual input fields
3. Administrator selects type from dropdown (Custom, Cryptocurrency, E-wallet, Bank Card, Cash)
4. Administrator manually enters: code, name (RU), name (EN), icon, min/max amounts, reserve, symbol, decimals, rate, commission, payment address
5. Administrator clicks "Add" to create the currency

### Proposed Behavior

When an administrator selects "Cryptocurrency" as the type:

1. Administrator clicks "Add Currency" button
2. Modal opens with initial fields visible
3. Administrator selects "Cryptocurrency" from the type dropdown
4. Interface transforms to show cryptocurrency selection mode:
   - A searchable dropdown appears labeled "Select Cryptocurrency"
   - The dropdown displays popular cryptocurrencies with their icons, names, and symbols
   - Search functionality filters the list in real-time
   - Loading indicator shown while fetching CoinGecko coin list
5. Administrator selects a cryptocurrency from the dropdown
6. System automatically populates the following fields:
   - Code (e.g., BTC, ETH, DOGE)
   - Name in Russian (using transliteration or mapped values)
   - Name in English (from CoinGecko)
   - Symbol (from CoinGecko)
   - Icon URL (from CoinGecko image API)
   - Decimals (from CoinGecko platform data)
   - Current rate in USD and RUB (from existing rate API)
7. If cryptocurrency supports multiple networks, a network selection field appears
8. Administrator can still modify auto-populated fields if needed
9. Administrator manually enters: min/max amounts, reserve, payment address, custom commission
10. Administrator clicks "Add" to create the currency

## Data Requirements

### CoinGecko API Integration

#### Coins List Endpoint

Backend proxy endpoint should fetch from:
- Endpoint: `GET /api/crypto/coins/list`
- Proxies to: `https://api.coingecko.com/api/v3/coins/list?include_platform=true`
- Response format:

| Field | Type | Description |
|-------|------|-------------|
| id | string | CoinGecko unique identifier (e.g., "bitcoin") |
| symbol | string | Cryptocurrency symbol (e.g., "btc") |
| name | string | Full cryptocurrency name (e.g., "Bitcoin") |
| platforms | object | Supported blockchain platforms and contract addresses |

#### Coin Details Endpoint

Backend proxy endpoint for detailed coin information:
- Endpoint: `GET /api/crypto/coins/:coinId`
- Proxies to: `https://api.coingecko.com/api/v3/coins/:coinId?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
- Response includes:
  - Image URLs (thumb, small, large)
  - Detailed description
  - Market data (current price, market cap)
  - Platform-specific contract addresses
  - Decimal precision

#### Rate Information

Utilize existing `fetchCryptoRates()` function from `cryptoAPI.ts` to get current USD and RUB rates after cryptocurrency selection.

### Data Mapping

#### Cryptocurrency Metadata Mapping

| UI Field | Data Source | Mapping Logic |
|----------|-------------|---------------|
| Code | CoinGecko symbol | Uppercase transformation (btc → BTC) |
| Name (RU) | Predefined mapping or transliteration | Fallback to English name if no Russian translation |
| Name (EN) | CoinGecko name | Direct mapping |
| Symbol | CoinGecko symbol | Uppercase for display |
| Icon URL | CoinGecko image.large | Store full URL for rendering |
| Decimals | CoinGecko detail_platforms or default | Use platform-specific decimals or standard defaults (8 for BTC-like, 18 for ETH-like) |
| Networks | CoinGecko platforms | Map platform keys to network types |

#### Network Type Mapping

| CoinGecko Platform | Internal Network Type |
|--------------------|----------------------|
| ethereum | ERC20 |
| tron | TRC20 |
| binance-smart-chain | BEP20 |
| bitcoin | BTC |
| solana | Solana |
| ripple | XRP |
| litecoin | LTC |
| dogecoin | DOGE |
| monero | XMR |
| sui | Sui |

#### Russian Name Translations

Predefined mapping for popular cryptocurrencies:

| English Name | Russian Name |
|--------------|--------------|
| Bitcoin | Биткоин |
| Ethereum | Эфириум |
| Tether | Тезер |
| USD Coin | USD Коин |
| Binance Coin | BNB |
| Ripple | Риппл |
| Cardano | Кардано |
| Dogecoin | Догикоин |
| Solana | Солана |
| Polkadot | Полкадот |
| (Others) | Transliteration or English fallback |

### Caching Strategy

To minimize API calls and improve performance:

- Cache CoinGecko coins list in memory for 24 hours
- Cache individual coin details for 1 hour
- Store cache timestamps to validate freshness
- Implement error fallback to cached data if API is unavailable
- Respect CoinGecko rate limits (50 calls/minute for free tier)

## Technical Architecture

### Component Structure

The admin currency modal will be enhanced with conditional rendering:

```
AdminCurrencies Component
├── Add Currency Modal
│   ├── Currency Type Selector
│   │   └── onChange triggers conditional field rendering
│   ├── Conditional Field Group: Manual Entry (type !== 'crypto')
│   │   ├── Code Input
│   │   ├── Name Inputs (RU/EN)
│   │   ├── Icon Input/Upload
│   │   └── Symbol Input
│   ├── Conditional Field Group: Crypto Selection (type === 'crypto')
│   │   ├── Cryptocurrency Dropdown (searchable)
│   │   │   ├── Loading State
│   │   │   ├── Search Input
│   │   │   ├── Option List with Icons
│   │   │   └── Selection Handler
│   │   ├── Auto-populated Preview (read-only display)
│   │   │   ├── Code Badge
│   │   │   ├── Name Display
│   │   │   ├── Current Rate Display
│   │   │   └── Icon Preview
│   │   └── Network Selection (if multiple available)
│   ├── Common Fields (always visible)
│   │   ├── Min/Max Amount Inputs
│   │   ├── Reserve Input
│   │   ├── Decimals Input (editable after auto-fill)
│   │   ├── Payment Address Input
│   │   ├── Custom Rate Input
│   │   └── Custom Commission Input
│   └── Action Buttons
│       ├── Cancel
│       └── Add Currency
```

### API Layer

#### Backend Endpoints

Create new backend proxy endpoints to interact with CoinGecko:

| Endpoint | Method | Purpose | CoinGecko Source |
|----------|--------|---------|------------------|
| `/api/crypto/coins/list` | GET | Retrieve all available cryptocurrencies | `/api/v3/coins/list` |
| `/api/crypto/coins/:coinId` | GET | Get detailed coin information | `/api/v3/coins/:coinId` |
| `/api/crypto/coins/:coinId/image` | GET | Retrieve coin icon URL | Extract from coin details |

#### Request/Response Contracts

**Get Coins List**

Request:
- No parameters required
- Optional query: `?search={term}` for server-side filtering

Response structure:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| coins | array | See below | List of cryptocurrency objects |
| cached | boolean | true | Indicates if response is from cache |
| timestamp | number | 1709123456789 | Response generation timestamp |

Coin object structure:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| id | string | "bitcoin" | CoinGecko identifier |
| symbol | string | "BTC" | Uppercase symbol |
| name | string | "Bitcoin" | Display name |
| iconUrl | string | "https://..." | Icon image URL |
| platforms | array | ["BTC"] | Supported networks |

**Get Coin Details**

Request:
- Path parameter: `coinId` (CoinGecko ID)

Response structure:

| Field | Type | Description |
|-------|------|-------------|
| id | string | CoinGecko identifier |
| symbol | string | Cryptocurrency symbol |
| name | string | Full name |
| nameRu | string | Russian name (if available) |
| iconUrl | string | Large icon URL |
| decimals | number | Decimal precision |
| currentPrice | object | { usd: number, rub: number } |
| platforms | array | Available blockchain platforms |
| networks | array | Mapped internal network types |

### State Management

The `newCurrency` state in AdminCurrencies component should be extended:

| State Property | Type | Purpose |
|---------------|------|---------|
| coinGeckoId | string \| undefined | Selected CoinGecko coin ID |
| isLoadingCoins | boolean | Loading state for coin list |
| availableCoins | array | Cached list of cryptocurrencies |
| selectedCoinDetails | object \| null | Detailed info of selected coin |
| selectedNetworks | array | User-selected networks for multi-chain coins |

### Validation Rules

Before allowing currency addition:

| Validation Rule | Error Message |
|----------------|---------------|
| Code must be unique | "Валюта с таким кодом уже существует" |
| Required fields populated | "Заполните все обязательные поля" |
| At least one network selected (for multi-chain) | "Выберите хотя бы одну сеть" |
| Min amount < Max amount | "Минимальная сумма должна быть меньше максимальной" |
| Decimals between 0-18 | "Количество знаков после запятой должно быть от 0 до 18" |
| CoinGecko rate successfully fetched | "Не удалось загрузить курс валюты" |

## UI/UX Specifications

### Cryptocurrency Dropdown Component

**Visual Design:**
- Searchable dropdown with auto-complete
- Each option displays:
  - Coin icon (24x24px) on the left
  - Coin name in bold
  - Symbol in parentheses (lighter color)
  - Supported networks as small badges on the right
- Maximum visible options: 10 (scrollable)
- Empty state: "Начните вводить название криптовалюты..."
- Loading state: Spinner with text "Загрузка списка криптовалют..."
- Error state: "Не удалось загрузить список. Попробуйте позже."

**Interaction States:**

| State | Visual Feedback |
|-------|----------------|
| Default | Placeholder text visible |
| Focus | Border highlight, dropdown expands |
| Typing | Real-time filtering, results update |
| Loading | Spinner visible, options disabled |
| Selected | Coin icon and name displayed in input field |
| Error | Red border, error message below |

### Auto-populated Fields Display

After cryptocurrency selection, show a preview section:

- Section title: "Автоматически загруженная информация"
- Display format: Read-only cards or disabled inputs with values
- Visual indicator: Light blue/green background to indicate auto-fill
- Override option: Small "Edit" icon to allow manual modification
- Rate display: Show both USD and RUB rates with timestamp

### Network Selection (Multi-chain Coins)

When selected cryptocurrency supports multiple networks:

- Section title: "Выберите сеть (можно несколько)"
- Display: Checkbox group or multi-select dropdown
- Each network shows:
  - Network name
  - Contract address preview (if available)
  - Gas fee indicator (Low/Medium/High)
- Default selection: Most popular network pre-selected
- Validation: At least one network must be selected

## Error Handling

### API Failure Scenarios

| Scenario | User Experience | Fallback Behavior |
|----------|----------------|-------------------|
| CoinGecko API unavailable | Show error toast: "Сервис временно недоступен. Попробуйте позже или добавьте валюту вручную." | Allow switching to manual entry mode |
| Coin list fetch timeout | Display cached list with warning: "Отображается сохраненный список" | Use stale cache data (up to 7 days old) |
| Coin details fetch failure | Show error: "Не удалось загрузить данные для этой криптовалюты" | Allow manual entry with partial data |
| Rate fetch failure | Warning: "Курс не загружен. Установите фиксированный курс вручную." | Require manual rate entry in customRate field |
| Network timeout | Retry automatically after 3 seconds, show retry counter | Maximum 3 retries before showing error |

### Data Validation Failures

| Validation Error | User Feedback | Resolution Path |
|-----------------|---------------|-----------------|
| Duplicate code | Error toast + red border on code field | User must modify code or cancel |
| Missing required fields | Highlight empty fields in red with label | User must fill all required fields |
| Invalid rate data | Show warning banner at top of modal | User must set custom rate manually |
| Network selection missing | Error message below network selector | User must select at least one network |

## Integration Points

### Existing Systems

The feature integrates with:

| System Component | Integration Type | Data Flow |
|-----------------|------------------|-----------|
| Admin Store (adminStore.ts) | State persistence | Save cryptocurrency metadata to localStorage |
| Currency Store (currencies-data) | Data merging | Merge new crypto with existing currencies |
| Crypto API (cryptoAPI.ts) | Rate fetching | Retrieve current USD/RUB rates |
| Exchange Calculator | Rate display | Use added cryptocurrencies in exchange calculations |
| Currency Icon Component | Rendering | Display CoinGecko icon URLs |

### Backend Proxy Requirements

Per project specifications, all external API calls must go through backend proxy to avoid CORS issues.

**Required Backend Implementation:**

- Create Express.js (or equivalent) proxy routes
- Implement request forwarding to CoinGecko
- Add response caching layer (in-memory or Redis)
- Handle rate limiting (CoinGecko: 50 calls/min)
- Implement error handling and retry logic
- Add request logging for monitoring
- Return standardized response format

**Proxy Configuration:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| Cache Duration (coins list) | 24 hours | List changes infrequently |
| Cache Duration (coin details) | 1 hour | Prices update regularly |
| Request Timeout | 10 seconds | Balance UX and reliability |
| Max Retries | 2 | Prevent excessive external calls |
| Rate Limit Buffer | 40 calls/min | Stay under CoinGecko limit |

## Performance Considerations

### Optimization Strategies

| Area | Strategy | Expected Impact |
|------|----------|----------------|
| Initial Load | Pre-fetch top 100 cryptocurrencies | Reduce perceived latency |
| Search Performance | Client-side filtering with debouncing (300ms) | Smooth user experience |
| Icon Loading | Lazy load coin icons as user scrolls | Faster initial render |
| API Calls | Aggressive caching with stale-while-revalidate | Reduce external dependencies |
| Data Transfer | Gzip compression on proxy responses | Faster data transmission |

### Resource Limits

- Maximum coins in dropdown: 2000 (pagination or virtualization for more)
- Search debounce delay: 300ms
- Icon image cache: 50 MB maximum
- Coins list cache size: 5 MB maximum
- Concurrent API requests: 3 maximum

## Security Considerations

### Data Validation

- Sanitize all user inputs before storage
- Validate icon URLs to prevent XSS attacks (only allow image content types)
- Limit input field lengths to prevent overflow attacks
- Validate numeric fields for reasonable ranges

### API Security

- Implement rate limiting on proxy endpoints
- Use API key rotation for CoinGecko (if using paid tier)
- Validate response data structure before processing
- Implement request logging for audit trail
- Add CORS restrictions on backend proxy

### Data Privacy

- Do not log sensitive payment addresses in plain text
- Encrypt localStorage data if containing sensitive info
- Implement admin session timeout (existing mechanism)
- Validate admin authentication before API access

## Testing Requirements

### Functional Testing Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Select popular cryptocurrency | Open modal → Select "Cryptocurrency" → Choose "Bitcoin" | All fields auto-populated with BTC data |
| Search for cryptocurrency | Type "doge" in search | Dogecoin appears in filtered results |
| Select multi-chain coin | Choose USDT → Select networks | Network checkboxes appear with TRC20, ERC20 options |
| API failure handling | Simulate CoinGecko unavailability | Error message shown, manual entry option available |
| Duplicate prevention | Add Bitcoin when BTC exists | Error toast: "Валюта с таким кодом уже существует" |
| Rate fetching | Select any crypto | Current USD and RUB rates displayed |
| Manual override | Auto-fill then modify decimals | Modified value saved instead of auto-filled value |
| Network selection validation | Select crypto, deselect all networks | Error: "Выберите хотя бы одну сеть" |

### Edge Cases

| Edge Case | Handling Strategy |
|-----------|------------------|
| Cryptocurrency with no icon | Use default cryptocurrency icon placeholder |
| Cryptocurrency not in rate API | Allow manual rate entry, show warning |
| Very long cryptocurrency name | Truncate with ellipsis in dropdown, show full in details |
| Network with unknown platform type | Show platform name as-is, allow manual configuration |
| Slow network connection | Show loading state, implement timeout after 15 seconds |
| Concurrent admin additions | Use timestamp-based ID to prevent conflicts |

### Performance Testing

- Dropdown should render within 500ms with 100+ coins
- Search filtering should complete within 100ms
- Rate fetching should complete within 2 seconds
- Icon loading should not block modal interaction
- Cache retrieval should be instantaneous (< 50ms)

## Future Enhancements

Potential improvements for later iterations:

- Automatic rate refresh for added cryptocurrencies (hourly/daily)
- Bulk cryptocurrency import from predefined list
- Cryptocurrency price alerts for administrators
- Historical rate charts in currency detail view
- Network fee estimation display
- Popular cryptocurrency suggestions based on trading volume
- Integration with multiple price sources (not just CoinGecko)
- Smart defaults for min/max amounts based on coin volatility
- Community-driven Russian name translations
- Cryptocurrency market cap and volume display

## Success Metrics

Measure feature success by:

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Cryptocurrency addition time | < 30 seconds (vs 2+ minutes manual) | User interaction tracking |
| Data accuracy rate | > 95% (correct metadata) | Manual verification sample |
| API error rate | < 5% of requests | Backend logging |
| Admin adoption rate | > 80% use dropdown vs manual | Feature usage analytics |
| Duplicate entry reduction | > 90% decrease | Error log analysis |

## Rollout Plan

### Phase 1: Backend Infrastructure
- Implement CoinGecko proxy endpoints
- Set up caching mechanism
- Deploy and test backend services
- Monitor API rate limits and performance

### Phase 2: Frontend Development
- Create cryptocurrency dropdown component
- Implement search and filter functionality
- Build auto-population logic
- Add network selection for multi-chain coins

### Phase 3: Integration
- Connect frontend to backend proxy
- Integrate with existing currency management
- Implement error handling and fallbacks
- Add loading and empty states

### Phase 4: Testing & Validation
- Conduct functional testing
- Perform user acceptance testing with admin users
- Load testing on proxy endpoints
- Security audit of API integration

### Phase 5: Deployment
- Deploy to staging environment
- Perform final validation
- Deploy to production during low-traffic period
- Monitor for errors and performance issues

### Phase 6: Monitoring & Iteration
- Track success metrics
- Gather admin user feedback
- Address bugs and edge cases
- Plan future enhancements based on usage patterns
