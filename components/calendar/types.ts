// Calendar types
export interface NepaliDate {
  year: number;
  month: number;
  day: number;
}

export interface CalendarData {
  nepali_date: string;
  english_date: string;
  tithi: string;
  festival: string;
  holiday: boolean;
  marriage_date: boolean;
  bratabandha: boolean;
  day_of_week: number;
  isOutsideMonth?: boolean;
}

export interface MonthInfo {
  year: number;
  month: number;
  month_name: string;
  total_days: number;
  start_day_of_week: number;
  is_leap_month: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time?: string;
  location?: string;
  type?: string;
  created_at?: string;
}