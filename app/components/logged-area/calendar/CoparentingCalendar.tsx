'use client';

import React, { useState, useMemo } from 'react';
import { DateCalendar, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { styled } from '@mui/material/styles';

// Mapeamento de dias da semana para números (0 = Domingo, 6 = Sábado)
const DAY_NAME_TO_NUMBER: Record<string, number> = {
    sundays: 0,
    mondays: 1,
    tuesdays: 2,
    wednesdays: 3,
    thursdays: 4,
    fridays: 5,
    saturdays: 6,
};

// Componente estilizado para dias de custódia
const CustomPickersDay = styled(PickersDay, {
    shouldForwardProp: (prop) => prop !== 'isWithOtherParent',
})<PickersDayProps<Dayjs> & { isWithOtherParent?: boolean }>(({ theme, isWithOtherParent }) => ({
    ...(isWithOtherParent && {
        // backgroundColor: theme.palette.success.light,
        backgroundColor: "#4a00ff",
        color: theme.palette.success.contrastText,
        '&:hover': {
            // backgroundColor: theme.palette.success.main,
            backgroundColor: "#00d7c0"
        },
    }),
}));

interface CoParentingCalendarProps {
    coParentingDays: string[];
}

const CoParentingCalendar: React.FC<CoParentingCalendarProps> = ({ coParentingDays }) => {
    const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

    // Processa os dias de co-parentalidade
    const { specificDates, recurringDays } = useMemo(() => {
        const specific: Dayjs[] = [];
        const recurring: number[] = [];

        coParentingDays.forEach(entry => {
            // Tenta parsear como data específica
            const date = dayjs(entry, 'YYYY-MM-DD', true);
            if (date.isValid()) {
                specific.push(date);
            }
            // Verifica se é um dia recorrente
            else {
                const normalized = entry.toLowerCase().replace(/s$/, '') + 's'; // Garante plural
                if (DAY_NAME_TO_NUMBER[normalized] !== undefined) {
                    recurring.push(DAY_NAME_TO_NUMBER[normalized]);
                }
            }
        });

        return {
            specificDates: specific,
            recurringDays: Array.from(new Set(recurring)) // Remove duplicatas
        };
    }, [coParentingDays]);

    // Verifica se um dia deve ser destacado
    const isWithOtherParent = (day: Dayjs) => {
        return specificDates.some(d => d.isSame(day, 'day')) ||
            recurringDays.includes(day.day());
    };

    // Renderiza os dias personalizados
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

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
                value={currentDate}
                onChange={(newValue) => setCurrentDate(newValue)}
                slots={{ day: renderDay }}
                className="w-full"
            />
        </LocalizationProvider>
    );
};

// Uso mantido conforme solicitado
const mockCoParentingDays = [
    "2025-02-05",
    "2025-02-06",
    "2025-02-12",
    "2025-02-13",
    "tuesdays",
];

export default function CalendarPage() {
    return <CoParentingCalendar coParentingDays={mockCoParentingDays} />;
}