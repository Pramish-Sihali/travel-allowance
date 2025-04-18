// components/dashboard/utils/formatters.ts

/**
 * Format currency values with proper handling of undefined/null values
 */
export const formatCurrency = (amount: number | undefined | null, currency: string = 'Nrs.'): string => {
  // Safely handle undefined/null values
  const safeAmount = amount ?? 0;
  
  return `${currency}${safeAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Format date
 */
export const formatDate = (
  date: string | Date | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, options);
};

/**
 * Format date range
 */
export const formatDateRange = (
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null,
  options: {
    startOptions?: Intl.DateTimeFormatOptions;
    endOptions?: Intl.DateTimeFormatOptions;
    separator?: string;
  } = {}
): string => {
  const {
    startOptions = { month: 'short', day: 'numeric' },
    endOptions = { month: 'short', day: 'numeric' },
    separator = ' to '
  } = options;

  if (!startDate || !endDate) return '';
  
  const formattedStartDate = formatDate(startDate, startOptions);
  const formattedEndDate = formatDate(endDate, endOptions);
  
  return `${formattedStartDate}${separator}${formattedEndDate}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string | undefined | null, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};