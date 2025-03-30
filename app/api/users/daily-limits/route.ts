import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FREE_TIER_LIMITS } from '@/hooks/usePremiumFeatures';

// Interface for response
interface DailyLimitResponse {
  limit: number;
  used: number;
  remaining: number;
  isPremium: boolean;
}

/**
 * GET - Check user daily event creation limits
 */
export async function GET(request: NextRequest) {
  // CSRF protection
  const requestedWith = request.headers.get('x-requested-with');
  if (requestedWith !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
  }

  // Auth verification
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get the feature type from query params
    const featureType = new URL(request.url).searchParams.get('featureType') || 'calendar_events';
    
    // Check if user is premium
    const userRef = adminDb().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const isPremium = !!(userData?.subscription?.active && userData?.subscription?.plan === 'premium');
    
    // Premium users have unlimited limits
    if (isPremium) {
      return NextResponse.json({
        limit: Infinity,
        used: 0,
        remaining: Infinity,
        isPremium: true
      } as DailyLimitResponse);
    }
    
    // For free users, check daily limits
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyLimitRef = adminDb().collection('userDailyLimits').doc(`${userId}_${today}_${featureType}`);
    const dailyLimitDoc = await dailyLimitRef.get();
    
    // Get the feature limit
    let limit = 3; // Default
    switch (featureType) {
      case 'calendar_events':
        limit = FREE_TIER_LIMITS?.max_calendar_events || 3;
        break;
      case 'financial_entries':
        limit = FREE_TIER_LIMITS?.max_financial_entries || 3;
        break;
      default:
        limit = 3;
    }
    
    // Calculate used and remaining
    const used = dailyLimitDoc.exists ? dailyLimitDoc.data()?.count || 0 : 0;
    const remaining = Math.max(0, limit - used);
    
    return NextResponse.json({
      limit,
      used,
      remaining,
      isPremium: false
    } as DailyLimitResponse);
  } catch (error) {
    console.error('Error checking daily limits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Increment user daily limit counter
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  const requestedWith = request.headers.get('x-requested-with');
  if (requestedWith !== 'XMLHttpRequest') {
    return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
  }

  // Auth verification
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the Firebase auth token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request data
    const { featureType = 'calendar_events' } = await request.json();
    
    // Check if user is premium
    const userRef = adminDb().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const isPremium = !!(userData?.subscription?.active && userData?.subscription?.plan === 'premium');
    
    // Premium users have unlimited usage
    if (isPremium) {
      return NextResponse.json({
        success: true,
        isPremium: true,
        message: 'Premium user has unlimited usage'
      });
    }
    
    // For free users, increment counter within transaction for atomicity
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyLimitRef = adminDb().collection('userDailyLimits').doc(`${userId}_${today}_${featureType}`);
    
    // Get the feature limit
    let limit = 3; // Default
    switch (featureType) {
      case 'calendar_events':
        limit = FREE_TIER_LIMITS?.max_calendar_events || 3;
        break;
      case 'financial_entries':
        limit = FREE_TIER_LIMITS?.max_financial_entries || 3;
        break;
      default:
        limit = 3;
    }
    
    // Run in transaction to prevent race conditions
    const result = await adminDb().runTransaction(async (transaction) => {
      const doc = await transaction.get(dailyLimitRef);
      const currentCount = doc.exists ? doc.data()?.count || 0 : 0;
      
      // If limit reached, return false
      if (currentCount >= limit) {
        return {
          success: false,
          limitReached: true,
          message: `Daily limit of ${limit} ${featureType.replace('_', ' ')} reached`
        };
      }
      
      // Increment counter
      transaction.set(dailyLimitRef, { 
        userId,
        featureType,
        count: currentCount + 1,
        date: today,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      return {
        success: true,
        limitReached: false,
        used: currentCount + 1,
        remaining: limit - (currentCount + 1),
        message: `Limit incremented. Used: ${currentCount + 1}/${limit}`
      };
    });
    
    if (result.limitReached) {
      return NextResponse.json(result, { status: 403 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error incrementing daily limit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}