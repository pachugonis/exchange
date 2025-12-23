/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    return false;
  }
}

/**
 * Simulate API delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get theme from localStorage or system preference
 */
export function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light'; // Default to light
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: 'dark' | 'light'): void {
  if (typeof document === 'undefined') return;
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  localStorage.setItem('theme', theme);
}

/**
 * Calculate exchange with commission
 */
export function calculateExchange(
  amount: number,
  rate: number,
  commission: number
): { total: number; commissionAmount: number } {
  const baseAmount = amount * rate;
  const commissionAmount = baseAmount * commission;
  const total = baseAmount - commissionAmount;
  
  return { total, commissionAmount };
}
