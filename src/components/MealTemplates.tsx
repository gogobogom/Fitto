'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BookOpen, Plus, Trash2, Check } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';
import type { Database } from '@/types/supabase';

type DailyLog = Database['public']['Tables']['daily_logs']['Row'];

interface MealTemplate {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: Array<{
    foodId: string;
    portionGrams: number;
  }>;
  createdAt: number;
}

interface MealTemplatesProps {
  currentDate: Date;
}

export function MealTemplates({ currentDate }: MealTemplatesProps) {
  const { supabase } = useSupabase();
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  useEffect(() => {
    const stored = localStorage.getItem('mealTemplates');
    if (stored) {
      setTemplates(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    loadDailyLogs();
  }, [currentDate, supabase]);

  const loadDailyLogs = async () => {
    if (!supabase) return;

    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('log_date', dateStr);

      if (error) throw error;
      setDailyLogs(data || []);
    } catch (error) {
      console.error('Günlük kayıtlar yüklenirken hata:', error);
    }
  };

  const saveTemplate = () => {
    if (!templateName.trim()) {
      alert('Lütfen şablon için bir isim girin!');
      return;
    }

    // Get today's meals of selected type
    const todayMeals: Array<{ foodId: string; portionGrams: number }> = [];
    
    try {
      for (const log of dailyLogs) {
        if (log.meal_type === selectedType) {
          todayMeals.push({
            foodId: log.food_item_id.toString(),
            portionGrams: log.portion_grams,
          });
        }
      }
    } catch (error) {
      console.error('Öğünler alınırken hata:', error);
    }

    if (todayMeals.length === 0) {
      alert('Bu öğün tipinde bugün eklenmiş yemek yok!');
      return;
    }

    const newTemplate: MealTemplate = {
      id: Date.now().toString(),
      name: templateName,
      mealType: selectedType,
      items: todayMeals,
      createdAt: Date.now(),
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('mealTemplates', JSON.stringify(updatedTemplates));
    
    setTemplateName('');
    setShowCreateDialog(false);
    alert('Şablon kaydedildi! ✅');
  };

  const applyTemplate = async (template: MealTemplate) => {
    if (!confirm(`"${template.name}" şablonunu bugüne uygulayalım mı?`)) {
      return;
    }

    if (!supabase) {
      alert('Veritabanı bağlantısı yok!');
      return;
    }

    try {
      const dateStr = currentDate.toISOString().split('T')[0];

      for (const item of template.items) {
        const { error } = await supabase
          .from('daily_logs')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id || '',
            food_item_id: parseInt(item.foodId),
            meal_type: template.mealType,
            portion_grams: item.portionGrams,
            log_date: dateStr,
          });

        if (error) throw error;
      }

      // Refresh daily logs
      await loadDailyLogs();

      setShowDialog(false);
      alert('Şablon uygulandı! ✅');
    } catch (error) {
      console.error('Şablon uygulanırken hata:', error);
      alert('Şablon uygulanırken bir hata oluştu.');
    }
  };

  const deleteTemplate = (templateId: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return;
    }

    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('mealTemplates', JSON.stringify(updatedTemplates));
  };

  const getMealTypeText = (type: string): string => {
    const types: Record<string, string> = {
      breakfast: 'Kahvaltı',
      lunch: 'Öğle',
      dinner: 'Akşam',
      snack: 'Ara Öğün',
    };
    return types[type] || type;
  };

  return (
    <>
      <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <span className="font-bold text-lg font-doodle">Öğün Şablonları</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Kaydet
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDialog(true)}
                disabled={templates.length === 0}
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Şablonlar ({templates.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List Dialog */}
      {showDialog && (
        <Dialog open onOpenChange={() => setShowDialog(false)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Öğün Şablonlarım</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Henüz şablon yok. Bugünkü öğünlerinizi şablon olarak kaydedin!
                </p>
              ) : (
                templates.map((template) => (
                  <Card key={template.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold">{template.name}</h4>
                          <p className="text-sm text-gray-600">
                            {getMealTypeText(template.mealType)} • {template.items.length} yiyecek
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="w-full"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Bugüne Uygula
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Template Dialog */}
      {showCreateDialog && (
        <Dialog open onOpenChange={() => setShowCreateDialog(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Şablon Kaydet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Şablon Adı</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Örn: Hafta İçi Kahvaltım"
                />
              </div>
              <div>
                <Label htmlFor="mealType">Hangi Öğünü Kaydetmek İstiyorsunuz?</Label>
                <select
                  id="mealType"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="breakfast">Kahvaltı</option>
                  <option value="lunch">Öğle Yemeği</option>
                  <option value="dinner">Akşam Yemeği</option>
                  <option value="snack">Ara Öğün</option>
                </select>
              </div>
              <p className="text-sm text-gray-600">
                Bugün eklediğiniz <strong>{getMealTypeText(selectedType)}</strong> öğününüz şablon olarak kaydedilecek.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  İptal
                </Button>
                <Button onClick={saveTemplate} className="flex-1">
                  Kaydet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
