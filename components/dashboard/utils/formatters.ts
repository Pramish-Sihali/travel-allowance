// components/dashboard/utils/formatters.ts

/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency: string = 'Nrs.'): string => {
    return `${currency}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
  
  /**
   * Format date
   */
  export const formatDate = (
    date: string | Date,
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
    startDate: string | Date,
    endDate: string | Date,
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
  export const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };