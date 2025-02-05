// File: /home/dusoudeth/Documentos/github/compartilar/app/(user)/[username]/calendar/page.tsx
'use client';

import React, { useState } from 'react';
import { DateCalendar, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { styled } from '@mui/material/styles';

// Custom styled day component for weekend highlighting
const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== 'isWeekend',
})<PickersDayProps<Dayjs> & { isWeekend?: boolean }>(({ theme, isWeekend }) => ({
  ...(isWeekend && {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
    },
  }),
}));

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

  // Function to check if a day is a weekend
  const isWeekend = (day: Dayjs) => {
    const dayOfWeek = day.day();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  };

  // Custom day renderer to highlight weekends
  const renderDay = (props: PickersDayProps<Dayjs>) => {
    const { day, ...other } = props;
    return (
      <CustomPickersDay
        {...other}
        day={day}
        isWeekend={isWeekend(day)}
      />
    );
  };

  // Handle month navigation
  const handleMonthChange = (newMonth: Dayjs) => {
    setCurrentDate(newMonth);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Calendar</h2>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={currentDate}
              onChange={(newValue) => setCurrentDate(newValue)}
              onMonthChange={handleMonthChange}
              slots={{
                day: renderDay,
              }}
              className="w-full"
            />
          </LocalizationProvider>
        </div>
      </div>
    </div>
  );
}