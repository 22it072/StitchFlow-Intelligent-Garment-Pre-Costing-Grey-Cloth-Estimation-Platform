/**
 * Weight Formatting Function (String-based, NO division)
 * Normalizes weight to X.XXXX format
 */
export function formatWeight(value, precision = 4) {
  if (value === 0 || value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  const absValue = Math.abs(value);
  let numStr = absValue.toPrecision(precision + 1);
  
  if (numStr.includes('e')) {
    numStr = absValue.toLocaleString('fullwide', { 
      useGrouping: false, 
      maximumFractionDigits: 20 
    });
  }
  
  const digits = numStr.replace(/[^0-9]/g, '');
  
  if (digits.length === 0) return 0;
  
  let firstSigIndex = 0;
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] !== '0') {
      firstSigIndex = i;
      break;
    }
  }
  
  const sigDigits = digits.slice(firstSigIndex);
  
  if (sigDigits.length === 0) return 0;
  
  const firstDigit = sigDigits[0];
  const decimalPart = sigDigits.slice(1, precision + 1).padEnd(precision, '0');
  
  const formattedStr = `${firstDigit}.${decimalPart}`;
  let formatted = parseFloat(formattedStr);
  
  if (value < 0) {
    formatted = -formatted;
  }
  
  return Number(formatted.toFixed(precision));
}

/**
 * Cost Formatting Function (String-based, NO division)
 * Normalizes cost to X.XX format
 */
export function formatCost(value, precision = 2) {
  if (value === 0 || value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  const absValue = Math.abs(value);
  let numStr = absValue.toPrecision(precision + 1);
  
  if (numStr.includes('e')) {
    numStr = absValue.toLocaleString('fullwide', { 
      useGrouping: false, 
      maximumFractionDigits: 20 
    });
  }
  
  const digits = numStr.replace(/[^0-9]/g, '');
  
  if (digits.length === 0) return 0;
  
  let firstSigIndex = 0;
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] !== '0') {
      firstSigIndex = i;
      break;
    }
  }
  
  const sigDigits = digits.slice(firstSigIndex);
  
  if (sigDigits.length === 0) return 0;
  
  const firstDigit = sigDigits[0];
  const decimalPart = sigDigits.slice(1, precision + 1).padEnd(precision, '0');
  
  const formattedStr = `${firstDigit}.${decimalPart}`;
  let formatted = parseFloat(formattedStr);
  
  if (value < 0) {
    formatted = -formatted;
  }
  
  return Number(formatted.toFixed(precision));
}

/**
 * Format currency for display
 */
export function formatCurrency(value, symbol = '₹') {
  if (value === null || value === undefined || isNaN(value)) {
    return `${symbol}0.00`;
  }
  return `${symbol}${value.toFixed(2)}`;
}

/**
 * Format date
 */
export function formatDate(date, format = 'DD/MM/YYYY') {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Format relative time
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay < 7) return `${diffDay} days ago`;
  
  return formatDate(date);
}