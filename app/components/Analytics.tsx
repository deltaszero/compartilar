// app/components/Analytics.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/app/lib/firebaseConfig';
import { logEvent, setUserProperties } from 'firebase/analytics';

// Event types
export enum AnalyticsEventType {
    PAGE_VIEW = 'page_view',
    SIGN_UP = 'sign_up',
    LOGIN = 'login',
    FEATURE_CLICK = 'feature_click',
    CTA_CLICK = 'cta_click',
    FORM_SUBMIT = 'form_submit',
    FORM_ERROR = 'form_error',
    SECTION_VIEW = 'section_view'
}

// Interface for event parameters
export interface AnalyticsEventParams {
    [key: string]: any;
}

// Analytics component for tracking page views
const Analytics = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (analytics) {
            // Track page views with additional data
            const queryParams: Record<string, string> = {};
            searchParams.forEach((value, key) => {
                queryParams[key] = value;
            });

            logEvent(analytics, AnalyticsEventType.PAGE_VIEW, {
                page_path: pathname,
                page_title: document.title,
                page_location: window.location.href,
                query_params: Object.keys(queryParams).length > 0 ? JSON.stringify(queryParams) : null,
                timestamp: new Date().toISOString(),
                referrer: document.referrer || null,
                screen_size: `${window.innerWidth}x${window.innerHeight}`,
                device_type: getDeviceType(),
            });
        }
    }, [pathname, searchParams]);

    return null;
};

// Helper function to determine device type
const getDeviceType = (): string => {
    const width = window.innerWidth;
    if (width < 576) return 'mobile';
    if (width < 992) return 'tablet';
    return 'desktop';
};

// Utility function to track events
export const trackEvent = (
    eventType: AnalyticsEventType,
    params: AnalyticsEventParams = {}
) => {
    if (analytics) {
        logEvent(analytics, eventType.toString(), {
            ...params,
            timestamp: new Date().toISOString(),
            page_path: window.location.pathname,
            page_title: document.title,
        });
    }
};

// Utility function to set user properties
export const setUserAnalyticsProperties = (properties: AnalyticsEventParams) => {
    if (analytics) {
        setUserProperties(analytics, properties);
    }
};

export default Analytics;
