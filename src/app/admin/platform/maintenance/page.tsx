'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, AlertTriangle, Clock } from 'lucide-react';

export default function MaintenanceModePage() {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Platform is under maintenance. We\'ll be back soon!');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(60);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    // Fetch current maintenance mode status
    fetchMaintenanceStatus();
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await fetch('/api/admin/platform/maintenance');
      const data = await response.json();
      setIsActive(data.isActive || false);
      setMessage(data.message || message);
      setEstimatedMinutes(data.estimatedMinutes || 60);
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('');

    try {
      const response = await fetch('/api/admin/platform/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive,
          message,
          estimatedMinutes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update maintenance mode');
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save maintenance mode:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Wrench className="h-8 w-8 text-purple-600" />
          Maintenance Mode
        </h1>
        <p className="text-slate-600 mt-2">
          Control platform availability and display maintenance messages to users
        </p>
      </div>

      {/* Status Alert */}
      {isActive && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Maintenance mode is currently ACTIVE!</strong> Regular users cannot access the platform.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Settings</CardTitle>
          <CardDescription>Configure maintenance mode behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance-active" className="text-base">
                Enable Maintenance Mode
              </Label>
              <p className="text-sm text-slate-500 mt-1">
                When enabled, regular users will see the maintenance message
              </p>
            </div>
            <Switch
              id="maintenance-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter the message users will see..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-slate-500">
              This message will be displayed to users when they try to access the platform
            </p>
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="estimated-minutes">
              <Clock className="inline h-4 w-4 mr-1" />
              Estimated Duration (minutes)
            </Label>
            <Input
              id="estimated-minutes"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
              min={0}
            />
            <p className="text-xs text-slate-500">
              Optional: Let users know approximately when you'll be back
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>

            {saveStatus === 'success' && (
              <span className="text-sm text-green-600">✓ Saved successfully</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600">✗ Failed to save</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>How users will see the maintenance message</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-8 text-center">
            <Wrench className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isActive ? 'Under Maintenance' : 'Preview Mode'}
            </h2>
            <p className="text-slate-600 mb-4">{message}</p>
            {estimatedMinutes > 0 && (
              <p className="text-sm text-slate-500">
                Estimated time: {estimatedMinutes} minutes
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
