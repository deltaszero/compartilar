// app/components/Analytics.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@lib/firebaseConfig';
import { logEvent } from 'firebase/analytics';

const Analytics = () => {
    const pathname = usePathname();

    useEffect(() => {
        if (analytics) {
            logEvent(analytics, 'page_view', { page_path: pathname });
        }
    }, [pathname]);

    return null;
};

export default Analytics;
