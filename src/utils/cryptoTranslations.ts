/**
 * Russian translations for popular cryptocurrencies
 * Fallback to English name if translation not available
 */

const CRYPTO_RUSSIAN_NAMES: Record<string, string> = {
  // Popular cryptocurrencies
  'Bitcoin': 'Биткоин',
  'Ethereum': 'Эфириум',
  'Tether': 'Тезер',
  'USD Coin': 'USD Коин',
  'BNB': 'BNB',
  'Binance Coin': 'BNB',
  'XRP': 'Риппл',
  'Ripple': 'Риппл',
  'Cardano': 'Кардано',
  'Dogecoin': 'Догикоин',
  'Solana': 'Солана',
  'Polkadot': 'Полкадот',
  'Polygon': 'Полигон',
  'TRON': 'ТРОН',
  'Litecoin': 'Лайткоин',
  'Shiba Inu': 'Шиба Ину',
  'Avalanche': 'Аваланч',
  'Chainlink': 'Чейнлинк',
  'Monero': 'Монеро',
  'Stellar': 'Стеллар',
  'Cosmos': 'Космос',
  'Ethereum Classic': 'Эфириум Классик',
  'VeChain': 'ВиЧейн',
  'Filecoin': 'Файлкоин',
  'Hedera': 'Хедера',
  'Internet Computer': 'Интернет Компьютер',
  'Aptos': 'Аптос',
  'Arbitrum': 'Арбитрум',
  'Optimism': 'Оптимизм',
  'Near Protocol': 'Ниар Протокол',
  'Sui': 'Суи',
  'Uniswap': 'Юнисвап',
  'Wrapped Bitcoin': 'Обернутый Биткоин',
  'Dai': 'Дай',
  'Lido DAO': 'Лидо DAO',
  'Aave': 'Ааве',
  'Bitcoin Cash': 'Биткоин Кэш',
  'Maker': 'Мейкер',
  'Synthetix': 'Синтетикс',
  'Curve DAO Token': 'Токен Curve DAO',
  'Compound': 'Компаунд',
  'Pancakeswap': 'Панкейксвап',
  'Decentraland': 'Децентраленд',
  'The Sandbox': 'Зе Сэндбокс',
  'Axie Infinity': 'Акси Инфинити',
  'ApeCoin': 'ЭйпКоин',
  'Zcash': 'Зикеш',
  'Dash': 'Даш',
  'NEO': 'Нео',
  'EOS': 'EOS',
  'IOTA': 'IOTA',
  'Tezos': 'Тезос',
  'Theta Network': 'Тета Нетворк',
  'Elrond': 'Элронд',
  'Algorand': 'Алгоранд',
};

/**
 * Get Russian translation for cryptocurrency name
 * @param englishName - English name of the cryptocurrency
 * @returns Russian translation or original name if not found
 */
export function getCryptoRussianName(englishName: string): string {
  return CRYPTO_RUSSIAN_NAMES[englishName] || englishName;
}

/**
 * Simple transliteration function for fallback
 * Converts Latin characters to Cyrillic approximation
 */
export function transliterateToCyrillic(text: string): string {
  const translitMap: Record<string, string> = {
    'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д',
    'e': 'е', 'yo': 'ё', 'zh': 'ж', 'z': 'з', 'i': 'и',
    'j': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н',
    'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 't': 'т',
    'u': 'у', 'f': 'ф', 'h': 'х', 'ts': 'ц', 'ch': 'ч',
    'sh': 'ш', 'shch': 'щ', 'y': 'ы', 'yu': 'ю', 'ya': 'я',
  };

  let result = text.toLowerCase();
  
  // Replace longer patterns first
  Object.entries(translitMap)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([latin, cyrillic]) => {
      result = result.replace(new RegExp(latin, 'g'), cyrillic);
    });

  // Capitalize first letter if original was capitalized
  if (text[0] === text[0].toUpperCase()) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

/**
 * Get cryptocurrency name with Russian translation preference
 * Falls back to transliteration if no direct translation available
 */
export function getCryptoDisplayName(englishName: string, preferTransliteration = false): string {
  const directTranslation = CRYPTO_RUSSIAN_NAMES[englishName];
  
  if (directTranslation) {
    return directTranslation;
  }
  
  if (preferTransliteration) {
    return transliterateToCyrillic(englishName);
  }
  
  return englishName;
}
