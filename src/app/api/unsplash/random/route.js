import { NextResponse } from 'next/server';
import { getRandomPhoto } from '@/lib/unsplash/api';

/**
 * GET handler for the /api/unsplash/random endpoint
 * Fetches a random photo from Unsplash
 */
export async function GET(request) {
  try {
    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    
    // Convert search params to an object for the Unsplash API
    const params = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    // Fetch a random photo from Unsplash
    const photo = await getRandomPhoto(params);
    
    // Return the photo as JSON
    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error fetching random photo from Unsplash:', error);
    
    // Return an error response
    return NextResponse.json(
      { error: error.message || 'Failed to fetch random photo from Unsplash' },
      { status: 500 }
    );
  }
}