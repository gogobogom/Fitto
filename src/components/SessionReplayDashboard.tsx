'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  useSessionReplay,
  useRageClickDetection,
  useDeadClickDetection,
} from '@/hooks/useSessionReplay';
import {
  Video,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Eye,
  MousePointer,
  Clock,
  Users,
  AlertTriangle,
  Smartphone,
  Monitor,
  Activity,
  Maximize2,
  Download,
  Trash2,
  RefreshCw,
} from 'lucide-react';

// Demo session data
const DEMO_SESSIONS = [
  {
    sessionId: 'session_001',
    userId: 'user_abc123',
    startTime: new Date(Date.now() - 3600000),
    duration: 245000,
    eventCount: 156,
    metadata: {
      url: '/dashboard',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
      screenWidth: 390,
      screenHeight: 844,
    },
  },
  {
    sessionId: 'session_002',
    userId: 'user_def456',
    startTime: new Date(Date.now() - 7200000),
    duration: 489000,
    eventCount: 324,
    metadata: {
      url: '/nutrition',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome',
      screenWidth: 1920,
      screenHeight: 1080,
    },
  },
  {
    sessionId: 'session_003',
    userId: 'user_ghi789',
    startTime: new Date(Date.now() - 10800000),
    duration: 178000,
    eventCount: 89,
    metadata: {
      url: '/tarifler',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari',
      screenWidth: 1440,
      screenHeight: 900,
    },
  },
];

// Demo heatmap data
const DEMO_HEATMAP = [
  { x: 150, y: 100, count: 45 },
  { x: 300, y: 150, count: 32 },
  { x: 200, y: 300, count: 28 },
  { x: 350, y: 200, count: 56 },
  { x: 100, y: 400, count: 18 },
  { x: 400, y: 350, count: 23 },
  { x: 250, y: 250, count: 67 },
  { x: 180, y: 180, count: 41 },
];

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getDeviceIcon(userAgent: string): React.ReactElement {
  if (userAgent.includes('iPhone') || userAgent.includes('Android')) {
    return <Smartphone className="w-4 h-4" />;
  }
  return <Monitor className="w-4 h-4" />;
}

interface SessionCardProps {
  session: typeof DEMO_SESSIONS[0];
  onView: () => void;
}

function SessionCard({ session, onView }: SessionCardProps): React.ReactElement {
  return (
    <Card className="hover:border-blue-500 transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getDeviceIcon(session.metadata.userAgent)}
            <span className="font-medium text-sm">
              {session.metadata.screenWidth}x{session.metadata.screenHeight}
            </span>
          </div>
          <Badge variant="outline">
            {formatDuration(session.duration)}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Eye className="w-4 h-4" />
            <span>{session.metadata.url}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Activity className="w-4 h-4" />
            <span>{session.eventCount} olay</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{new Date(session.startTime).toLocaleString('tr-TR')}</span>
          </div>
        </div>
        
        <Button variant="outline" size="sm" className="w-full mt-3">
          <Play className="w-4 h-4 mr-2" />
          İzle
        </Button>
      </CardContent>
    </Card>
  );
}

interface HeatmapDisplayProps {
  data: typeof DEMO_HEATMAP;
}

function HeatmapDisplay({ data }: HeatmapDisplayProps): React.ReactElement {
  const maxCount = Math.max(...data.map(d => d.count));
  
  return (
    <div className="relative w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full border-t border-gray-500"
            style={{ top: `${i * 10}%` }}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full border-l border-gray-500"
            style={{ left: `${i * 10}%` }}
          />
        ))}
      </div>
      
      {/* Heatmap points */}
      {data.map((point, index) => {
        const intensity = point.count / maxCount;
        const size = 30 + intensity * 70;
        const color = `rgba(239, 68, 68, ${0.3 + intensity * 0.5})`;
        
        return (
          <div
            key={index}
            className="absolute rounded-full blur-xl"
            style={{
              left: point.x,
              top: point.y,
              width: size,
              height: size,
              backgroundColor: color,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
      
      {/* Click markers */}
      {data.map((point, index) => (
        <div
          key={`marker-${index}`}
          className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"
          style={{
            left: point.x,
            top: point.y,
            transform: 'translate(-50%, -50%)',
          }}
          title={`${point.count} tıklama`}
        />
      ))}
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-full bg-red-300" />
          <span>Düşük</span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Orta</span>
          <div className="w-3 h-3 rounded-full bg-red-700" />
          <span>Yüksek</span>
        </div>
      </div>
    </div>
  );
}

function ReplayPlayer(): React.ReactElement {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return prev + (0.5 * speed);
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Oturum Oynatıcı</CardTitle>
            <CardDescription>session_001 - Dashboard sayfası</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview area */}
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-white/50">
            <div className="text-center">
              <Video className="w-16 h-16 mx-auto mb-2" />
              <p>Oturum önizlemesi</p>
            </div>
          </div>
          
          {/* Simulated cursor */}
          <div
            className="absolute w-4 h-4 transition-all duration-100"
            style={{
              left: `${30 + Math.sin(progress / 10) * 20}%`,
              top: `${40 + Math.cos(progress / 10) * 15}%`,
            }}
          >
            <MousePointer className="w-4 h-4 text-white drop-shadow-lg" />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatDuration((progress / 100) * 245000)}</span>
            <span>{formatDuration(245000)}</span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setProgress(Math.max(0, progress - 10))}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              variant={isPlaying ? 'default' : 'outline'}
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setProgress(Math.min(100, progress + 10))}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Hız:</span>
            <div className="flex gap-1">
              {[0.5, 1, 2, 4].map(s => (
                <Button
                  key={s}
                  variant={speed === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecordingStatus(): React.ReactElement {
  const { isRecording, sessionId, stats } = useSessionReplay();
  
  // Detect rage clicks
  useRageClickDetection(3, 500, (element) => {
    console.log('Rage click detected on:', element);
  });
  
  // Detect dead clicks
  useDeadClickDetection((element) => {
    console.log('Dead click detected on:', element);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kayıt Durumu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="font-medium">
              {isRecording ? 'Kayıt Yapılıyor' : 'Kayıt Pasif'}
            </span>
          </div>
          {sessionId && (
            <Badge variant="outline" className="font-mono text-xs">
              {sessionId.slice(0, 8)}...
            </Badge>
          )}
        </div>
        
        {isRecording && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats.eventCount}</p>
              <p className="text-xs text-gray-500">Olay</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatDuration(stats.duration)}</p>
              <p className="text-xs text-gray-500">Süre</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.snapshotCount}</p>
              <p className="text-xs text-gray-500">Anlık Görüntü</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SessionReplayDashboard(): React.ReactElement {
  const [sessions, setSessions] = useState(DEMO_SESSIONS);
  const [stats, setStats] = useState({
    totalSessions: DEMO_SESSIONS.length,
    uniqueUsers: new Set(DEMO_SESSIONS.map(s => s.userId)).size,
    avgDuration: DEMO_SESSIONS.reduce((sum, s) => sum + s.duration, 0) / DEMO_SESSIONS.length,
    avgEventCount: DEMO_SESSIONS.reduce((sum, s) => sum + s.eventCount, 0) / DEMO_SESSIONS.length,
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Oturum Kayıtları</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kullanıcı oturumlarını izleyin ve analiz edin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Tümünü Sil
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Oturum</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tekil Kullanıcı</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ort. Süre</p>
                <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ort. Olay</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgEventCount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Oturumlar</TabsTrigger>
          <TabsTrigger value="player">Oynatıcı</TabsTrigger>
          <TabsTrigger value="heatmap">Isı Haritası</TabsTrigger>
          <TabsTrigger value="live">Canlı Kayıt</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map(session => (
              <SessionCard
                key={session.sessionId}
                session={session}
                onView={() => console.log('View session:', session.sessionId)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="player">
          <ReplayPlayer />
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Tıklama Isı Haritası</CardTitle>
              <CardDescription>
                Kullanıcıların en çok tıkladığı alanları görselleştirir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapDisplay data={DEMO_HEATMAP} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live">
          <div className="grid gap-4 md:grid-cols-2">
            <RecordingStatus />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Algılanan Sorunlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">Rage Click Algılandı</p>
                    <p className="text-xs text-gray-500">.submit-button - 5 dakika önce</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-sm">Dead Click Algılandı</p>
                    <p className="text-xs text-gray-500">.disabled-btn - 12 dakika önce</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
