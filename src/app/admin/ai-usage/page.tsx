'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, TrendingUp, Users, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface AIUsageStats {
  totalMessages: number;
  messagesThisMonth: number;
  activeUsers: number;
  averagePerUser: number;
  topFeatures: Array<{ name: string; count: number }>;
  dailyUsage: Array<{ date: string; count: number }>;
}

export default function AIUsagePage() {
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/ai-usage');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch AI usage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Ensure stats is loaded
  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-slate-600">No data available</p>
        </div>
      </div>
    );
  }

  const maxFeatureCount = Math.max(...(stats.topFeatures?.map((f: { name: string; count: number }) => f.count) || [1]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-purple-600" />
          AI Usage Analytics
        </h1>
        <p className="text-slate-600 mt-2">Monitor AI coach interactions and usage patterns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Messages
            </CardDescription>
            <CardTitle className="text-2xl">{stats.totalMessages?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              This Month
            </CardDescription>
            <CardTitle className="text-2xl">{stats.messagesThisMonth?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Users
            </CardDescription>
            <CardTitle className="text-2xl">{stats.activeUsers || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Avg Per User
            </CardDescription>
            <CardTitle className="text-2xl">{stats.averagePerUser?.toFixed(1) || '0.0'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Top Features */}
      <Card>
        <CardHeader>
          <CardTitle>Most Used AI Features</CardTitle>
          <CardDescription>Features ranked by user interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topFeatures?.map((feature: { name: string; count: number }) => (
              <div key={feature.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{feature.name}</span>
                  <span className="text-sm text-slate-500">{feature.count} uses</span>
                </div>
                <Progress value={(feature.count / maxFeatureCount) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage (Last 7 Days)</CardTitle>
          <CardDescription>AI interactions per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.dailyUsage?.map((day: { date: string; count: number }) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{day.date}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{day.count} messages</Badge>
                  <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full"
                      style={{
                        width: `${(day.count / Math.max(...stats.dailyUsage.map((d) => d.count))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
