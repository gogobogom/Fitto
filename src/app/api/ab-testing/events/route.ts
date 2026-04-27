import { NextRequest, NextResponse } from 'next/server';

interface ExperimentEvent {
  experimentId: string;
  variantId: string;
  userId: string;
  eventType: string;
  eventValue?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date | string;
}

interface EventBatch {
  events: ExperimentEvent[];
}

// In-memory storage for demo (in production, use database)
const eventStore: ExperimentEvent[] = [];
const MAX_EVENTS = 10000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as EventBatch;
    
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { success: false, error: 'Events array required' },
        { status: 400 }
      );
    }

    // Validate and store events
    const validEvents: ExperimentEvent[] = [];
    
    for (const event of body.events) {
      if (!event.experimentId || !event.variantId || !event.userId || !event.eventType) {
        continue;
      }

      validEvents.push({
        experimentId: event.experimentId,
        variantId: event.variantId,
        userId: event.userId,
        eventType: event.eventType,
        eventValue: event.eventValue,
        metadata: event.metadata,
        timestamp: new Date(event.timestamp),
      });
    }

    // Add to store (with limit)
    eventStore.push(...validEvents);
    while (eventStore.length > MAX_EVENTS) {
      eventStore.shift();
    }

    return NextResponse.json({
      success: true,
      eventsReceived: validEvents.length,
    });
  } catch (error) {
    console.error('[AB Testing] Events error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let filtered = [...eventStore];

    if (experimentId) {
      filtered = filtered.filter((e) => e.experimentId === experimentId);
    }

    if (eventType) {
      filtered = filtered.filter((e) => e.eventType === eventType);
    }

    // Sort by timestamp descending and limit
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
    filtered = filtered.slice(0, limit);

    // Calculate basic stats
    const stats = {
      totalEvents: eventStore.length,
      uniqueUsers: new Set(eventStore.map((e) => e.userId)).size,
      byExperiment: {} as Record<string, number>,
      byEventType: {} as Record<string, number>,
    };

    eventStore.forEach((event) => {
      stats.byExperiment[event.experimentId] = (stats.byExperiment[event.experimentId] || 0) + 1;
      stats.byEventType[event.eventType] = (stats.byEventType[event.eventType] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      events: filtered,
      stats,
    });
  } catch (error) {
    console.error('[AB Testing] Get events error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
