// This file is intentionally empty since we're no longer using this endpoint.
// The client now uses Firebase authentication directly.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use client-side Firebase authentication.' },
    { status: 410 } // Gone status code
  );
}