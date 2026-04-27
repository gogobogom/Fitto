import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Try to get country from Cloudflare/Vercel headers first
    const cfCountry = request.headers.get('cf-ipcountry');
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    
    if (cfCountry && cfCountry !== 'XX') {
      return NextResponse.json({ 
        country: cfCountry,
        source: 'cloudflare-header'
      });
    }
    
    if (vercelCountry && vercelCountry !== 'XX') {
      return NextResponse.json({ 
        country: vercelCountry,
        source: 'vercel-header'
      });
    }

    // Fallback to IP-based geolocation
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';

    // For localhost/development, return TR as default for testing
    if (ip === 'unknown' || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
      return NextResponse.json({ 
        country: 'TR',
        source: 'default-localhost',
        ip
      });
    }

    // Use ipapi.co for geolocation (free tier: 1000 requests/day)
    const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'Fitto-App/1.0'
      }
    });

    if (!geoResponse.ok) {
      throw new Error('Geolocation API error');
    }

    const geoData = await geoResponse.json() as { country_code?: string; error?: boolean };

    if (geoData.error || !geoData.country_code) {
      // Fallback to TR for errors
      return NextResponse.json({ 
        country: 'TR',
        source: 'fallback-error',
        ip
      });
    }

    return NextResponse.json({ 
      country: geoData.country_code,
      source: 'ipapi',
      ip
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Geolocation] Error:', errorMsg);
    
    // Fallback to TR on error
    return NextResponse.json({ 
      country: 'TR',
      source: 'fallback-error',
      error: errorMsg
    });
  }
}
