'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Settings, Zap, MessageSquare, Star } from 'lucide-react';

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  category: 'core' | 'ai' | 'premium' | 'beta';
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/admin/platform/features');
      const data = await response.json();
      setFeatures(data.features || []);
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeature = async (key: string, enabled: boolean) => {
    try {
      await fetch('/api/admin/platform/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      });

      setFeatures((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled } : f))
      );
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const updateRollout = async (key: string, percentage: number) => {
    try {
      await fetch('/api/admin/platform/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, rolloutPercentage: percentage }),
      });

      setFeatures((prev) =>
        prev.map((f) => (f.key === key ? { ...f, rolloutPercentage: percentage } : f))
      );
    } catch (error) {
      console.error('Failed to update rollout:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core':
        return Settings;
      case 'ai':
        return MessageSquare;
      case 'premium':
        return Star;
      case 'beta':
        return Zap;
      default:
        return Settings;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core':
        return 'bg-blue-100 text-blue-800';
      case 'ai':
        return 'bg-purple-100 text-purple-800';
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'beta':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-purple-600" />
          Feature Flags
        </h1>
        <p className="text-slate-600 mt-2">
          Control platform features and gradual rollouts
        </p>
      </div>

      {/* Features by Category */}
      {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => {
        const Icon = getCategoryIcon(category);
        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-slate-600" />
                <CardTitle className="capitalize">{category} Features</CardTitle>
              </div>
              <CardDescription>
                {categoryFeatures.length} feature{categoryFeatures.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categoryFeatures.map((feature) => (
                  <div key={feature.key} className="border rounded-lg p-4 space-y-4">
                    {/* Feature Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-slate-900">{feature.name}</h3>
                          <Badge className={getCategoryColor(feature.category)}>
                            {feature.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">{feature.description}</p>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(enabled) => toggleFeature(feature.key, enabled)}
                      />
                    </div>

                    {/* Rollout Percentage */}
                    {feature.enabled && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Rollout Percentage</span>
                          <span className="font-medium text-purple-600">
                            {feature.rolloutPercentage}%
                          </span>
                        </div>
                        <Slider
                          value={[feature.rolloutPercentage]}
                          onValueChange={([value]) => updateRollout(feature.key, value)}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
