// Nepali calendar constants
export const nepaliMonths = [
  'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भदौ', 'असोज',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
];

export const nepaliMonthsEn = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashoj', 
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const nepaliDays = ["आईत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"];
export const nepaliDaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Days in each month for Nepali calendar years
export const daysInMonthNepali: { [key: number]: number[] } = {
  2081: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2083: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2084: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]
};

// Month start mapping
export const monthStartMapping: { [key: string]: Array<{year: number, month: number, day: number}> } = {
  "2082": [
    { year: 2025, month: 3, day: 13 },   // Baisakh starts April 13, 2025
    { year: 2025, month: 4, day: 14 },   // Jestha starts May 14, 2025
    { year: 2025, month: 5, day: 15 },   // Asar starts June 15, 2025
    { year: 2025, month: 6, day: 16 },   // Shrawan starts July 16, 2025
    { year: 2025, month: 7, day: 17 },   // Bhadra starts August 17, 2025
    { year: 2025, month: 8, day: 17 },   // Ashoj starts September 17, 2025
    { year: 2025, month: 9, day: 17 },   // Kartik starts October 17, 2025
    { year: 2025, month: 10, day: 16 },  // Mangsir starts November 16, 2025
    { year: 2025, month: 11, day: 15 },  // Poush starts December 15, 2025
    { year: 2026, month: 0, day: 14 },   // Magh starts January 14, 2026
    { year: 2026, month: 1, day: 13 },   // Falgun starts February 13, 2026
    { year: 2026, month: 2, day: 14 }    // Chaitra starts March 14, 2026
  ]
};