import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

/**
 * GET - Fetch changelog entries for a parental plan
 * 
 * Query parameters:
 * - limit: (optional) Number of entries to return, default 20
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Get plan ID from path parameter - using await for Next.js 15 compatibility
    const { id: planId } = await params;
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Get the plan document to check permissions
    const planRef = adminDb().collection('parental_plans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Parental plan not found' }, { status: 404 });
    }

    const planData = planDoc.data();
    
    // Check permissions
    const isOwner = planData?.created_by === userId;
    const isEditor = planData?.editors?.includes(userId);
    const isViewer = planData?.viewers?.includes(userId);
    
    if (!isOwner && !isEditor && !isViewer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    
    // Fetch the changelog entries
    const changelogSnapshot = await planRef
      .collection('changelog')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    // Process the changelog entries
    const entries: any[] = [];
    changelogSnapshot.forEach(doc => {
      const entry = doc.data();
      
      // Convert Firebase timestamp to ISO string for serialization
      const timestamp = entry.timestamp ? entry.timestamp.toDate().toISOString() : null;
      
      entries.push({
        id: doc.id,
        ...entry,
        timestamp
      });
    });
    
    return NextResponse.json(entries);
    
  } catch (error) {
    console.error('Error fetching parental plan changelog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}