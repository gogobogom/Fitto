'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Plus, Apple } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface CustomFoodManagerProps {
  connection: SupabaseConnection;
  onClose: () => void;
}

export function CustomFoodManager({ connection, onClose }: CustomFoodManagerProps) {
  const { t } = useLanguage();
  const [foodName, setFoodName] = useState<string>('');
  const [foodNameTr, setFoodNameTr] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [fiber, setFiber] = useState<string>('0');
  const [category, setCategory] = useState<string>('Diğer');

  const handleCreateFood = (): void => {
    if (!foodName.trim() || !foodNameTr.trim()) {
      alert(t('more.enterFoodNames'));
      return;
    }

    const caloriesNum = parseFloat(calories) || 0;
    const proteinNum = parseFloat(protein) || 0;
    const carbsNum = parseFloat(carbs) || 0;
    const fatNum = parseFloat(fat) || 0;
    const fiberNum = parseFloat(fiber) || 0;

    if (caloriesNum < 0 || proteinNum < 0 || carbsNum < 0 || fatNum < 0 || fiberNum < 0) {
      alert(t('more.nutritionNegative'));
      return;
    }

    try {
      connection.reducers.addFoodItem(
        foodName.trim(),
        foodNameTr.trim(),
        caloriesNum,
        proteinNum,
        carbsNum,
        fatNum,
        fiberNum,
        category.trim(),
        true // isCustom flag
      );

      setFoodName('');
      setFoodNameTr('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setFiber('0');
      setCategory('Diğer');
      onClose();
    } catch (error) {
      console.error('Özel gıda eklenirken hata:', error);
      alert(t('more.foodAddError'));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('more.addCustomFood')}</DialogTitle>
          <DialogDescription>
            {t('more.addCustomFoodDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="foodName">{t('more.englishName')}</Label>
            <Input
              id="foodName"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Homemade Granola"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foodNameTr">{t('more.turkishName')}</Label>
            <Input
              id="foodNameTr"
              value={foodNameTr}
              onChange={(e) => setFoodNameTr(e.target.value)}
              placeholder="Örn: Ev Yapımı Granola"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('more.category')}</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Örn: Atıştırmalık"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">{t('more.caloriesKcal')}</Label>
              <Input
                id="calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">{t('more.proteinG')}</Label>
              <Input
                id="protein"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">{t('more.carbsG')}</Label>
              <Input
                id="carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">{t('more.fatG')}</Label>
              <Input
                id="fat"
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiber">{t('more.fiberG')}</Label>
              <Input
                id="fiber"
                type="number"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              {t('more.noteAllValues100g')}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateFood} className="flex-1 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              {t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
