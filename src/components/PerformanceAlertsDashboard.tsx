'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  usePerformanceAlerts,
  useAlertRules,
  useAlertStats,
  useMetricMonitor,
  useAlertNotifications,
} from '@/hooks/usePerformanceAlerts';
import type { Alert, AlertRule, AlertSeverity, MetricType } from '@/lib/performanceAlerts';
import {
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Check,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Activity,
  Zap,
  RefreshCw,
  Filter,
} from 'lucide-react';

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ReactNode; color: string; bgColor: string }> = {
  info: {
    icon: <Info className="w-4 h-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
  },
  error: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
  },
  critical: {
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
  },
};

const METRIC_LABELS: Record<MetricType, string> = {
  fcp: 'First Contentful Paint',
  lcp: 'Largest Contentful Paint',
  fid: 'First Input Delay',
  cls: 'Cumulative Layout Shift',
  ttfb: 'Time to First Byte',
  tti: 'Time to Interactive',
  tbt: 'Total Blocking Time',
  memory: 'Bellek Kullanımı',
  cpu: 'CPU Kullanımı',
  fps: 'Frame Rate',
  errorRate: 'Hata Oranı',
  apiLatency: 'API Yanıt Süresi',
  networkLatency: 'Ağ Gecikmesi',
  pageLoadTime: 'Sayfa Yükleme',
  resourceSize: 'Kaynak Boyutu',
  longTask: 'Uzun Görev',
  custom: 'Özel Metrik',
};

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: () => void;
  onResolve: () => void;
}

function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps): React.ReactElement {
  const config = SEVERITY_CONFIG[alert.severity];
  
  return (
    <Card className={`border-l-4 ${
      alert.severity === 'critical' ? 'border-l-red-500' :
      alert.severity === 'error' ? 'border-l-orange-500' :
      alert.severity === 'warning' ? 'border-l-yellow-500' :
      'border-l-blue-500'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <span className={config.color}>{config.icon}</span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{alert.ruleName}</span>
                <Badge variant="outline" className="text-xs">
                  {METRIC_LABELS[alert.metric] || alert.metric}
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {alert.message}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(alert.timestamp).toLocaleString('tr-TR')}
                </span>
                
                {alert.acknowledged && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="w-3 h-3" />
                    Onaylandı
                  </span>
                )}
                
                {alert.resolved && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Check className="w-3 h-3" />
                    Çözüldü
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!alert.acknowledged && (
              <Button variant="outline" size="sm" onClick={onAcknowledge}>
                <Check className="w-4 h-4 mr-1" />
                Onayla
              </Button>
            )}
            
            {!alert.resolved && (
              <Button variant="outline" size="sm" onClick={onResolve}>
                Çözüldü
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RuleCardProps {
  rule: AlertRule;
  onToggle: () => void;
  onDelete: () => void;
}

function RuleCard({ rule, onToggle, onDelete }: RuleCardProps): React.ReactElement {
  const config = SEVERITY_CONFIG[rule.severity];
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <span className={config.color}>{config.icon}</span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{rule.name}</span>
                <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                  {rule.enabled ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {METRIC_LABELS[rule.metric]} {rule.condition === 'greaterThan' ? '>' : '<'} {rule.threshold}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Switch checked={rule.enabled} onCheckedChange={onToggle} />
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  metric: MetricType;
  label: string;
}

function MetricCard({ metric, label }: MetricCardProps): React.ReactElement {
  const { current, average, trend, status, thresholds } = useMetricMonitor(metric);
  
  const getTrendIcon = (): React.ReactElement => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getStatusColor = (): string => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  const getProgressColor = (): string => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const progressValue = current !== null 
    ? Math.min(100, (current / thresholds.poor) * 100)
    : 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
          {getTrendIcon()}
        </div>
        
        <div className={`text-2xl font-bold ${getStatusColor()}`}>
          {current !== null ? (
            metric === 'cls' ? current.toFixed(3) :
            metric === 'fps' ? Math.round(current) :
            metric === 'memory' ? `${current.toFixed(0)} MB` :
            `${current.toFixed(0)} ms`
          ) : '--'}
        </div>
        
        <div className="mt-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>İyi: {thresholds.good}</span>
            <span>Kötü: {thresholds.poor}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PerformanceAlertsDashboard(): React.ReactElement {
  const { alerts, unacknowledgedCount, criticalCount, acknowledge, resolve, clearAlerts } = usePerformanceAlerts();
  const { rules, toggleRule, deleteRule } = useAlertRules();
  const { stats, refresh: refreshStats } = useAlertStats();
  const { latestAlert, notificationPermission, requestPermission } = useAlertNotifications({
    severity: ['warning', 'error', 'critical'],
    showToast: true,
  });
  
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  
  const filteredAlerts = severityFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === severityFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performans Uyarıları</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerçek zamanlı performans izleme ve uyarı yönetimi
          </p>
        </div>
        <div className="flex gap-2">
          {notificationPermission !== 'granted' && (
            <Button variant="outline" onClick={requestPermission}>
              <Bell className="w-4 h-4 mr-2" />
              Bildirimleri Aç
            </Button>
          )}
          <Button variant="outline" onClick={() => clearAlerts({ resolved: true })}>
            <Trash2 className="w-4 h-4 mr-2" />
            Çözülenleri Temizle
          </Button>
          <Button variant="outline" onClick={refreshStats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {criticalCount > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                {criticalCount} Kritik Uyarı!
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Acil müdahale gerektiren kritik performans sorunları var
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Uyarı</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Onay Bekleyen</p>
                <p className="text-2xl font-bold">{unacknowledgedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Çözülen</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ort. Yanıt</p>
                <p className="text-2xl font-bold">
                  {stats.avgResponseTime > 0 
                    ? `${Math.round(stats.avgResponseTime / 1000)}s`
                    : '--'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            Uyarılar
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unacknowledgedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics">Canlı Metrikler</TabsTrigger>
          <TabsTrigger value="rules">Kurallar</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Filtre:</span>
            {(['all', 'critical', 'error', 'warning', 'info'] as const).map(severity => (
              <Button
                key={severity}
                variant={severityFilter === severity ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSeverityFilter(severity)}
              >
                {severity === 'all' ? 'Tümü' : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Button>
            ))}
          </div>
          
          {/* Alert List */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BellOff className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">Henüz uyarı yok</p>
                  <p className="text-sm text-gray-400">
                    Performans sorunları tespit edildiğinde burada görünecek
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => acknowledge(alert.id)}
                  onResolve={() => resolve(alert.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard metric="lcp" label="LCP" />
            <MetricCard metric="fid" label="FID" />
            <MetricCard metric="cls" label="CLS" />
            <MetricCard metric="ttfb" label="TTFB" />
            <MetricCard metric="memory" label="Bellek" />
            <MetricCard metric="fps" label="FPS" />
            <MetricCard metric="apiLatency" label="API Yanıtı" />
            <MetricCard metric="errorRate" label="Hata Oranı" />
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {rules.filter(r => r.enabled).length} aktif kural
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Kural
            </Button>
          </div>
          
          <div className="space-y-3">
            {rules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={() => toggleRule(rule.id)}
                onDelete={() => deleteRule(rule.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
