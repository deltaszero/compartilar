'use client';

import React, { useState } from 'react';
import { DateCalendar, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { styled } from '@mui/material/styles';

// Custom styled day component for highlighting days when the child is with the other parent
const CustomPickersDay = styled(PickersDay, {
    shouldForwardProp: (prop) => prop !== 'isWithOtherParent',
})<PickersDayProps<Dayjs> & { isWithOtherParent?: boolean }>(({ theme, isWithOtherParent }) => ({
    ...(isWithOtherParent && {
        backgroundColor: theme.palette.success.light,
        color: theme.palette.success.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.success.main,
        },
    }),
}));

interface CoParentingCalendarProps {
    coParentingDays: string[];
}

const CoParentingCalendar: React.FC<CoParentingCalendarProps> = ({ coParentingDays }) => {
    const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

    // Convert co-parenting days to Dayjs objects
    const custodyDays = coParentingDays.map(day => dayjs(day));

    // Function to check if a day is when the child is with the other parent
    const isWithOtherParent = (day: Dayjs) => {
        return custodyDays.some(custodyDay => custodyDay.isSame(day, 'day'));
    };

    // Custom day renderer to highlight custody days
    const renderDay = (props: PickersDayProps<Dayjs>) => {
        const { day, ...other } = props;
        return (
            <CustomPickersDay
                {...other}
                day={day}
                isWithOtherParent={isWithOtherParent(day)}
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
                    <h2 className="card-title text-center mb-4">Co-Parenting Calendar</h2>
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
};

// Simulated backend response
const mockCoParentingDays = [
    "2025-02-05", // Specific date
    "2025-02-06", // Specific date
    "2025-02-12", // Specific date
    "2025-02-13", // Specific date
    "fridays", "saturdays", "sundays" // Recurring events
];

// Usage
export default function CalendarPage() {
    return <CoParentingCalendar coParentingDays={mockCoParentingDays} />;
}