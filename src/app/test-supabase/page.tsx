'use client';

import { useSupabase } from '@/hooks/useSupabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function TestSupabasePage() {
  const {
    connected,
    userId,
    statusMessage,
    userProfile,
    userGoals,
    foodItems,
    dailyLogs,
    exerciseLogs,
    dailySummary,
  } = useSupabase();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Bağlantı Testi</CardTitle>
            <CardDescription>useSupabase hook paralel test ortamı</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Durum:</span>
              <Badge variant={connected ? 'default' : 'destructive'}>
                {connected ? 'Bağlı' : 'Bağlantı Kesildi'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Mesaj:</span>
              <span className="text-sm text-muted-foreground">{statusMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Kullanıcı ID:</span>
              <span className="text-sm font-mono">{userId || 'Yükleniyor...'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Profili</CardTitle>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : userProfile ? (
              <div className="space-y-2">
                <p>
                  <strong>Kullanıcı Adı:</strong> {userProfile.username || userProfile.full_name || '—'}
                </p>
                <p>
                  <strong>Yaş:</strong> {userProfile.age ?? '—'}
                </p>
                <p>
                  <strong>Cinsiyet:</strong> {userProfile.gender ?? '—'}
                </p>
                <p>
                  <strong>Kilo:</strong>{' '}
                  {userProfile.weight_kg != null ? `${userProfile.weight_kg} kg` : '—'}
                </p>
                <p>
                  <strong>Boy:</strong>{' '}
                  {userProfile.height_cm != null ? `${userProfile.height_cm} cm` : '—'}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Profil bulunamadı</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanıcı Hedefleri</CardTitle>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <Skeleton className="h-4 w-full" />
            ) : userGoals ? (
              <div className="space-y-2">
                <p>
                  <strong>Hedef:</strong> {userGoals.goal_type ?? '—'}
                </p>
                <p>
                  <strong>Günlük Kalori:</strong>{' '}
                  {userGoals.daily_calorie_target ?? '—'} kcal
                </p>
                <p>
                  <strong>Protein:</strong> {userGoals.protein_target_g ?? '—'} g
                </p>
                <p>
                  <strong>Karbonhidrat:</strong> {userGoals.carbs_target_g ?? '—'} g
                </p>
                <p>
                  <strong>Yağ:</strong> {userGoals.fat_target_g ?? '—'} g
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Hedefler bulunamadı</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Günlük Özet</CardTitle>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <Skeleton className="h-4 w-full" />
            ) : dailySummary ? (
              <div className="space-y-2">
                <p>
                  <strong>Tarih:</strong> {dailySummary.date}
                </p>
                <p>
                  <strong>Toplam Kalori:</strong> {dailySummary.total_calories} kcal
                </p>
                <p>
                  <strong>Toplam Protein:</strong> {dailySummary.total_protein} g
                </p>
                <p>
                  <strong>Toplam Karbonhidrat:</strong> {dailySummary.total_carbs} g
                </p>
                <p>
                  <strong>Toplam Yağ:</strong> {dailySummary.total_fats} g
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Bugün için özet yok</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Veri İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Yiyecekler</p>
                <p className="text-2xl font-bold">{foodItems.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Günlük Kayıtlar</p>
                <p className="text-2xl font-bold">{dailyLogs.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Egzersiz Kayıtları</p>
                <p className="text-2xl font-bold">{exerciseLogs.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
