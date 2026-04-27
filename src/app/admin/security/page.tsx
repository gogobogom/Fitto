'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SecurityMetrics {
  totalAttempts: number;
  failedLogins: number;
  blockedIPs: number;
  suspiciousActivity: number;
  recentEvents: Array<{
    id: string;
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
  }>;
}

export default function SecurityPage() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/security');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-500 text-white">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500 text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Lock className="h-8 w-8 text-purple-600" />
          Security Overview
        </h1>
        <p className="text-slate-600 mt-2">Monitor platform security and threats</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Login Attempts
            </CardDescription>
            <CardTitle className="text-2xl">{metrics?.totalAttempts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Failed Logins
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{metrics?.failedLogins}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Blocked IPs
            </CardDescription>
            <CardTitle className="text-2xl">{metrics?.blockedIPs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Suspicious Activity
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">{metrics?.suspiciousActivity}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security-related activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-4 border rounded-lg">
                <div className="mt-1">
                  {event.severity === 'high' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : event.severity === 'medium' ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{event.type}</span>
                    {getSeverityBadge(event.severity)}
                  </div>
                  <p className="text-sm text-slate-600">{event.description}</p>
                  <p className="text-xs text-slate-500 mt-2">{formatDate(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
