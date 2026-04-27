'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Unlock, Plus } from 'lucide-react';

interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: number;
  expiresAt: number | null;
}

export default function BlockedIPsPage() {
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [newIP, setNewIP] = useState<string>('');

  useEffect(() => {
    fetchBlockedIPs();
  }, []);

  const fetchBlockedIPs = async () => {
    try {
      const response = await fetch('/api/admin/security/blocked-ips');
      const data = await response.json();
      setBlockedIPs(data.blockedIPs || []);
    } catch (error) {
      console.error('Failed to fetch blocked IPs:', error);
    }
  };

  const blockIP = async () => {
    if (!newIP) return;
    try {
      await fetch('/api/admin/security/blocked-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: newIP, reason: 'Manual block' }),
      });
      setNewIP('');
      fetchBlockedIPs();
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  };

  const unblockIP = async (id: string) => {
    try {
      await fetch(`/api/admin/security/blocked-ips?id=${id}`, { method: 'DELETE' });
      fetchBlockedIPs();
    } catch (error) {
      console.error('Failed to unblock IP:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-purple-600" />
          Blocked IP Addresses
        </h1>
        <p className="text-slate-600 mt-2">Manage blocked IP addresses and access restrictions</p>
      </div>

      {/* Add IP Form */}
      <Card>
        <CardHeader>
          <CardTitle>Block New IP</CardTitle>
          <CardDescription>Manually block an IP address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter IP address (e.g., 192.168.1.100)"
              value={newIP}
              onChange={(e) => setNewIP(e.target.value)}
            />
            <Button onClick={blockIP}>
              <Plus className="h-4 w-4 mr-2" />
              Block IP
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked IPs ({blockedIPs.length})</CardTitle>
          <CardDescription>Currently blocked IP addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Blocked At</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockedIPs.map((ip) => (
                <TableRow key={ip.id}>
                  <TableCell className="font-mono">{ip.ipAddress}</TableCell>
                  <TableCell>{ip.reason}</TableCell>
                  <TableCell className="text-sm">{formatDate(ip.blockedAt)}</TableCell>
                  <TableCell>
                    {ip.expiresAt ? (
                      <span className="text-sm">{formatDate(ip.expiresAt)}</span>
                    ) : (
                      <Badge variant="outline">Permanent</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => unblockIP(ip.id)}>
                      <Unlock className="h-4 w-4 mr-1" />
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
