'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  reportedBy: string;
  reportedAt: number;
  resolvedAt: number | null;
}

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBugs();
  }, []);

  const fetchBugs = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/bugs');
      const data = await response.json();
      setBugs(data.bugs || []);
    } catch (error) {
      console.error('Failed to fetch bugs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBugStatus = async (bugId: string, status: string) => {
    try {
      await fetch('/api/admin/monitoring/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bugId, status }),
      });
      fetchBugs();
    } catch (error) {
      console.error('Failed to update bug status:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1 inline" />Open</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1 inline" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1 inline" />Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const openBugs = bugs.filter((b) => b.status === 'open').length;
  const criticalBugs = bugs.filter((b) => b.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Bug className="h-8 w-8 text-purple-600" />
          Bug Reports
        </h1>
        <p className="text-slate-600 mt-2">Track and manage reported bugs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Bugs</CardDescription>
            <CardTitle className="text-2xl">{bugs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Open Bugs</CardDescription>
            <CardTitle className="text-2xl text-orange-600">{openBugs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Critical</CardDescription>
            <CardTitle className="text-2xl text-red-600">{criticalBugs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {bugs.filter((b) => b.status === 'resolved').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Bug List */}
      <div className="space-y-4">
        {bugs.map((bug) => (
          <Card key={bug.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="h-5 w-5 text-slate-400" />
                    <CardTitle className="text-lg">{bug.title}</CardTitle>
                    {getSeverityBadge(bug.severity)}
                    {getStatusBadge(bug.status)}
                  </div>
                  <CardDescription className="mt-2">{bug.description}</CardDescription>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>Reported by: {bug.reportedBy}</span>
                    <span>•</span>
                    <span>{formatDate(bug.reportedAt)}</span>
                    {bug.resolvedAt && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">Resolved: {formatDate(bug.resolvedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {bug.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBugStatus(bug.id, 'in-progress')}
                    >
                      Start Working
                    </Button>
                  )}
                  {bug.status === 'in-progress' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => updateBugStatus(bug.id, 'resolved')}
                    >
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
