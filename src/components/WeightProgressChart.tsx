'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Line, ComposedChart } from 'recharts';
import { TrendingDown, TrendingUp, Target, Calendar, Minus } from 'lucide-react';
import { doodleCharacters } from '@/lib/doodleAssets';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeightProgressChartProps {
  userId: string;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface ChartDataPoint {
  date: string;
  kilo: number;
  fullDate: Date;
}

export function WeightProgressChart({ userId }: WeightProgressChartProps) {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [showGoalLine, setShowGoalLine] = useState<boolean>(true);

  // TODO: Implement body measurements with Supabase
  const goalWeight = null;
  const allWeightData: ChartDataPoint[] = [];

  const weightData: ChartDataPoint[] = [];

  const hasData = false;

  return (
    <div className="space-y-4">
      {/* Main Chart Card */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <img 
                src={doodleCharacters.scale} 
                alt="Terazi" 
                className="w-8 h-8 object-contain"
              />
              <span>{t('stats.weightTracking')}</span>
            </CardTitle>
            
            {/* Time Range Selector */}
            <div className="flex gap-1 bg-white rounded-lg p-1 border">
              <Button
                size="sm"
                variant={timeRange === '7d' ? 'default' : 'ghost'}
                onClick={() => setTimeRange('7d')}
                className="h-7 text-xs"
              >
                {t('stats.timeRange7d')}
              </Button>
              <Button
                size="sm"
                variant={timeRange === '30d' ? 'default' : 'ghost'}
                onClick={() => setTimeRange('30d')}
                className="h-7 text-xs"
              >
                {t('stats.timeRange30d')}
              </Button>
              <Button
                size="sm"
                variant={timeRange === '90d' ? 'default' : 'ghost'}
                onClick={() => setTimeRange('90d')}
                className="h-7 text-xs"
              >
                {t('stats.timeRange90d')}
              </Button>
              <Button
                size="sm"
                variant={timeRange === 'all' ? 'default' : 'ghost'}
                onClick={() => setTimeRange('all')}
                className="h-7 text-xs"
              >
                {t('stats.timeRangeAll')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {hasData ? (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Current Weight */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2">
                  <p className="text-xs text-gray-600 mb-1">{t('stats.current')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.currentWeight.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">{t('stats.kg')}</p>
                </div>

                {/* Total Change */}
                <div className={`rounded-xl p-4 border-2 ${stats.totalChange < 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-orange-50 to-red-50'}`}>
                  <p className="text-xs text-gray-600 mb-1">{t('stats.change')}</p>
                  <div className="flex items-center gap-1">
                    {stats.totalChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : stats.totalChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-600" />
                    )}
                    <p className={`text-2xl font-bold ${stats.totalChange < 0 ? 'text-green-600' : stats.totalChange > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">{t('stats.kg')}</p>
                </div>

                {/* Weekly Average */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2">
                  <p className="text-xs text-gray-600 mb-1">{t('stats.weeklyAvg')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageWeeklyChange > 0 ? '+' : ''}{stats.averageWeeklyChange.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">{t('stats.kgWeek')}</p>
                </div>

                {/* Goal Progress */}
                {goalWeight && (
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border-2">
                    <p className="text-xs text-gray-600 mb-1">{t('stats.toGoal')}</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.abs(stats.goalRemaining).toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{t('stats.kg')} {t('stats.remaining')}</p>
                  </div>
                )}
              </div>

              {/* Goal Toggle */}
              {goalWeight && (
                <div className="flex items-center justify-between bg-amber-50 rounded-lg p-3 border">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-medium">{t('stats.showGoalLine')}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={showGoalLine ? 'default' : 'outline'}
                    onClick={() => setShowGoalLine(!showGoalLine)}
                    className="h-8"
                  >
                    {showGoalLine ? t('stats.open') : t('stats.closed')}
                  </Button>
                </div>
              )}

              {/* Chart */}
              <div className="bg-white rounded-xl p-4 border-2">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={weightData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      stroke="#888"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      stroke="#888"
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '14px',
                        padding: '8px 12px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)} ${t('stats.kg')}`, t('stats.weightTracking')]}
                    />
                    
                    {/* Goal Line */}
                    {goalWeight && showGoalLine && (
                      <ReferenceLine 
                        y={goalWeight} 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{ 
                          value: `${t('stats.target')}: ${goalWeight} ${t('stats.kg')}`, 
                          position: 'right',
                          fill: '#f59e0b',
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
                      />
                    )}
                    
                    <Area 
                      type="monotone" 
                      dataKey="kilo" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fill="url(#colorWeight)"
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#8b5cf6' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Motivational Message */}
              <div className={`rounded-xl p-4 border-2 flex items-center gap-3 ${stats.trend === 'down' ? 'bg-gradient-to-r from-green-50 to-emerald-50' : stats.trend === 'up' ? 'bg-gradient-to-r from-orange-50 to-red-50' : 'bg-gradient-to-r from-blue-50 to-cyan-50'}`}>
                <img 
                  src={stats.trend === 'down' ? doodleCharacters.celebration : stats.trend === 'up' ? doodleCharacters.dumbbell : doodleCharacters.heart} 
                  alt="Karakter" 
                  className="w-12 h-12 object-contain"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {stats.trend === 'down' && t('stats.doingGreat')}
                    {stats.trend === 'up' && t('stats.keepGoing')}
                    {stats.trend === 'stable' && t('stats.goodBalance')}
                  </p>
                  <p className="text-sm text-gray-600">
                    {stats.trend === 'down' && `${Math.abs(stats.totalChange).toFixed(1)} ${t('stats.youLost')}`}
                    {stats.trend === 'up' && t('stats.focusOnGoal')}
                    {stats.trend === 'stable' && t('stats.maintainingWeight')}
                  </p>
                </div>
              </div>

              {/* Progress to Goal */}
              {goalWeight && stats.goalProgress > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{t('stats.goalProgress')}</span>
                    <span className="text-sm font-bold text-amber-600">{stats.goalProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 border-2">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, stats.goalProgress)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-center p-6">
              <img 
                src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/fd4bc04d-0202-4e5d-94dc-3d01b1ae19ce-4lVuGy6sYo1wUoVJF8rId5VFX4X1RI" 
                alt="Terazi" 
                className="w-32 h-32 object-contain mb-4 animate-bounce"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('stats.noWeightData')}</h3>
              <p className="text-sm text-gray-600 max-w-md mb-4">
                {t('stats.noWeightDataDesc')}
              </p>
              <div className="flex gap-2 text-xs text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{t('stats.trackRegularly')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Card - Only show if there's data */}
      {hasData && weightData.length >= 3 && (
        <Card className="border-2 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <img 
                src={doodleCharacters.chart} 
                alt="Grafik" 
                className="w-6 h-6 object-contain"
              />
              {t('stats.analysis')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
              <p className="text-sm text-gray-700">
                <strong>{t('stats.startingWeight')}:</strong> {stats.startWeight.toFixed(1)} {t('stats.kg')}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
              <p className="text-sm text-gray-700">
                <strong>{t('stats.totalChange')}:</strong> {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)} {t('stats.kg')} ({stats.changePercentage.toFixed(1)}%)
              </p>
            </div>
            {goalWeight && (
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                <p className="text-sm text-gray-700">
                  <strong>{t('stats.targetWeight')}:</strong> {goalWeight} {t('stats.kg')}
                </p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
              <p className="text-sm text-gray-700">
                <strong>{t('stats.dataPoints')}:</strong> {weightData.length} {t('stats.measurements')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
