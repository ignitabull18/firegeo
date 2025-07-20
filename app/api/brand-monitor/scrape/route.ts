import { NextRequest, NextResponse } from 'next/server';
import { scrapeCompanyInfo } from '@/lib/scrape-utils';
import { 
  handleApiError, 
  // AuthenticationError, // Temporarily disabled 
  ValidationError
} from '@/lib/api-errors';
// import { createServerClient } from '@supabase/ssr'; // Temporarily disabled

// Authentication functions temporarily disabled for testing
/*
async function getUser(request: NextRequest) {
  try {
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = request.cookies.getAll();
            console.log('Available cookies:', cookies.map(c => c.name));
            return cookies;
          },
          setAll(cookiesToSet: any) {
            // In API routes, we don't need to set cookies but we need this function
            console.log('Cookies to set:', cookiesToSet.length);
          },
        },
      }
    );

    const { data: { user }, error } = await supabaseServer.auth.getUser();
    
    console.log('Auth result:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: error?.message 
    });
    
    if (error) {
      console.log('Supabase auth error:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.log('getUser function error:', error);
    return null;
  }
}
*/

export async function POST(request: NextRequest) {
  try {
    // Authentication temporarily disabled for testing
    // TODO: Re-enable authentication after testing
    // const user = await getUser(request);
    // if (!user) {
    //   throw new AuthenticationError('Please log in to use this feature');
    // }

    const { url, maxAge } = await request.json();

    if (!url) {
      throw new ValidationError('Invalid request', {
        url: 'URL is required'
      });
    }
    
    // Ensure URL has protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      throw new ValidationError('Invalid URL format', {
        url: 'Please provide a valid URL'
      });
    }

    console.log('[Brand Monitor Scrape] Processing URL:', normalizedUrl);

    // Scrape the URL for company info
    const scrapedData = await scrapeCompanyInfo(normalizedUrl, maxAge);

    return NextResponse.json({
      success: true,
      data: scrapedData,
      url: normalizedUrl,
    });
  } catch (error) {
    console.error('[Brand Monitor Scrape] API error:', error);
    return handleApiError(error);
  }
}