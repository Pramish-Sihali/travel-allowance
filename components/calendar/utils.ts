// Calendar utilities
import { NepaliDate } from './types';
import { monthStartMapping, daysInMonthNepali, nepaliMonths } from './constants';

export const findCurrentNepaliDate = (englishDate: Date): NepaliDate => {
  const year = englishDate.getFullYear();
  const month = englishDate.getMonth();
  const day = englishDate.getDate();
  
  const normalizedDate = new Date(year, month, day);

  // Check each Nepali year to find the correct one
  for (const [nepaliYearStr, months] of Object.entries(monthStartMapping)) {
    const nepaliYear = parseInt(nepaliYearStr);
    
    for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
      const currentMonth = months[monthIndex];
      const nextMonth = months[monthIndex + 1];
      
      const currentMonthStart = new Date(currentMonth.year, currentMonth.month, currentMonth.day);
      
      let nextMonthStart: Date;
      if (nextMonth) {
        nextMonthStart = new Date(nextMonth.year, nextMonth.month, nextMonth.day);
      } else {
        // If it's the last month of the year, use the first month of next year
        const nextYearMapping = monthStartMapping[(nepaliYear + 1).toString()];
        if (nextYearMapping) {
          const nextYearFirstMonth = nextYearMapping[0];
          nextMonthStart = new Date(nextYearFirstMonth.year, nextYearFirstMonth.month, nextYearFirstMonth.day);
        } else {
          // Fallback: add approximate days for the last month
          nextMonthStart = new Date(currentMonthStart);
          nextMonthStart.setDate(nextMonthStart.getDate() + (daysInMonthNepali[nepaliYear]?.[monthIndex] || 30));
        }
      }

      // Check if the English date falls within this Nepali month
      if (normalizedDate >= currentMonthStart && normalizedDate < nextMonthStart) {
        const diffTime = normalizedDate.getTime() - currentMonthStart.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const nepaliDay = diffDays + 1;
        
        return {
          year: nepaliYear,
          month: monthIndex,
          day: nepaliDay
        };
      }
    }
  }

  // Fallback to a default if no match found
  return {
    year: 2082,
    month: 2, // Ashar (June/July)
    day: 5
  };
};

export const getDaysInMonth = (year: number, month: number): number => {
  if (daysInMonthNepali[year]) {
    return daysInMonthNepali[year][month];
  }
  return 30; // Default fallback
};

export const getFirstDayOfMonth = (year: number, month: number): number => {
  const mapping = monthStartMapping[year.toString()];
  if (!mapping || !mapping[month]) {
    return 0; // Default to Sunday
  }

  const startDate = new Date(mapping[month].year, mapping[month].month, mapping[month].day);
  return startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
};

export const formatNepaliDate = (date: NepaliDate): string => {
  return `${date.day} ${nepaliMonths[date.month]} ${date.year}`;
};

export const isToday = (nepaliDate: NepaliDate, today: NepaliDate): boolean => {
  return (
    nepaliDate.year === today.year &&
    nepaliDate.month === today.month &&
    nepaliDate.day === today.day
  );
};