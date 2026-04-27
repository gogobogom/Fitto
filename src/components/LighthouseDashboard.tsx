'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLighthouseMetrics } from '@/hooks/useLighthouseMetrics';
import {
  getScoreColor,
  getScoreLabel,
  type OptimizationCheck,
} from '@/lib/lighthouseOptimization';
import {
  Activity,
  Eye,
  Search,
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Gauge,
  Zap,
  Clock,
  LayoutDashboard,
} from 'lucide-react';

interface ScoreCircleProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function ScoreCircle({ score, label, size = 'md' }: ScoreCircleProps) {
  const color = getScoreColor(score);
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size]}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold" style={{ color }}>
          {score}
        </div>
      </div>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}

interface MetricCardProps {
  name: string;
  value: number | null;
  unit: string;
  score: 'good' | 'needs-improvement' | 'poor' | null;
  description: string;
}

function MetricCard({ name, value, unit, score, description }: MetricCardProps) {
  const scoreColors = {
    good: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'needs-improvement': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    poor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const scoreIcons = {
    good: <CheckCircle className="w-4 h-4" />,
    'needs-improvement': <AlertTriangle className="w-4 h-4" />,
    poor: <XCircle className="w-4 h-4" />,
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{name}</span>
          {score && (
            <Badge className={scoreColors[score]}>
              {scoreIcons[score]}
              <span className="ml-1 capitalize">{score === 'needs-improvement' ? 'Orta' : score === 'good' ? 'İyi' : 'Kötü'}</span>
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {value !== null ? (unit === 's' ? (value / 1000).toFixed(2) : value.toFixed(unit === '' ? 3 : 0)) : '-'}
          </span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

interface CheckItemProps {
  check: OptimizationCheck;
}

function CheckItem({ check }: CheckItemProps) {
  const impactColors = {
    high: 'text-red-600 dark:text-red-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${check.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
      {check.passed ? (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{check.name}</span>
          <Badge variant="outline" className={impactColors[check.impact]}>
            {check.impact === 'high' ? 'Yüksek' : check.impact === 'medium' ? 'Orta' : 'Düşük'} Etki
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{check.description}</p>
        {check.recommendation && (
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
            💡 {check.recommendation}
          </p>
        )}
      </div>
    </div>
  );
}

export function LighthouseDashboard() {
  const {
    metrics,
    report,
    isCollecting,
    error,
    collectMetrics,
    generateReport,
    getOptimizationChecks,
  } = useLighthouseMetrics();

  const [checks, setChecks] = useState<ReturnType<typeof getOptimizationChecks> | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (metrics) {
      setChecks(getOptimizationChecks());
    }
  }, [metrics, getOptimizationChecks]);

  const handleRefresh = () => {
    collectMetrics();
  };

  const handleGenerateReport = () => {
    generateReport();
  };

  const categoryScores = report?.categoryScores || {
    performance: metrics?.overallScore || 0,
    accessibility: 0,
    seo: 0,
    bestPractices: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gauge className="w-7 h-7" />
            Lighthouse Performans Raporu
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sayfa performansınızı ve optimizasyon önerilerini görüntüleyin
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isCollecting}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isCollecting ? 'animate-spin' : ''}`} />
            {isCollecting ? 'Toplaniyor...' : 'Yenile'}
          </Button>
          <Button onClick={handleGenerateReport} disabled={!metrics}>
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Rapor Oluştur
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Score Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 justify-items-center">
            <ScoreCircle score={categoryScores.performance} label="Performans" size="lg" />
            <ScoreCircle score={categoryScores.accessibility} label="Erişilebilirlik" size="lg" />
            <ScoreCircle score={categoryScores.seo} label="SEO" size="lg" />
            <ScoreCircle score={categoryScores.bestPractices} label="En İyi Uygulamalar" size="lg" />
          </div>
          
          <div className="mt-6 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">90-100: İyi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">50-89: İyileştirme Gerekli</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">0-49: Kötü</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Web Vitals</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Performans</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Erişilebilirlik</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              name="First Contentful Paint (FCP)"
              value={metrics?.FCP?.value || null}
              unit="s"
              score={metrics?.FCP?.score || null}
              description="İlk içeriğin ekrana çizilme süresi"
            />
            <MetricCard
              name="Largest Contentful Paint (LCP)"
              value={metrics?.LCP?.value || null}
              unit="s"
              score={metrics?.LCP?.score || null}
              description="En büyük içeriğin görünür olma süresi"
            />
            <MetricCard
              name="First Input Delay (FID)"
              value={metrics?.FID?.value || null}
              unit="ms"
              score={metrics?.FID?.score || null}
              description="İlk kullanıcı etkileşimine yanıt süresi"
            />
            <MetricCard
              name="Cumulative Layout Shift (CLS)"
              value={metrics?.CLS?.value || null}
              unit=""
              score={metrics?.CLS?.score || null}
              description="Görsel kararlılık skoru (düşük = iyi)"
            />
            <MetricCard
              name="Time to First Byte (TTFB)"
              value={metrics?.TTFB?.value || null}
              unit="s"
              score={metrics?.TTFB?.score || null}
              description="Sunucudan ilk baytın alınma süresi"
            />
            <MetricCard
              name="Total Blocking Time (TBT)"
              value={metrics?.TBT?.value || null}
              unit="ms"
              score={metrics?.TBT?.score || null}
              description="Ana thread'in bloke olduğu toplam süre"
            />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performans Kontrolleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checks?.performance.map((check) => (
                <CheckItem key={check.id} check={check} />
              ))}
              {(!checks || checks.performance.length === 0) && (
                <p className="text-gray-500 text-center py-4">Kontroller yükleniyor...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Erişilebilirlik Kontrolleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checks?.accessibility.map((check) => (
                <CheckItem key={check.id} check={check} />
              ))}
              {(!checks || checks.accessibility.length === 0) && (
                <p className="text-gray-500 text-center py-4">Kontroller yükleniyor...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  SEO Kontrolleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checks?.seo.map((check) => (
                  <CheckItem key={check.id} check={check} />
                ))}
                {(!checks || checks.seo.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Kontroller yükleniyor...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  En İyi Uygulamalar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checks?.bestPractices.map((check) => (
                  <CheckItem key={check.id} check={check} />
                ))}
                {(!checks || checks.bestPractices.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Kontroller yükleniyor...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Timestamp */}
      {metrics?.timestamp && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 inline mr-1" />
          Son güncelleme: {new Date(metrics.timestamp).toLocaleString('tr-TR')}
        </p>
      )}
    </div>
  );
}

export default LighthouseDashboard;
