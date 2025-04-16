"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface DatePickerWithRangeProps {
  className?: string
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  dateRange,
  onDateRangeChange,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(dateRange)
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    setDate(dateRange);
  }, [dateRange]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDate(range);
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  };

  // Format date to YYYY-MM-DD for HTML date input
  const formatDate = (date?: Date): string => {
    if (!date) return '';
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  // Format date for display
  const formatDisplayDate = (date?: Date): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fromDate = e.target.value ? new Date(e.target.value) : undefined;
    handleDateRangeChange({
      from: fromDate,
      to: date?.to
    });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toDate = e.target.value ? new Date(e.target.value) : undefined;
    handleDateRangeChange({
      from: date?.from,
      to: toDate
    });
  };

  const clearDates = () => {
    handleDateRangeChange(undefined);
  };

  const setToday = () => {
    const today = new Date();
    handleDateRangeChange({
      from: today,
      to: today
    });
  };

  const setLast7Days = () => {
    const today = new Date();
    const last7Days = new Date();
    last7Days.setDate(today.getDate() - 7);
    
    handleDateRangeChange({
      from: last7Days,
      to: today
    });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal w-[260px]",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {formatDisplayDate(date.from)} - {formatDisplayDate(date.to)}
                </>
              ) : (
                formatDisplayDate(date.from)
              )
            ) : (
              <span>Date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="from-date" className="text-sm font-medium block mb-1">
                    From Date
                  </label>
                  <Input
                    id="from-date"
                    type="date"
                    value={formatDate(date?.from)}
                    onChange={handleFromDateChange}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="to-date" className="text-sm font-medium block mb-1">
                    To Date
                  </label>
                  <Input
                    id="to-date"
                    type="date"
                    value={formatDate(date?.to)}
                    onChange={handleToDateChange}
                    className="w-full"
                    min={formatDate(date?.from)}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setToday}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setLast7Days}
                >
                  Last 7 days
                </Button>
              </div>
              <Button
                size="sm"
                onClick={clearDates}
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}