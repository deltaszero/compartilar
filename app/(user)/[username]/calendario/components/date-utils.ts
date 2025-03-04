import {
  format,
  startOfMonth,
  endOfMonth,
  getDay,
  subDays,
  addDays,
  isSameDay,
  isSameMonth,
  getDate,
  parseISO,
  isBefore,
  isAfter,
  isEqual
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Format date with localization support
export function formatDateLocalized(date: Date, formatStr: string, locale = ptBR) {
  return format(date, formatStr, { locale });
}

// Function to get events for a specific day
export function getEventsForDay(date: Date, events: any[]) {
  return events.filter(event => {
    const startDate = event.startTime.toDate();
    return isSameDay(date, startDate);
  });
}

// Generate calendar days grid
export function generateCalendarDays(
  currentMonth: Date,
  selectedDate: Date | null,
  events: any[]
) {
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDay = getDay(firstDayOfMonth); // 0 = Sunday, 6 = Saturday

  const daysArray = [];
  const today = new Date();

  // Add days from previous month
  for (let i = 0; i < startDay; i++) {
    const date = subDays(firstDayOfMonth, startDay - i);
    daysArray.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: getEventsForDay(date, events)
    });
  }

  // Add days of current month
  for (let i = 0; i < getDate(lastDayOfMonth); i++) {
    const date = addDays(firstDayOfMonth, i);
    daysArray.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: getEventsForDay(date, events)
    });
  }

  // Add days from next month to complete the grid (total 42 cells for 6 rows)
  const remainingDays = 42 - daysArray.length;
  for (let i = 0; i < remainingDays; i++) {
    const date = addDays(lastDayOfMonth, i + 1);
    daysArray.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: getEventsForDay(date, events)
    });
  }

  return daysArray;
}

// Create a Date from date and time strings
export function createDateFromStrings(dateStr: string, timeStr: string): Date {
  return parseISO(`${dateStr}T${timeStr}:00`);
}

// Check if an end date/time is after start date/time
export function isEndAfterStart(
  startDate: string, 
  startTime: string, 
  endDate: string, 
  endTime: string
): boolean {
  const start = createDateFromStrings(startDate, startTime);
  const end = createDateFromStrings(endDate, endTime);
  return isAfter(end, start) || isEqual(end, start);
}