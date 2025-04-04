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
  console.log('Changelog API: Starting request processing');
  
  // CSRF protection
  const requestedWith = request.headers.get('x-requested-with');
  if (requestedWith !== 'XMLHttpRequest') {
    console.log('Changelog API: CSRF verification failed');
    return NextResponse.json({ error: 'CSRF verification failed' }, { status: 403 });
  }

  // Auth verification
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Changelog API: Missing or invalid authorization header');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    console.log('Changelog API: Processing request for plan changelog');
    
    // Verify the Firebase auth token
    try {
      const decodedToken = await adminAuth().verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log('Changelog API: User authenticated:', userId);
      
      // Get plan ID from path parameter - using await for Next.js 15 compatibility
      const { id: planId } = await params;
      console.log('Changelog API: Fetching changelog for plan:', planId);
      
      if (!planId) {
        console.log('Changelog API: Plan ID is missing');
        return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
      }

      // Get the plan document to check permissions
      try {
        const planRef = adminDb().collection('parental_plans').doc(planId);
        const planDoc = await planRef.get();
        
        if (!planDoc.exists) {
          console.log('Changelog API: Plan not found:', planId);
          return NextResponse.json({ error: 'Parental plan not found' }, { status: 404 });
        }

        console.log('Changelog API: Plan found, getting data');
        const planData = planDoc.data();
        
        if (!planData) {
          console.log('Changelog API: Plan data is null or undefined');
          return NextResponse.json({ error: 'Plan data is empty' }, { status: 500 });
        }
        
        console.log('Changelog API: Plan data retrieved successfully');

        // Check permissions
        const isOwner = planData.created_by === userId;
        const isEditor = Array.isArray(planData.editors) && planData.editors.includes(userId);
        const isViewer = Array.isArray(planData.viewers) && planData.viewers.includes(userId);
        
        console.log('Changelog API: Permission check:', { isOwner, isEditor, isViewer });
        
        if (!isOwner && !isEditor && !isViewer) {
          console.log('Changelog API: Access denied for user:', userId);
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 20;
        
        console.log('Changelog API: Fetching up to', limit, 'changelog entries');
        
        // Fetch the changelog entries
        try {
          const changelogRef = planRef.collection('changelog');
          
          // Verify collection exists
          const collectionCheck = await changelogRef.limit(1).get();
          if (collectionCheck.empty) {
            console.log('Changelog API: No changelog entries found, returning empty array');
            return NextResponse.json([]);
          }
          
          const changelogSnapshot = await changelogRef
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
          
          console.log('Changelog API: Found', changelogSnapshot.size, 'changelog entries');
          
          // Process the changelog entries
          const entries: any[] = [];
          changelogSnapshot.forEach(doc => {
            try {
              const entry = doc.data();
              
              // Handle different timestamp formats for compatibility
              let timestamp;
              try {
                // If timestamp is a Firebase timestamp object
                if (entry.timestamp && typeof entry.timestamp.toDate === 'function') {
                  timestamp = entry.timestamp.toDate().getTime(); // Convert to milliseconds
                } 
                // If it's already a number (milliseconds)
                else if (entry.timestamp && typeof entry.timestamp === 'number') {
                  timestamp = entry.timestamp;
                }
                // If it's a Date object
                else if (entry.timestamp && entry.timestamp instanceof Date) {
                  timestamp = entry.timestamp.getTime();
                }
                // Fallback
                else {
                  timestamp = Date.now();
                }
              } catch (timestampError) {
                console.error('Error processing timestamp:', timestampError);
                timestamp = Date.now(); // Use current time as fallback
              }
              
              entries.push({
                id: doc.id,
                ...entry,
                timestamp
              });
            } catch (entryError) {
              console.error('Error processing changelog entry:', entryError);
              // Skip this entry but continue processing others
            }
          });
          
          console.log('Changelog API: Successfully processed entries, returning', entries.length, 'items');
          return NextResponse.json(entries);
          
        } catch (changelogError) {
          console.error('Error fetching changelog entries:', changelogError);
          return NextResponse.json({ error: 'Error fetching changelog' }, { status: 500 });
        }
        
      } catch (planError) {
        console.error('Error fetching plan document:', planError);
        return NextResponse.json({ error: 'Error fetching plan' }, { status: 500 });
      }
      
    } catch (authError) {
      console.error('Error verifying auth token:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
  } catch (error) {
    console.error('Unhandled error in changelog API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}