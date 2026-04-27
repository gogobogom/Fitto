import { NextRequest, NextResponse } from 'next/server';

interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date | string;
  acknowledged: boolean;
  acknowledgedAt?: Date | string;
  resolved: boolean;
  resolvedAt?: Date | string;
  metadata: Record<string, unknown>;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  metric: string;
  condition: string;
  threshold: number;
  duration: number;
  cooldown: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  channels: string[];
  tags: string[];
}

// In-memory storage for demo (in production, use database)
const alertStore: Alert[] = [];
const ruleStore: Map<string, AlertRule> = new Map();
const MAX_ALERTS = 1000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { type: string; data: unknown };
    
    switch (body.type) {
      case 'alert': {
        const alert = body.data as Alert;
        if (!alert.id || !alert.metric || !alert.severity) {
          return NextResponse.json(
            { success: false, error: 'Invalid alert data' },
            { status: 400 }
          );
        }
        
        alertStore.push({
          ...alert,
          timestamp: new Date(alert.timestamp),
        });
        
        while (alertStore.length > MAX_ALERTS) {
          alertStore.shift();
        }
        
        return NextResponse.json({
          success: true,
          alertId: alert.id,
        });
      }
      
      case 'rule': {
        const rule = body.data as AlertRule;
        if (!rule.id || !rule.name || !rule.metric) {
          return NextResponse.json(
            { success: false, error: 'Invalid rule data' },
            { status: 400 }
          );
        }
        
        ruleStore.set(rule.id, rule);
        
        return NextResponse.json({
          success: true,
          ruleId: rule.id,
        });
      }
      
      case 'acknowledge': {
        const { alertId, acknowledgedBy } = body.data as { alertId: string; acknowledgedBy?: string };
        const alert = alertStore.find((a) => a.id === alertId);
        
        if (!alert) {
          return NextResponse.json(
            { success: false, error: 'Alert not found' },
            { status: 404 }
          );
        }
        
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date();
        
        return NextResponse.json({
          success: true,
          alertId,
          acknowledgedBy,
        });
      }
      
      case 'resolve': {
        const { alertId } = body.data as { alertId: string };
        const alert = alertStore.find((a) => a.id === alertId);
        
        if (!alert) {
          return NextResponse.json(
            { success: false, error: 'Alert not found' },
            { status: 404 }
          );
        }
        
        alert.resolved = true;
        alert.resolvedAt = new Date();
        
        return NextResponse.json({
          success: true,
          alertId,
        });
      }
      
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Performance Alerts] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'alerts';
    const severity = searchParams.get('severity');
    const metric = searchParams.get('metric');
    const acknowledged = searchParams.get('acknowledged');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (type === 'rules') {
      return NextResponse.json({
        success: true,
        rules: Array.from(ruleStore.values()),
      });
    }

    if (type === 'stats') {
      const stats = {
        totalAlerts: alertStore.length,
        bySeverity: {
          info: alertStore.filter((a) => a.severity === 'info').length,
          warning: alertStore.filter((a) => a.severity === 'warning').length,
          error: alertStore.filter((a) => a.severity === 'error').length,
          critical: alertStore.filter((a) => a.severity === 'critical').length,
        },
        acknowledged: alertStore.filter((a) => a.acknowledged).length,
        resolved: alertStore.filter((a) => a.resolved).length,
        activeRules: Array.from(ruleStore.values()).filter((r) => r.enabled).length,
        totalRules: ruleStore.size,
      };

      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Filter alerts
    let filtered = [...alertStore];

    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }

    if (metric) {
      filtered = filtered.filter((a) => a.metric === metric);
    }

    if (acknowledged !== null && acknowledged !== undefined) {
      filtered = filtered.filter((a) => a.acknowledged === (acknowledged === 'true'));
    }

    if (resolved !== null && resolved !== undefined) {
      filtered = filtered.filter((a) => a.resolved === (resolved === 'true'));
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      alerts: filtered.slice(0, limit),
      total: filtered.length,
    });
  } catch (error) {
    console.error('[Performance Alerts] Get error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'alerts';
    const id = searchParams.get('id');

    if (type === 'rule' && id) {
      const deleted = ruleStore.delete(id);
      return NextResponse.json({
        success: deleted,
        message: deleted ? 'Rule deleted' : 'Rule not found',
      });
    }

    if (type === 'alert' && id) {
      const index = alertStore.findIndex((a) => a.id === id);
      if (index !== -1) {
        alertStore.splice(index, 1);
        return NextResponse.json({
          success: true,
          message: 'Alert deleted',
        });
      }
      return NextResponse.json({
        success: false,
        message: 'Alert not found',
      });
    }

    // Clear based on criteria
    const resolved = searchParams.get('resolved');
    if (resolved === 'true') {
      const initialLength = alertStore.length;
      const filtered = alertStore.filter((a) => !a.resolved);
      alertStore.length = 0;
      alertStore.push(...filtered);
      
      return NextResponse.json({
        success: true,
        deleted: initialLength - alertStore.length,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid delete request',
    }, { status: 400 });
  } catch (error) {
    console.error('[Performance Alerts] Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
