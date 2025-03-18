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
    // Page navigation events
    PAGE_VIEW = 'page_view',
    SECTION_VIEW = 'section_view',
    SECTION_SCROLL = 'section_scroll',
    
    // User authentication events
    SIGN_UP = 'sign_up',
    LOGIN = 'login',
    LOGOUT = 'logout',
    
    // Interaction events
    FEATURE_CLICK = 'feature_click',
    CTA_CLICK = 'cta_click',
    NAVIGATION_CLICK = 'navigation_click',
    SOCIAL_CLICK = 'social_click',
    PRICING_CLICK = 'pricing_click',
    
    // Form events
    FORM_START = 'form_start',
    FORM_SUBMIT = 'form_submit',
    FORM_ERROR = 'form_error',
    FORM_FIELD_CHANGE = 'form_field_change',
    
    // Media events
    IMAGE_VIEW = 'image_view',
    MEDIA_PLAY = 'media_play',
    MEDIA_PAUSE = 'media_pause',
    
    // Landing page specific events
    LANDING_HERO_ENGAGEMENT = 'landing_hero_engagement',
    LANDING_FEATURE_ENGAGEMENT = 'landing_feature_engagement',
    LANDING_CONCEPT_ENGAGEMENT = 'landing_concept_engagement',
    LANDING_PRICING_ENGAGEMENT = 'landing_pricing_engagement'
}

// Interface for event parameters
export interface AnalyticsEventParams {
    [key: string]: string | number | boolean | null | undefined;
}

// Inner Analytics component that uses searchParams
const AnalyticsTracker = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Enable debug mode for Firebase Analytics in development
    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            // Enable debug mode for Firebase Analytics
            // @ts-ignore - Debug flag
            window.self.FIREBASE_ANALYTICS_DEBUG_MODE = true;
            console.log('Firebase Analytics Debug Mode Enabled');
        }
    }, []);

    // Verify Firebase Analytics initialization
    useEffect(() => {
        if (analytics) {
            console.log('Firebase Analytics initialized successfully');
        } else {
            console.warn('Firebase Analytics not initialized - events will not be tracked properly');
            
            // Check if Firebase config has measurement ID
            const measurementId = process.env.NEXT_PUBLIC_MEASUREMENT_ID;
            if (!measurementId) {
                console.error('NEXT_PUBLIC_MEASUREMENT_ID is missing in environment variables');
            }
        }
    }, []);

    // Track page views
    useEffect(() => {
        if (analytics) {
            try {
                // Track page views with additional data
                const queryParams: Record<string, string> = {};
                searchParams.forEach((value, key) => {
                    queryParams[key] = value;
                });

                const pageViewParams = {
                    page_path: pathname,
                    page_title: document.title,
                    page_location: window.location.href,
                    query_params: Object.keys(queryParams).length > 0 ? JSON.stringify(queryParams) : null,
                    timestamp: new Date().toISOString(),
                    referrer: document.referrer || null,
                    screen_size: `${window.innerWidth}x${window.innerHeight}`,
                    device_type: getDeviceType(),
                };

                logEvent(analytics, AnalyticsEventType.PAGE_VIEW, pageViewParams);
                console.log('Firebase Analytics page_view event tracked:', pageViewParams);
            } catch (error) {
                console.error('Error tracking page_view event:', error);
            }
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
        try {
            // Clean parameters to ensure Firebase compatibility
            const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
                // Ensure keys are alphanumeric and underscores only
                const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                
                // Skip null/undefined values and ensure proper types
                if (value !== null && value !== undefined) {
                    // Convert complex objects to strings
                    if (typeof value === 'object' && value !== null) {
                        acc[cleanKey] = JSON.stringify(value);
                    } else {
                        acc[cleanKey] = value;
                    }
                }
                return acc;
            }, {} as AnalyticsEventParams);
            
            // Add standard parameters
            const eventParams = {
                ...cleanParams,
                timestamp: new Date().toISOString(),
                page_path: window.location.pathname,
                page_title: document.title,
            };
            
            logEvent(analytics, eventType.toString(), eventParams);
            console.log('Firebase Analytics event tracked:', eventType, eventParams);
        } catch (error) {
            console.error('Error tracking Firebase Analytics event:', error);
        }
    } else {
        console.warn('Firebase Analytics not initialized for event:', eventType);
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
