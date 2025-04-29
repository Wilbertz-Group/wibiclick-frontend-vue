import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Formats a currency value with ZAR currency symbol
 * @param {number|null} value - The value to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(Number(value))) return 'N/A';

  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    // Fallback to basic formatting on error
    return `R ${Number(value).toFixed(2)}`;
  }
};

/**
 * Formats a date as "Month Day, Year"
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatFullDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'MMMM d, yyyy');
  } catch (error) {
    return '';
  }
};

/**
 * Formats a date as a relative time string (e.g., "2 days ago")
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (error) {
    return '';
  }
};

/**
 * Formats a date string as "MMM d, yyyy, h:mm a"
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatAbsoluteDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'MMM d, yyyy, h:mm a');
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Returns CSS class for profit display based on value
 * @param {number|null} value - Profit value
 * @returns {string} CSS class string
 */
export const getProfitClass = (value) => {
  if (value === null || value === undefined) return 'text-gray-500';
  return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
};

/**
 * Returns CSS class for sentiment display based on sentiment value
 * @param {string|null} sentiment - Sentiment value
 * @returns {string} CSS class string
 */
export const getSentimentClass = (sentiment) => {
  if (!sentiment) return 'text-gray-500 dark:text-gray-400'; // Default/unknown
  const lowerSentiment = sentiment.toLowerCase();
  if (lowerSentiment === 'positive') return 'text-green-600 dark:text-green-400';
  if (lowerSentiment === 'negative') return 'text-red-600 dark:text-red-400';
  if (lowerSentiment === 'neutral') return 'text-yellow-600 dark:text-yellow-400';
  return 'text-gray-500 dark:text-gray-400'; // Fallback
};

/**
 * Helper to safely parse JSON
 * @param {string} jsonString - JSON string to parse
 * @returns {object|null} Parsed object or null if invalid
 */
export const tryParseJson = (jsonString) => {
  try {
    const obj = JSON.parse(jsonString);
    if (obj && typeof obj === 'object') {
      return obj;
    }
  } catch (e) {
    // Ignore parsing error
  }
  return null;
};

/**
 * Formats a date based on a specific period type (daily, weekly, monthly)
 * @param {string} date - Date to format
 * @param {string} periodType - Type of period (daily, weekly, monthly)
 * @returns {string} Formatted date string
 */
export const formatDateByPeriod = (date, periodType) => {
  if (!date) return '';
  try {
    const dateObj = new Date(date);
    switch (periodType) {
      case 'weekly':
        return format(dateObj, "'Week of' MMM d, yyyy");
      case 'monthly':
        return format(dateObj, 'MMMM yyyy');
      default: // daily
        return format(dateObj, 'MMM d, yyyy');
    }
  } catch (error) {
    return '';
  }
};