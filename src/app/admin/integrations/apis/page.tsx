'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plug, CheckCircle, XCircle, Activity } from 'lucide-react';

interface APIIntegration {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  endpoint: string;
  lastSync: number | null;
  requestsToday: number;
}

export default function APIsPage() {
  const [apis, setApis] = useState<APIIntegration[]>([]);

  useEffect(() => {
    fetchAPIs();
  }, []);

  const fetchAPIs = async () => {
    try {
      const response = await fetch('/api/admin/integrations/apis');
      const data = await response.json();
      setApis(data.apis || []);
    } catch (error) {
      console.error('Failed to fetch APIs:', error);
    }
  };

  const testConnection = async (apiId: string) => {
    try {
      await fetch('/api/admin/integrations/apis/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId }),
      });
      fetchAPIs();
    } catch (error) {
      console.error('Failed to test connection:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1 inline" />Active</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Plug className="h-8 w-8 text-purple-600" />
          API Integrations
        </h1>
        <p className="text-slate-600 mt-2">Manage external API connections and integrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Integrations</CardDescription>
            <CardTitle className="text-2xl">{apis.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {apis.filter((a) => a.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Requests Today</CardDescription>
            <CardTitle className="text-2xl">
              {apis.reduce((sum, a) => sum + a.requestsToday, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* API List */}
      <div className="space-y-4">
        {apis.map((api) => (
          <Card key={api.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Plug className="h-5 w-5 text-slate-400" />
                    <CardTitle className="text-lg">{api.name}</CardTitle>
                    {getStatusBadge(api.status)}
                  </div>
                  <CardDescription className="mb-3">{api.description}</CardDescription>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-slate-500">Endpoint</Label>
                      <p className="text-sm font-mono bg-slate-50 px-3 py-2 rounded mt-1">
                        {api.endpoint}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>{api.requestsToday} requests today</span>
                      </div>
                      <span>•</span>
                      <span>Last sync: {formatDate(api.lastSync)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection(api.id)}
                >
                  Test Connection
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
