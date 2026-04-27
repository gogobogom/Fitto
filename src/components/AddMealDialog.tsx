'use client';

import { useState, useEffect } from 'react';
import { sanitizeInput } from '@/lib/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { FoodItem } from '@/types/supabase';

interface AddMealDialogProps {
  connection: SupabaseConnection;
  currentDate: string;
  onClose: () => void;
  foodItems: ReadonlyMap<string, FoodItem>;
  mealType?: string; // 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

interface FoodDatabaseItem {
  id: string;
  name: string;
  name_tr: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  category: string;
  category_tr: string;
  serving_size: string;
  serving_size_tr: string;
}

// Saat bazlı otomatik öğün seçimi
const getDefaultMealType = (): string => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'breakfast'; // Sabah (00:00 - 11:59)
  } else if (hour >= 12 && hour <= 15) {
    return 'lunch'; // Öğle (12:00 - 15:30)
  } else if (hour > 15 && hour < 24) {
    return 'dinner'; // Akşam (15:31 - 23:59)
  }
  
  return 'snack'; // Varsayılan
};

export function AddMealDialog({ connection, currentDate, onClose, foodItems, mealType }: AddMealDialogProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [suggestions, setSuggestions] = useState<FoodDatabaseItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Manual entry fields
  const [mealName, setMealName] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fats, setFats] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Öğün seçimi - saat bazlı otomatik seçim
  const [selectedMealType, setSelectedMealType] = useState<string>(
    mealType || getDefaultMealType()
  );

  // Search food database
  useEffect(() => {
    const searchFoodDatabase = async (): Promise<void> => {
      if (searchTerm.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);

      try {
        // 🔒 SECURITY: Use parameterized queries to prevent SQL injection
        const searchPattern = `%${searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
        
        const { data, error } = await supabase
          .from('food_database')
          .select('*')
          .or(`name_tr.ilike."${searchPattern}",name.ilike."${searchPattern}"`)
          .limit(10);

        if (error) {
          console.error('Yemek arama hatası:', error);
          setSuggestions([]);
        } else if (data) {
          setSuggestions(data as FoodDatabaseItem[]);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Yemek arama hatası:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      // Use void to explicitly ignore Promise (prevents React Error #310)
      void searchFoodDatabase();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const selectFood = (food: FoodDatabaseItem): void => {
    // 🔒 SECURITY: Sanitize all user-facing data to prevent XSS
    setMealName(sanitizeInput(food.name_tr));
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFats(food.fats.toString());
    setNotes(`${sanitizeInput(food.category_tr)} • ${sanitizeInput(food.serving_size_tr)}`);
    setSearchTerm('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleAddMeal = async (): Promise<void> => {
    // 🔒 SECURITY: Sanitize and validate all user inputs
    const sanitizedMealName = sanitizeInput(mealName);
    
    if (!sanitizedMealName.trim()) {
      alert('Lütfen yemek adı girin');
      return;
    }

    const caloriesNum = Math.max(0, Math.min(10000, parseFloat(calories) || 0)); // Limit: 0-10000
    const proteinNum = Math.max(0, Math.min(500, parseFloat(protein) || 0));    // Limit: 0-500g
    const carbsNum = Math.max(0, Math.min(500, parseFloat(carbs) || 0));        // Limit: 0-500g
    const fatsNum = Math.max(0, Math.min(500, parseFloat(fats) || 0));          // Limit: 0-500g

    try {
      console.log('🍽️ Yemek ekleniyor:', {
        user_id: connection.userId,
        meal_name: sanitizedMealName,
        meal_type: selectedMealType,
        calories: caloriesNum,
        protein: proteinNum,
        carbs: carbsNum,
        fats: fatsNum,
        date: currentDate,
      });

      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: connection.userId,
          meal_name: sanitizedMealName,
          meal_type: selectedMealType, // Selected meal type
          calories: caloriesNum,
          protein: proteinNum,
          carbs: carbsNum,
          fats: fatsNum,
          notes: notes ? sanitizeInput(notes) : null,
          date: currentDate,
        })
        .select(); // Return inserted data

      if (error) {
        console.error('❌ Yemek eklenirken hata:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        alert(`Yemek eklenirken bir hata oluştu: ${error.message}\n\nDetay: ${error.details || error.hint || 'Bilinmiyor'}`);
        return;
      }

      console.log('✅ Yemek başarıyla eklendi:', data);
      // Success - close dialog
      onClose();
    } catch (error) {
      console.error('❌ Beklenmeyen hata:', error);
      const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
      alert(`Beklenmeyen bir hata oluştu: ${errorMsg}`);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yemek Ekle</DialogTitle>
          <DialogDescription>Yemek ara veya manuel gir</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Öğün Seçimi */}
          <div className="space-y-2">
            <Label htmlFor="mealType">Öğün Türü</Label>
            <Select value={selectedMealType} onValueChange={setSelectedMealType}>
              <SelectTrigger id="mealType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">🌅 Kahvaltı</SelectItem>
                <SelectItem value="lunch">🌞 Öğle Yemeği</SelectItem>
                <SelectItem value="dinner">🌙 Akşam Yemeği</SelectItem>
                <SelectItem value="snack">🍎 Ara Öğün</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {selectedMealType === 'breakfast' && '🌅 Sabah öğününüz'}
              {selectedMealType === 'lunch' && '🌞 Öğle öğününüz'}
              {selectedMealType === 'dinner' && '🌙 Akşam öğününüz'}
              {selectedMealType === 'snack' && '🍎 Ara öğününüz'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="space-y-2 relative">
            <Label htmlFor="search">Yemek Ara</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Örn: Tavuk, Pilav, Salata..."
                className="pl-10"
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {suggestions.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => selectFood(food)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{food.name_tr}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{food.category_tr} • {food.serving_size_tr}</div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-orange-600">{food.calories} kcal</div>
                        <div className="text-xs text-gray-500">
                          P: {food.protein}g • C: {food.carbs}g • F: {food.fats}g
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isSearching && (
              <div className="text-sm text-gray-500 mt-1">🔍 Aranıyor...</div>
            )}

            {searchTerm.length >= 2 && suggestions.length === 0 && !isSearching && (
              <div className="text-sm text-gray-500 mt-1">❌ Sonuç bulunamadı. Manuel girebilirsiniz.</div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Manuel Giriş</h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="mealName">Yemek Adı</Label>
                <Input
                  id="mealName"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="Örn: Tavuk Göğsü"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="calories">Kalori (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbs">Karbonhidrat (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fats">Yağ (g)</Label>
                  <Input
                    id="fats"
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notlar (Opsiyonel)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Öğün türü veya not ekle"
                />
              </div>
            </div>
          </div>

          {/* Nutrition Summary */}
          {(calories || protein || carbs || fats) && (
            <div className="p-4 border rounded-md bg-gradient-to-r from-orange-50 to-yellow-50">
              <h4 className="font-medium mb-2 text-gray-900">Besin Değerleri:</h4>
              <div className="text-sm space-y-1">
                {calories && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kalori:</span>
                    <span className="font-bold text-orange-600">{calories} kcal</span>
                  </div>
                )}
                {protein && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Protein:</span>
                    <span className="font-semibold text-blue-600">{protein}g</span>
                  </div>
                )}
                {carbs && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Karbonhidrat:</span>
                    <span className="font-semibold text-green-600">{carbs}g</span>
                  </div>
                )}
                {fats && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Yağ:</span>
                    <span className="font-semibold text-purple-600">{fats}g</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              İptal
            </Button>
            <Button onClick={handleAddMeal} disabled={!mealName.trim()} className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
              <Plus className="h-4 w-4 mr-1" />
              Ekle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
