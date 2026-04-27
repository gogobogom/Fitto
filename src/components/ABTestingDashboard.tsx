'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  useABTestingManager,
  useSimpleABTest,
} from '@/hooks/useABTesting';
import { StatisticalAnalysis, type Experiment, type Variant } from '@/lib/abTesting';
import {
  FlaskConical,
  Users,
  TrendingUp,
  Target,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Check,
  X,
  BarChart3,
  Percent,
} from 'lucide-react';

// Demo experiments
const DEMO_EXPERIMENTS = [
  {
    id: 'cta_button_color',
    name: 'CTA Buton Rengi',
    description: 'Ana sayfa CTA butonunun renk testi',
    variants: [
      { id: 'control', name: 'Mavi (Kontrol)', weight: 50, isControl: true, config: { color: 'blue' } },
      { id: 'green', name: 'Yeşil', weight: 50, config: { color: 'green' } },
    ],
  },
  {
    id: 'onboarding_flow',
    name: 'Onboarding Akışı',
    description: 'Yeni kullanıcı onboarding deneyimi',
    variants: [
      { id: 'control', name: '3 Adım (Kontrol)', weight: 33, isControl: true, config: { steps: 3 } },
      { id: 'short', name: '2 Adım', weight: 33, config: { steps: 2 } },
      { id: 'long', name: '5 Adım', weight: 34, config: { steps: 5 } },
    ],
  },
  {
    id: 'pricing_display',
    name: 'Fiyat Gösterimi',
    description: 'Premium özelliklerin fiyat gösterim şekli',
    variants: [
      { id: 'control', name: 'Aylık (Kontrol)', weight: 50, isControl: true, config: { display: 'monthly' } },
      { id: 'yearly', name: 'Yıllık', weight: 50, config: { display: 'yearly' } },
    ],
  },
];

// Simulated results for demo
const DEMO_RESULTS: Record<string, { conversions: number; visitors: number }> = {
  'cta_button_color_control': { conversions: 234, visitors: 1200 },
  'cta_button_color_green': { conversions: 289, visitors: 1180 },
  'onboarding_flow_control': { conversions: 156, visitors: 800 },
  'onboarding_flow_short': { conversions: 189, visitors: 810 },
  'onboarding_flow_long': { conversions: 134, visitors: 790 },
  'pricing_display_control': { conversions: 45, visitors: 500 },
  'pricing_display_yearly': { conversions: 62, visitors: 520 },
};

interface VariantResultDisplayProps {
  experimentId: string;
  variant: Variant;
  isControl: boolean;
  controlRate?: number;
}

function VariantResultDisplay({ experimentId, variant, isControl, controlRate }: VariantResultDisplayProps): React.ReactElement {
  const key = `${experimentId}_${variant.id}`;
  const data = DEMO_RESULTS[key] || { conversions: 0, visitors: 0 };
  const rate = StatisticalAnalysis.conversionRate(data.conversions, data.visitors);
  const ci = StatisticalAnalysis.confidenceInterval(rate, data.visitors);
  const improvement = controlRate ? StatisticalAnalysis.improvement(controlRate, rate) : 0;

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{variant.name}</span>
        {isControl && <Badge variant="outline">Kontrol</Badge>}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Dönüşüm Oranı</span>
          <span className="font-mono font-medium">{(rate * 100).toFixed(2)}%</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Ziyaretçi</span>
          <span className="font-mono">{data.visitors.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Dönüşüm</span>
          <span className="font-mono">{data.conversions.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Güven Aralığı</span>
          <span className="font-mono text-xs">
            [{(ci[0] * 100).toFixed(1)}% - {(ci[1] * 100).toFixed(1)}%]
          </span>
        </div>
        
        {!isControl && controlRate !== undefined && (
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-gray-600 dark:text-gray-400">İyileşme</span>
            <span className={`font-mono font-medium ${improvement > 0 ? 'text-green-600' : improvement < 0 ? 'text-red-600' : ''}`}>
              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ExperimentCardProps {
  experiment: typeof DEMO_EXPERIMENTS[0];
  isExpanded: boolean;
  onToggle: () => void;
}

function ExperimentCard({ experiment, isExpanded, onToggle }: ExperimentCardProps): React.ReactElement {
  const controlVariant = experiment.variants.find(v => v.isControl);
  const controlKey = `${experiment.id}_${controlVariant?.id}`;
  const controlData = DEMO_RESULTS[controlKey] || { conversions: 0, visitors: 0 };
  const controlRate = StatisticalAnalysis.conversionRate(controlData.conversions, controlData.visitors);

  // Find best performing variant
  let bestVariant = controlVariant;
  let bestRate = controlRate;
  
  experiment.variants.forEach(v => {
    const key = `${experiment.id}_${v.id}`;
    const data = DEMO_RESULTS[key] || { conversions: 0, visitors: 0 };
    const rate = StatisticalAnalysis.conversionRate(data.conversions, data.visitors);
    if (rate > bestRate) {
      bestRate = rate;
      bestVariant = v;
    }
  });

  const isStatisticallySignificant = bestVariant && bestVariant.id !== controlVariant?.id;

  return (
    <Card className="mb-4">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{experiment.name}</CardTitle>
              <CardDescription>{experiment.description}</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-green-500">Aktif</Badge>
            {isStatisticallySignificant && (
              <Badge variant="outline" className="border-green-500 text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                Kazanan Var
              </Badge>
            )}
            <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {experiment.variants.map(variant => (
              <VariantResultDisplay
                key={variant.id}
                experimentId={experiment.id}
                variant={variant}
                isControl={variant.isControl ?? false}
                controlRate={variant.isControl ? undefined : controlRate}
              />
            ))}
          </div>
          
          {isStatisticallySignificant && bestVariant && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Check className="w-5 h-5" />
                <span className="font-medium">
                  &quot;{bestVariant.name}&quot; varyantı istatistiksel olarak anlamlı bir iyileşme gösteriyor
                </span>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Duraklat
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Detaylı Rapor
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function DemoABTestWidget(): React.ReactElement {
  const { isControl, isTreatment, variant, trackConversion } = useSimpleABTest('demo_button_test');
  const [clicked, setClicked] = useState(false);

  const handleClick = (): void => {
    setClicked(true);
    trackConversion(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Canlı A/B Test Demosu</CardTitle>
        <CardDescription>
          Bu buton gerçek zamanlı A/B test altında. Tıklama bir dönüşüm olarak kaydedilir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Varyant: {variant || 'Yükleniyor...'}
            </Badge>
            {isControl && <span className="text-sm text-gray-500">(Kontrol grubu)</span>}
            {isTreatment && <span className="text-sm text-gray-500">(Test grubu)</span>}
          </div>
          
          <Button
            onClick={handleClick}
            disabled={clicked}
            className={`w-full ${isTreatment ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            {clicked ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Dönüşüm Kaydedildi!
              </>
            ) : (
              'Dönüşüm İçin Tıkla'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ABTestingDashboard(): React.ReactElement {
  const { experiments, assignments, resetAssignments } = useABTestingManager();
  const [expandedExperiment, setExpandedExperiment] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeExperiments: DEMO_EXPERIMENTS.length,
    totalVariants: DEMO_EXPERIMENTS.reduce((sum, e) => sum + e.variants.length, 0),
    totalVisitors: Object.values(DEMO_RESULTS).reduce((sum, d) => sum + d.visitors, 0),
    avgConversionRate: 0,
  });

  useEffect(() => {
    // Calculate average conversion rate
    const rates = Object.values(DEMO_RESULTS).map(d => 
      StatisticalAnalysis.conversionRate(d.conversions, d.visitors)
    );
    const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    setStats(prev => ({ ...prev, avgConversionRate: avgRate * 100 }));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">A/B Test Yönetimi</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Deneyler oluşturun, varyantları yönetin ve sonuçları analiz edin
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetAssignments}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Atamaları Sıfırla
          </Button>
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Yeni Deney
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FlaskConical className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktif Deneyler</p>
                <p className="text-2xl font-bold">{stats.activeExperiments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Varyant</p>
                <p className="text-2xl font-bold">{stats.totalVariants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Ziyaretçi</p>
                <p className="text-2xl font-bold">{stats.totalVisitors.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Percent className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ort. Dönüşüm</p>
                <p className="text-2xl font-bold">{stats.avgConversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="experiments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="experiments">Deneyler</TabsTrigger>
          <TabsTrigger value="demo">Canlı Demo</TabsTrigger>
          <TabsTrigger value="assignments">Atamalarım</TabsTrigger>
        </TabsList>

        <TabsContent value="experiments" className="space-y-4">
          {DEMO_EXPERIMENTS.map(experiment => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              isExpanded={expandedExperiment === experiment.id}
              onToggle={() => setExpandedExperiment(
                expandedExperiment === experiment.id ? null : experiment.id
              )}
            />
          ))}
        </TabsContent>

        <TabsContent value="demo">
          <div className="grid gap-4 md:grid-cols-2">
            <DemoABTestWidget />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nasıl Çalışır?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                  <div>
                    <p className="font-medium">Varyant Atama</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Her kullanıcı otomatik olarak bir varyanta atanır
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 font-bold">2</div>
                  <div>
                    <p className="font-medium">Tutarlı Deneyim</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Aynı kullanıcı her zaman aynı varyantı görür
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 font-bold">3</div>
                  <div>
                    <p className="font-medium">Dönüşüm Takibi</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Her etkileşim otomatik olarak kaydedilir
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-orange-600 font-bold">4</div>
                  <div>
                    <p className="font-medium">İstatistiksel Analiz</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sonuçlar istatistiksel anlamlılık için analiz edilir
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Mevcut Atamalarınız</CardTitle>
              <CardDescription>
                Bu cihazda size atanan deney varyantları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Henüz bir deneye dahil olmadınız
                </p>
              ) : (
                <div className="space-y-3">
                  {assignments.map(assignment => (
                    <div
                      key={assignment.experimentId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{assignment.experimentId}</p>
                        <p className="text-sm text-gray-500">
                          Varyant: {assignment.variantId}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(assignment.assignedAt).toLocaleDateString('tr-TR')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
