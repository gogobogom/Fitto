'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRUM, useRUMAnalytics, usePagePerformance } from '@/hooks/useRUM';
import { getScoreColor } from '@/lib/lighthouseOptimization';
import {
  Users,
  Activity,
  Clock,
  MousePointer,
  AlertCircle,
  TrendingUp,
  Wifi,
  Monitor,
  Smartphone,
  Globe,
  Zap,
  BarChart3,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
}

function StatCard({ title, value, icon, trend, trendValue, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            {icon}
          </div>
        </div>
        {trend && trendValue && (
          <div className={`mt-2 flex items-center text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface WebVitalBadgeProps {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function WebVitalBadge({ name, value, rating }: WebVitalBadgeProps) {
  const ratingColors = {
    good: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    'needs-improvement': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    poor: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  };

  const formatValue = (n: string, v: number): string => {
    if (n === 'CLS') return v.toFixed(3);
    if (v >= 1000) return `${(v / 1000).toFixed(2)}s`;
    return `${Math.round(v)}ms`;
  };

  return (
    <div className={`p-3 rounded-lg border ${ratingColors[rating]}`}>
      <div className="text-xs font-medium opacity-75">{name}</div>
      <div className="text-lg font-bold">{formatValue(name, value)}</div>
      <div className="text-xs capitalize">{rating === 'needs-improvement' ? 'Orta' : rating === 'good' ? 'İyi' : 'Kötü'}</div>
    </div>
  );
}

interface EventListItemProps {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

function EventListItem({ type, timestamp, data }: EventListItemProps) {
  const typeIcons: Record<string, React.ReactNode> = {
    page_view: <Globe className="w-4 h-4" />,
    interaction: <MousePointer className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    web_vital: <Zap className="w-4 h-4 text-blue-500" />,
    rage_click: <MousePointer className="w-4 h-4 text-red-500" />,
    dead_click: <MousePointer className="w-4 h-4 text-yellow-500" />,
    long_task: <Clock className="w-4 h-4 text-orange-500" />,
  };

  const typeLabels: Record<string, string> = {
    page_view: 'Sayfa Görüntüleme',
    interaction: 'Etkileşim',
    error: 'Hata',
    web_vital: 'Web Vital',
    rage_click: 'Öfkeli Tıklama',
    dead_click: 'Boş Tıklama',
    long_task: 'Uzun Görev',
    session_start: 'Oturum Başlangıcı',
    custom: 'Özel',
  };

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
        {typeIcons[type] || <Activity className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-white">
            {typeLabels[type] || type}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(timestamp).toLocaleTimeString('tr-TR')}
          </span>
        </div>
        {data && Object.keys(data).length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {JSON.stringify(data).slice(0, 100)}
          </p>
        )}
      </div>
    </div>
  );
}

export function RUMDashboard() {
  const { session, events, webVitals, performanceScore, isInitialized, clearEvents } = useRUM();
  const analytics = useRUMAnalytics();
  const pagePerformance = usePagePerformance();
  const [activeTab, setActiveTab] = useState('overview');

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const recentEvents = [...events].reverse().slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            Gerçek Kullanıcı İzleme (RUM)
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerçek kullanıcı deneyimini ve performans metriklerini izleyin
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isInitialized ? 'default' : 'secondary'}>
            {isInitialized ? 'Aktif' : 'Başlatılıyor...'}
          </Badge>
          <Button variant="outline" size="sm" onClick={clearEvents}>
            <Trash2 className="w-4 h-4 mr-2" />
            Temizle
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Oturum Süresi"
          value={formatDuration(session?.duration || 0)}
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          description="Mevcut oturum"
        />
        <StatCard
          title="Sayfa Görüntüleme"
          value={session?.pageViews || 0}
          icon={<Globe className="w-5 h-5 text-blue-600" />}
          description="Bu oturumda"
        />
        <StatCard
          title="Etkileşimler"
          value={session?.interactions || 0}
          icon={<MousePointer className="w-5 h-5 text-blue-600" />}
          description="Tıklama, kaydırma vb."
        />
        <StatCard
          title="Performans Skoru"
          value={performanceScore}
          icon={<Zap className="w-5 h-5 text-blue-600" />}
          description="Web Vitals bazlı"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="events">Olaylar</TabsTrigger>
          <TabsTrigger value="session">Oturum</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Performance Score Gauge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performans Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={getScoreColor(performanceScore)}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${performanceScore * 2.83} 283`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color: getScoreColor(performanceScore) }}>
                      {performanceScore}
                    </span>
                    <span className="text-sm text-gray-500">/ 100</span>
                  </div>
                </div>
              </div>
              
              {/* Page Load Times */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Sayfa Yükleme</p>
                  <p className="text-lg font-semibold">
                    {pagePerformance.loadTime ? formatDuration(pagePerformance.loadTime) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">DOM Hazır</p>
                  <p className="text-lg font-semibold">
                    {pagePerformance.domContentLoaded ? formatDuration(pagePerformance.domContentLoaded) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">İlk Boyama</p>
                  <p className="text-lg font-semibold">
                    {pagePerformance.firstPaint ? formatDuration(pagePerformance.firstPaint) : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">En Sık Etkileşimler</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topInteractions.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.topInteractions.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Henüz etkileşim yok</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">En Sık Hatalar</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.topErrors.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.topErrors.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                          {item.message}
                        </span>
                        <Badge variant="destructive">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-600 text-center py-4">✓ Hata yok</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Core Web Vitals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(webVitals).map(([name, metric]) => (
                  <WebVitalBadge
                    key={name}
                    name={name}
                    value={metric.value}
                    rating={metric.rating}
                  />
                ))}
                {Object.keys(webVitals).length === 0 && (
                  <p className="col-span-full text-center text-gray-500 py-8">
                    Web Vitals metrikleri toplanıyor...
                  </p>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Web Vitals Nedir?</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>LCP:</strong> En büyük içeriğin yüklenme süresi</li>
                  <li>• <strong>FID:</strong> İlk kullanıcı etkileşimine yanıt süresi</li>
                  <li>• <strong>CLS:</strong> Görsel kararlılık (layout kaymaları)</li>
                  <li>• <strong>FCP:</strong> İlk içeriğin görünme süresi</li>
                  <li>• <strong>INP:</strong> Genel etkileşim yanıt süresi</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Son Olaylar
                </span>
                <Badge variant="outline">{events.length} olay</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {recentEvents.length > 0 ? (
                  <div className="space-y-1">
                    {recentEvents.map((event) => (
                      <EventListItem
                        key={event.id}
                        type={event.type}
                        timestamp={event.timestamp}
                        data={event.data}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Henüz olay kaydedilmedi</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Oturum Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {session ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500">Oturum ID</p>
                      <p className="font-mono text-sm truncate">{session.id}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500">Başlangıç</p>
                      <p className="text-sm">{new Date(session.startTime).toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500">Süre</p>
                      <p className="text-sm">{formatDuration(session.duration)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500">Son Aktivite</p>
                      <p className="text-sm">{new Date(session.lastActivity).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Oturum İstatistikleri</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Sayfa Görüntüleme</span>
                        <span className="font-medium">{session.pageViews}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Etkileşimler</span>
                        <span className="font-medium">{session.interactions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Hatalar</span>
                        <span className={`font-medium ${session.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {session.errors}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Cihaz Bilgileri</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        {window.innerWidth < 768 ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <Monitor className="w-4 h-4" />
                        )}
                        {window.innerWidth}x{window.innerHeight}
                      </div>
                      <div className="flex items-center gap-1">
                        <Wifi className="w-4 h-4" />
                        {(navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'Bilinmiyor'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-8">Oturum bilgisi yükleniyor...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RUMDashboard;
