import { NextRequest, NextResponse } from 'next/server';

// RUM Event interface
interface RUMEvent {
  id: string;
  type: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  url: string;
  data: Record<string, unknown>;
  context: {
    userAgent: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    devicePixelRatio: number;
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    referrer: string;
    pathname: string;
    isTouch: boolean;
  };
}

interface RUMPayload {
  events: RUMEvent[];
  timestamp: number;
}

// In-memory storage for demo (in production, use a database)
const rumEvents: RUMEvent[] = [];
const MAX_EVENTS = 10000;

// Aggregate metrics
interface AggregatedMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  webVitals: {
    LCP: number[];
    FCP: number[];
    FID: number[];
    CLS: number[];
    INP: number[];
    TTFB: number[];
  };
  errors: Array<{ message: string; count: number; lastSeen: number }>;
  sessions: Set<string>;
  pageViews: number;
  interactions: number;
}

const aggregatedMetrics: AggregatedMetrics = {
  totalEvents: 0,
  eventsByType: {},
  webVitals: {
    LCP: [],
    FCP: [],
    FID: [],
    CLS: [],
    INP: [],
    TTFB: [],
  },
  errors: [],
  sessions: new Set(),
  pageViews: 0,
  interactions: 0,
};

function processEvent(event: RUMEvent): void {
  // Update total count
  aggregatedMetrics.totalEvents++;
  
  // Count by type
  aggregatedMetrics.eventsByType[event.type] = 
    (aggregatedMetrics.eventsByType[event.type] || 0) + 1;
  
  // Track sessions
  aggregatedMetrics.sessions.add(event.sessionId);
  
  // Process specific event types
  switch (event.type) {
    case 'page_view':
      aggregatedMetrics.pageViews++;
      break;
      
    case 'interaction':
      aggregatedMetrics.interactions++;
      break;
      
    case 'web_vital':
      const vitalName = event.data.name as keyof typeof aggregatedMetrics.webVitals;
      const vitalValue = event.data.value as number;
      if (vitalName && typeof vitalValue === 'number' && aggregatedMetrics.webVitals[vitalName]) {
        aggregatedMetrics.webVitals[vitalName].push(vitalValue);
        // Keep only last 1000 values
        if (aggregatedMetrics.webVitals[vitalName].length > 1000) {
          aggregatedMetrics.webVitals[vitalName].shift();
        }
      }
      break;
      
    case 'error':
      const errorMessage = (event.data.message as string) || 'Unknown error';
      const existingError = aggregatedMetrics.errors.find(e => e.message === errorMessage);
      if (existingError) {
        existingError.count++;
        existingError.lastSeen = event.timestamp;
      } else {
        aggregatedMetrics.errors.push({
          message: errorMessage,
          count: 1,
          lastSeen: event.timestamp,
        });
        // Keep only top 100 errors
        if (aggregatedMetrics.errors.length > 100) {
          aggregatedMetrics.errors.sort((a, b) => b.count - a.count);
          aggregatedMetrics.errors = aggregatedMetrics.errors.slice(0, 100);
        }
      }
      break;
  }
}

function calculatePercentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// POST - Receive RUM events
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload: RUMPayload = await request.json();
    
    if (!payload.events || !Array.isArray(payload.events)) {
      return NextResponse.json(
        { error: 'Invalid payload: events array required' },
        { status: 400 }
      );
    }
    
    // Process and store events
    for (const event of payload.events) {
      processEvent(event);
      rumEvents.push(event);
    }
    
    // Trim old events
    while (rumEvents.length > MAX_EVENTS) {
      rumEvents.shift();
    }
    
    return NextResponse.json({
      success: true,
      received: payload.events.length,
      total: rumEvents.length,
    });
    
  } catch (error) {
    console.error('RUM API error:', error);
    return NextResponse.json(
      { error: 'Failed to process RUM events' },
      { status: 500 }
    );
  }
}

// GET - Retrieve RUM analytics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'summary';
    
    switch (type) {
      case 'summary':
        // Return aggregated summary
        const webVitalsSummary: Record<string, { p50: number; p75: number; p95: number; count: number }> = {};
        
        for (const [name, values] of Object.entries(aggregatedMetrics.webVitals)) {
          if (values.length > 0) {
            webVitalsSummary[name] = {
              p50: calculatePercentile(values, 50),
              p75: calculatePercentile(values, 75),
              p95: calculatePercentile(values, 95),
              count: values.length,
            };
          }
        }
        
        return NextResponse.json({
          totalEvents: aggregatedMetrics.totalEvents,
          uniqueSessions: aggregatedMetrics.sessions.size,
          pageViews: aggregatedMetrics.pageViews,
          interactions: aggregatedMetrics.interactions,
          eventsByType: aggregatedMetrics.eventsByType,
          webVitals: webVitalsSummary,
          topErrors: aggregatedMetrics.errors
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
        });
        
      case 'events':
        // Return recent events
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const eventType = searchParams.get('eventType');
        
        let filteredEvents = rumEvents;
        if (eventType) {
          filteredEvents = filteredEvents.filter(e => e.type === eventType);
        }
        
        return NextResponse.json({
          events: filteredEvents.slice(-limit).reverse(),
          total: filteredEvents.length,
        });
        
      case 'webvitals':
        // Return detailed web vitals data
        const vitalName = searchParams.get('name') as keyof typeof aggregatedMetrics.webVitals;
        
        if (vitalName && aggregatedMetrics.webVitals[vitalName]) {
          const values = aggregatedMetrics.webVitals[vitalName];
          return NextResponse.json({
            name: vitalName,
            values: values.slice(-100),
            statistics: {
              min: Math.min(...values),
              max: Math.max(...values),
              avg: values.reduce((a, b) => a + b, 0) / values.length,
              p50: calculatePercentile(values, 50),
              p75: calculatePercentile(values, 75),
              p90: calculatePercentile(values, 90),
              p95: calculatePercentile(values, 95),
              p99: calculatePercentile(values, 99),
              count: values.length,
            },
          });
        }
        
        return NextResponse.json({
          error: 'Invalid or missing web vital name',
        }, { status: 400 });
        
      case 'errors':
        // Return error details
        return NextResponse.json({
          errors: aggregatedMetrics.errors
            .sort((a, b) => b.count - a.count),
          total: aggregatedMetrics.errors.reduce((sum, e) => sum + e.count, 0),
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('RUM API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve RUM data' },
      { status: 500 }
    );
  }
}

// DELETE - Clear RUM data
export async function DELETE(): Promise<NextResponse> {
  try {
    // Clear events
    rumEvents.length = 0;
    
    // Reset metrics
    aggregatedMetrics.totalEvents = 0;
    aggregatedMetrics.eventsByType = {};
    aggregatedMetrics.webVitals = {
      LCP: [],
      FCP: [],
      FID: [],
      CLS: [],
      INP: [],
      TTFB: [],
    };
    aggregatedMetrics.errors = [];
    aggregatedMetrics.sessions.clear();
    aggregatedMetrics.pageViews = 0;
    aggregatedMetrics.interactions = 0;
    
    return NextResponse.json({
      success: true,
      message: 'RUM data cleared',
    });
    
  } catch (error) {
    console.error('RUM API DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to clear RUM data' },
      { status: 500 }
    );
  }
}
