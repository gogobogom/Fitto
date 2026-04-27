'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, MessageSquare, TrendingUp, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  aiMessagesToday: number;
  revenueThisMonth: number;
  userGrowth: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/dashboard/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome to Fitto Admin Panel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Ensure stats is loaded before rendering
  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome to Fitto Admin Panel</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: Users,
      change: `+${stats.userGrowth || 0}%`,
      changeType: 'positive' as const,
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions || 0,
      icon: DollarSign,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: 'AI Messages Today',
      value: stats.aiMessagesToday || 0,
      icon: MessageSquare,
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Revenue (MTD)',
      value: `$${stats.revenueThisMonth || 0}`,
      icon: TrendingUp,
      change: '+15%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome to Fitto Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>{stat.title}</CardDescription>
                  <Icon className="h-5 w-5 text-slate-400" />
                </div>
                <CardTitle className="text-2xl mt-2">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={`text-sm ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Real-time system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                stats.systemHealth === 'healthy'
                  ? 'bg-green-500'
                  : stats.systemHealth === 'degraded'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-sm font-medium capitalize">
              {stats.systemHealth || 'Unknown'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest admin actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">User registration spike detected</p>
                <p className="text-xs text-slate-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">New subscription activated</p>
                <p className="text-xs text-slate-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">System backup completed</p>
                <p className="text-xs text-slate-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
