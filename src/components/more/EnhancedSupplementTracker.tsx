'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Pill, Check, X, Clock, TrendingUp, Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { DoodleImage } from '../DoodleImage';
import { Progress } from '../ui/progress';
import { DoodleHeader } from '../DoodleHeader';

interface EnhancedSupplementTrackerProps {
  onBack: () => void;
}

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  hour: number;
  minute: number;
  color: string;
}

interface SupplementLog {
  id: string;
  supplementId: string;
  date: string;
  taken: boolean;
}

const SUPPLEMENT_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-300',
  'bg-green-100 text-green-700 border-green-300',
  'bg-purple-100 text-purple-700 border-purple-300',
  'bg-pink-100 text-pink-700 border-pink-300',
  'bg-orange-100 text-orange-700 border-orange-300',
  'bg-cyan-100 text-cyan-700 border-cyan-300',
];

export default function EnhancedSupplementTracker({ onBack }: EnhancedSupplementTrackerProps) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [logs, setLogs] = useState<SupplementLog[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('today');

  const [newSupplement, setNewSupplement] = useState({
    name: '',
    dosage: '',
    hour: 8,
    minute: 0,
    color: SUPPLEMENT_COLORS[0],
  });

  useEffect(() => {
    const savedSups = localStorage.getItem('supplements');
    const savedLogs = localStorage.getItem('supplementLogs');
    if (savedSups) setSupplements(JSON.parse(savedSups));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  const handleAddSupplement = (): void => {
    if (!newSupplement.name.trim() || !newSupplement.dosage.trim()) return;

    if (editingId) {
      const updated = supplements.map((s) =>
        s.id === editingId ? { ...s, ...newSupplement } : s
      );
      setSupplements(updated);
      localStorage.setItem('supplements', JSON.stringify(updated));
      setEditingId(null);
    } else {
      const newSup: Supplement = {
        id: Date.now().toString(),
        name: newSupplement.name,
        dosage: newSupplement.dosage,
        hour: newSupplement.hour,
        minute: newSupplement.minute,
        color: newSupplement.color,
      };

      const updated = [...supplements, newSup];
      setSupplements(updated);
      localStorage.setItem('supplements', JSON.stringify(updated));
    }

    setNewSupplement({ name: '', dosage: '', hour: 8, minute: 0, color: SUPPLEMENT_COLORS[0] });
    setIsDialogOpen(false);
  };

  const handleEdit = (supplement: Supplement): void => {
    setEditingId(supplement.id);
    setNewSupplement({
      name: supplement.name,
      dosage: supplement.dosage,
      hour: supplement.hour,
      minute: supplement.minute,
      color: supplement.color,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string): void => {
    const updated = supplements.filter((s) => s.id !== id);
    setSupplements(updated);
    localStorage.setItem('supplements', JSON.stringify(updated));

    const updatedLogs = logs.filter((l) => l.supplementId !== id);
    setLogs(updatedLogs);
    localStorage.setItem('supplementLogs', JSON.stringify(updatedLogs));
  };

  const toggleSupplementLog = (supplementId: string, isTaken: boolean): void => {
    const today = new Date().toISOString().split('T')[0];
    const existing = logs.findIndex(
      (log: SupplementLog) => log.supplementId === supplementId && log.date === today
    );

    let updated: SupplementLog[];
    if (existing >= 0) {
      updated = logs.map((log: SupplementLog, i: number) =>
        i === existing ? { ...log, taken: isTaken } : log
      );
    } else {
      const newLog: SupplementLog = {
        id: Date.now().toString(),
        supplementId,
        date: today,
        taken: isTaken,
      };
      updated = [...logs, newLog];
    }

    setLogs(updated);
    localStorage.setItem('supplementLogs', JSON.stringify(updated));
  };

  const getTodayLog = (supplementId: string): SupplementLog | undefined => {
    const today = new Date().toISOString().split('T')[0];
    return logs.find(
      (log: SupplementLog) => log.supplementId === supplementId && log.date === today
    );
  };

  // Statistics
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((log) => log.date === today && log.taken);
  const todayCompletion = supplements.length > 0 
    ? Math.round((todayLogs.length / supplements.length) * 100)
    : 0;

  // Last 7 days stats
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const weeklyData = last7Days.map((date) => {
    const dayLogs = logs.filter((log) => log.date === date && log.taken);
    const total = supplements.length;
    const completed = dayLogs.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const [year, month, day] = date.split('-');
    return {
      date: `${day}/${month}`,
      percentage,
      completed,
      total,
    };
  });

  const weeklyAverage = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((sum, day) => sum + day.percentage, 0) / weeklyData.length)
    : 0;

  // Supplement history (last 30 days)
  const supplementHistory = supplements.map((supplement) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const taken = last30Days.filter((date) =>
      logs.some((log) => log.supplementId === supplement.id && log.date === date && log.taken)
    ).length;

    const completion = Math.round((taken / 30) * 100);

    return {
      ...supplement,
      completion,
      taken,
    };
  });

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title="Takviye Takibi" subtitle="Vitamin ve takviye yönetimi" emoji="💊" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Bugün</TabsTrigger>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="space-y-6">
          {/* Doodle Character */}
          <Card className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 relative">
                  <DoodleImage 
                    character={todayCompletion === 100 ? 'celebration' : todayCompletion >= 50 ? 'pill' : 'empty'}
                    alt="Takviye Durumu"
                    size="xl"
                    className="w-full h-full"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">
                    {todayCompletion === 100 ? '🎉 Harika!' : todayCompletion >= 50 ? '💪 Devam et!' : '🌱 Başlayalım!'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Bugün {todayLogs.length}/{supplements.length} takviye alındı
                  </p>
                </div>
                <Progress value={todayCompletion} className="w-full h-3" />
                <p className="text-lg font-semibold text-blue-600">%{todayCompletion}</p>
              </div>
            </CardContent>
          </Card>

          {/* Add Supplement Button */}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setNewSupplement({ name: '', dosage: '', hour: 8, minute: 0, color: SUPPLEMENT_COLORS[0] });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Takviye Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Takviye Düzenle' : 'Yeni Takviye'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sup-name">Takviye Adı</Label>
                  <Input
                    id="sup-name"
                    value={newSupplement.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewSupplement((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Örn: Vitamin D3"
                  />
                </div>

                <div>
                  <Label htmlFor="dosage">Doz</Label>
                  <Input
                    id="dosage"
                    value={newSupplement.dosage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewSupplement((prev) => ({ ...prev, dosage: e.target.value }))
                    }
                    placeholder="Örn: 1000 IU"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hour">Saat</Label>
                    <Input
                      id="hour"
                      type="number"
                      min="0"
                      max="23"
                      value={newSupplement.hour}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewSupplement((prev) => ({
                          ...prev,
                          hour: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="minute">Dakika</Label>
                    <Input
                      id="minute"
                      type="number"
                      min="0"
                      max="59"
                      value={newSupplement.minute}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewSupplement((prev) => ({
                          ...prev,
                          minute: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Renk</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {SUPPLEMENT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewSupplement((prev) => ({ ...prev, color }))}
                        className={`p-3 rounded-lg border-2 transition-all ${color} ${
                          newSupplement.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''
                        }`}
                      >
                        <Pill className="w-6 h-6 mx-auto" />
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleAddSupplement} className="w-full">
                  {editingId ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Supplements List */}
          <div className="grid gap-4">
            {supplements.map((supplement: Supplement) => {
              const todayLog = getTodayLog(supplement.id);
              const isTaken = todayLog?.taken || false;

              return (
                <Card key={supplement.id} className={`${supplement.color} border-2`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-white/50 rounded-full">
                          <Pill className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{supplement.name}</h3>
                          <p className="text-sm opacity-80">{supplement.dosage}</p>
                          <p className="text-xs opacity-70 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {String(supplement.hour).padStart(2, '0')}:
                            {String(supplement.minute).padStart(2, '0')}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(supplement)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(supplement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={isTaken ? 'default' : 'outline'}
                          onClick={() => toggleSupplementLog(supplement.id, !isTaken)}
                          className={isTaken ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {supplements.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <DoodleImage character="pill" alt="Henüz takviye yok" size="xl" className="w-full h-full" />
                  </div>
                  <p className="text-gray-500">Henüz takviye eklemediniz.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Yukarıdaki butona tıklayarak ekleyin
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Weekly Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{weeklyAverage}%</div>
                  <p className="text-sm text-gray-600 mt-1">Haftalık Ortalama</p>
                  <p className="text-xs text-gray-500 mt-1">Son 7 gün</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{todayCompletion}%</div>
                  <p className="text-sm text-gray-600 mt-1">Bugün</p>
                  <p className="text-xs text-gray-500 mt-1">{todayLogs.length}/{supplements.length} takviye</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Son 7 Gün
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyData.map((day) => (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day.date}</span>
                      <span className="text-gray-600">
                        {day.completed}/{day.total} (%{day.percentage})
                      </span>
                    </div>
                    <Progress value={day.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supplement Completion Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Son 30 Gün Tamamlanma Oranı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplementHistory.map((item) => (
                  <div key={item.id} className={`p-4 rounded-lg ${item.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-xs opacity-70">{item.dosage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{item.completion}%</p>
                        <p className="text-xs opacity-70">{item.taken}/30 gün</p>
                      </div>
                    </div>
                    <Progress value={item.completion} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geçmiş Kayıtlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {last7Days.slice().reverse().map((date) => {
                  const dayLogs = logs.filter((log) => log.date === date);
                  const takenLogs = dayLogs.filter((log) => log.taken);
                  const completion = supplements.length > 0
                    ? Math.round((takenLogs.length / supplements.length) * 100)
                    : 0;

                  return (
                    <div key={date} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">
                          {new Date(date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </h4>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{completion}%</p>
                          <p className="text-xs text-gray-600">
                            {takenLogs.length}/{supplements.length}
                          </p>
                        </div>
                      </div>
                      <Progress value={completion} className="h-2 mb-2" />
                      <div className="flex flex-wrap gap-2 mt-3">
                        {supplements.map((supplement) => {
                          const log = dayLogs.find((l) => l.supplementId === supplement.id);
                          const isTaken = log?.taken || false;
                          return (
                            <div
                              key={supplement.id}
                              className={`text-xs px-2 py-1 rounded-full ${
                                isTaken ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {isTaken ? '✓' : '○'} {supplement.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
