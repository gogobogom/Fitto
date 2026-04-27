'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, XCircle, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ErrorLog {
  id: string;
  errorType: string;
  message: string;
  stack: string;
  userId: string | null;
  timestamp: number;
  resolved: boolean;
}

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/errors');
      const data = await response.json();
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setIsLoading(false);
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

  const unresolvedErrors = errors.filter((e) => !e.resolved).length;
  const last24Hours = errors.filter((e) => Date.now() - e.timestamp < 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Activity className="h-8 w-8 text-purple-600" />
          Error Monitoring
        </h1>
        <p className="text-slate-600 mt-2">Track application errors and exceptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Errors</CardDescription>
            <CardTitle className="text-2xl">{errors.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Unresolved</CardDescription>
            <CardTitle className="text-2xl text-red-600">{unresolvedErrors}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Last 24 Hours</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{last24Hours}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Error Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              -12%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Error List */}
      <div className="space-y-4">
        {errors.map((error) => (
          <Card key={error.id} className={error.resolved ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {error.resolved ? (
                      <XCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <CardTitle className="text-lg">{error.errorType}</CardTitle>
                    {error.resolved ? (
                      <Badge className="bg-green-100 text-green-800">Resolved</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">Unresolved</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2 font-mono text-sm">
                    {error.message}
                  </CardDescription>
                  <details className="mt-3">
                    <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                      Show Stack Trace
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-900 text-slate-100 text-xs rounded-lg overflow-x-auto">
                      {error.stack}
                    </pre>
                  </details>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>{formatDate(error.timestamp)}</span>
                    {error.userId && (
                      <>
                        <span>•</span>
                        <span>User: {error.userId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
