// app/components/Analytics.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@/app/lib/firebaseConfig';
import { logEvent, setUserProperties } from 'firebase/analytics';

// Declare gtag globally
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

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
    [key: string]: string | number | boolean | null | undefined;
}

// Inner Analytics component that uses searchParams
const AnalyticsTracker = () => {
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

// Analytics component wrapped in Suspense
const Analytics = () => {
    return (
        <Suspense fallback={null}>
            <AnalyticsTracker />
        </Suspense>
    );
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
    // Track with Firebase Analytics
    if (analytics) {
        logEvent(analytics, eventType.toString(), {
            ...params,
            timestamp: new Date().toISOString(),
            page_path: window.location.pathname,
            page_title: document.title,
        });
    }
    
    // Also track with Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
        try {
            window.gtag('event', eventType.toString(), {
                ...params,
                timestamp: new Date().toISOString(),
                page_path: window.location.pathname,
                page_title: document.title,
            });
            console.log('Google Analytics event tracked:', eventType, params);
        } catch (error) {
            console.error('Error tracking Google Analytics event:', error);
        }
    } else {
        console.warn('Google Analytics not initialized for event:', eventType);
    }
};

// Utility function to set user properties
export const setUserAnalyticsProperties = (properties: AnalyticsEventParams) => {
    if (analytics) {
        setUserProperties(analytics, properties);
    }
};

export default Analytics;
