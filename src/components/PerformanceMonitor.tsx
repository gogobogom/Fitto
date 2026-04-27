'use client';

import React, { useState, useEffect } from 'react';
import { useWebVitals, useNetworkQuality, useDeviceCapabilities } from '@/hooks/useWebVitals';
import { useMemoryMonitor, formatBytes } from '@/hooks/useMemoryMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, Cpu, Trash2, RefreshCw, X, ChevronDown, ChevronUp, HardDrive } from 'lucide-react';

interface PerformanceMonitorProps {
  /** Show in development only */
  devOnly?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * Performance Monitor Widget
 * Shows Web Vitals, network quality, and device info
 */
export function PerformanceMonitor({ 
  devOnly = true, 
  defaultCollapsed = true 
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { summary, refreshSummary, clearMetrics, isInitialized } = useWebVitals();
  const networkQuality = useNetworkQuality();
  const deviceCapabilities = useDeviceCapabilities();
  const { memory, warning: memoryWarning, isSupported: memorySupported, clearCaches, getMemoryTrend } = useMemoryMonitor();
  
  // Only show in development if devOnly is true
  useEffect(() => {
    if (devOnly && process.env.NODE_ENV !== 'development') {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [devOnly]);
  
  if (!isVisible) return null;
  
  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getRatingText = (rating: string): string => {
    switch (rating) {
      case 'good': return 'İyi';
      case 'needs-improvement': return 'Geliştirilebilir';
      case 'poor': return 'Kötü';
      default: return 'Bilinmiyor';
    }
  };
  
  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-xs">
      <Card className="shadow-lg border-2 bg-background/95 backdrop-blur">
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Performans
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsVisible(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {!isCollapsed && (
          <CardContent className="py-2 px-3 space-y-3">
            {/* Web Vitals */}
            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Web Vitals</h4>
              {!isInitialized ? (
                <p className="text-xs text-muted-foreground">Yükleniyor...</p>
              ) : Object.keys(summary).length === 0 ? (
                <p className="text-xs text-muted-foreground">Henüz veri yok</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(summary).map(([name, data]) => (
                    <div key={name} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{name}</span>
                      <div className="flex items-center gap-2">
                        <span>{data.avg.toFixed(0)}ms</span>
                        <Badge 
                          variant="secondary" 
                          className={`${getRatingColor(data.rating)} text-white text-xs px-1 py-0`}
                        >
                          {getRatingText(data.rating)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Network Quality */}
            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Ağ Kalitesi
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Bağlantı Tipi</span>
                  <span className="font-medium">{networkQuality.type || 'Bilinmiyor'}</span>
                </div>
                {networkQuality.downlink !== undefined && (
                  <div className="flex justify-between">
                    <span>Hız</span>
                    <span className="font-medium">{networkQuality.downlink} Mbps</span>
                  </div>
                )}
                {networkQuality.rtt !== undefined && (
                  <div className="flex justify-between">
                    <span>Gecikme</span>
                    <span className="font-medium">{networkQuality.rtt}ms</span>
                  </div>
                )}
                {networkQuality.isSlowConnection && (
                  <Badge variant="destructive" className="text-xs">
                    Yavaş Bağlantı
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Device Capabilities */}
            <div>
              <h4 className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                Cihaz
              </h4>
              <div className="space-y-1 text-xs">
                {deviceCapabilities.memory !== undefined && (
                  <div className="flex justify-between">
                    <span>Bellek</span>
                    <span className="font-medium">{deviceCapabilities.memory} GB</span>
                  </div>
                )}
                {deviceCapabilities.cores !== undefined && (
                  <div className="flex justify-between">
                    <span>İşlemci Çekirdekleri</span>
                    <span className="font-medium">{deviceCapabilities.cores}</span>
                  </div>
                )}
                {deviceCapabilities.isLowEndDevice && (
                  <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
                    Düşük Kapasiteli Cihaz
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Memory Usage */}
            {memorySupported && (
              <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Bellek Kullanımı
                </h4>
                <div className="space-y-1 text-xs">
                  {memory.usedJSHeapSize !== undefined && (
                    <div className="flex justify-between">
                      <span>Kullanılan</span>
                      <span className="font-medium">{formatBytes(memory.usedJSHeapSize)}</span>
                    </div>
                  )}
                  {memory.jsHeapSizeLimit !== undefined && (
                    <div className="flex justify-between">
                      <span>Limit</span>
                      <span className="font-medium">{formatBytes(memory.jsHeapSizeLimit)}</span>
                    </div>
                  )}
                  {memory.usagePercent !== undefined && (
                    <div className="flex justify-between">
                      <span>Kullanım</span>
                      <span className="font-medium">{(memory.usagePercent * 100).toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Trend</span>
                    <span className={`font-medium ${
                      getMemoryTrend() === 'increasing' ? 'text-red-500' :
                      getMemoryTrend() === 'decreasing' ? 'text-green-500' : 'text-gray-500'
                    }`}>
                      {getMemoryTrend() === 'increasing' ? '↑ Artıyor' :
                       getMemoryTrend() === 'decreasing' ? '↓ Azalıyor' : '→ Stabil'}
                    </span>
                  </div>
                  {memoryWarning && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs text-white ${
                        memoryWarning.level === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                    >
                      {memoryWarning.level === 'critical' ? 'Kritik!' : 'Uyarı'}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs min-w-[80px]"
                onClick={refreshSummary}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Yenile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs min-w-[80px]"
                onClick={clearMetrics}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Temizle
              </Button>
              {memorySupported && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs min-w-[80px]"
                  onClick={clearCaches}
                >
                  <HardDrive className="h-3 w-3 mr-1" />
                  Önbellek
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/**
 * Floating performance indicator (minimal)
 */
export function PerformanceIndicator() {
  const { summary } = useWebVitals();
  const [worstRating, setWorstRating] = useState<'good' | 'needs-improvement' | 'poor'>('good');
  
  useEffect(() => {
    const ratings = Object.values(summary).map(m => m.rating);
    
    if (ratings.includes('poor')) {
      setWorstRating('poor');
    } else if (ratings.includes('needs-improvement')) {
      setWorstRating('needs-improvement');
    } else {
      setWorstRating('good');
    }
  }, [summary]);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  const colors = {
    good: 'bg-green-500',
    'needs-improvement': 'bg-yellow-500',
    poor: 'bg-red-500',
  };
  
  return (
    <div 
      className={`fixed bottom-24 right-4 z-50 w-3 h-3 rounded-full ${colors[worstRating]} 
        animate-pulse shadow-lg cursor-pointer`}
      title={`Performans: ${worstRating}`}
    />
  );
}

export default PerformanceMonitor;
