'use client';

import { useState, useEffect } from 'react';
import { sanitizeInput } from '@/lib/validation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Plus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { TURKISH_FOOD_DATABASE } from '@/lib/turkishFoodDatabase';
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

  // Track which data source produced the current suggestions, and surface
  // a clear UI state for each outcome (results / no results / connection
  // error / supabase-not-configured-fallback).
  type SearchSource = 'supabase' | 'local-fallback' | null;
  type SearchStatus = 'idle' | 'results' | 'empty' | 'error';
  const [searchSource, setSearchSource] = useState<SearchSource>(null);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchErrorMsg, setSearchErrorMsg] = useState<string>('');
  const supabaseReady = isSupabaseConfigured();

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

  // Food-search data flow:
  //
  //   1. If Supabase is configured (NEXT_PUBLIC_SUPABASE_URL +
  //      NEXT_PUBLIC_SUPABASE_ANON_KEY both set), query the `food_database`
  //      table with a case-insensitive match on name_tr OR name.
  //      • non-empty rows  →  show results
  //      • zero rows       →  show "Sonuç bulunamadı" (no results)
  //      • network/SDK err →  show a clear connection-error message
  //
  //   2. If Supabase is NOT configured, fall back to the bundled local
  //      Turkish food list (153 items) so the modal stays useful offline.
  //      A visible badge tells the user the data is offline.
  //
  // Saving the chosen meal (handleAddMeal) ALWAYS goes through Supabase
  // `meals` — unchanged from before.
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchStatus('idle');
      setSearchSource(null);
      setSearchErrorMsg('');
      return;
    }

    let cancelled = false;

    const runLocalFallback = (): void => {
      const needle = searchTerm.trim().toLowerCase();
      const matches = TURKISH_FOOD_DATABASE.filter((food) => {
        return (
          food.nameTr.toLowerCase().includes(needle) ||
          food.name.toLowerCase().includes(needle) ||
          food.category.toLowerCase().includes(needle)
        );
      }).slice(0, 10);

      const normalized: FoodDatabaseItem[] = matches.map((food, idx) => ({
        id: `local-${idx}-${food.nameTr}`,
        name: food.name,
        name_tr: food.nameTr,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fat,
        fiber: food.fiber,
        category: food.category,
        category_tr: food.category,
        serving_size: '100g',
        serving_size_tr: '100g',
      }));

      setSuggestions(normalized);
      setShowSuggestions(normalized.length > 0);
      setSearchSource('local-fallback');
      setSearchStatus(normalized.length > 0 ? 'results' : 'empty');
      setSearchErrorMsg('');
    };

    const runSupabaseSearch = async (): Promise<void> => {
      // ilike escape — protect % and _ wildcards in user input
      const escaped = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const pattern = `%${escaped}%`;
      try {
        const { data, error } = await supabase
          .from('food_database')
          .select('*')
          .or(`name_tr.ilike."${pattern}",name.ilike."${pattern}"`)
          .limit(10);

        if (cancelled) return;

        if (error) {
          // Don't log the error object verbatim — it may contain query
          // fragments. Log a generic marker instead.
          console.error('[AddMealDialog] Supabase food_database search failed');
          setSuggestions([]);
          setShowSuggestions(false);
          setSearchSource('supabase');
          setSearchStatus('error');
          setSearchErrorMsg(
            'Veritabanına bağlanılamadı. Lütfen daha sonra tekrar deneyin veya manuel girin.'
          );
          return;
        }

        const rows = (data ?? []) as FoodDatabaseItem[];
        setSuggestions(rows);
        setShowSuggestions(rows.length > 0);
        setSearchSource('supabase');
        setSearchStatus(rows.length > 0 ? 'results' : 'empty');
        setSearchErrorMsg('');
      } catch {
        if (cancelled) return;
        console.error('[AddMealDialog] Supabase food_database search threw');
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchSource('supabase');
        setSearchStatus('error');
        setSearchErrorMsg(
          'Veritabanına bağlanılamadı. Lütfen daha sonra tekrar deneyin veya manuel girin.'
        );
      }
    };

    setIsSearching(true);

    const debounceTimer = setTimeout(() => {
      if (supabaseReady) {
        void runSupabaseSearch().finally(() => {
          if (!cancelled) setIsSearching(false);
        });
      } else {
        runLocalFallback();
        setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [searchTerm, supabaseReady]);

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
            <div className="flex items-center justify-between">
              <Label htmlFor="search">Yemek Ara</Label>
              {/* Data-source badge — makes the active source obvious to the
                  user and avoids "silent" empty/error states. */}
              {!supabaseReady && (
                <span
                  data-testid="add-meal-search-source-offline"
                  className="text-[11px] uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5"
                >
                  Çevrimdışı veritabanı
                </span>
              )}
              {supabaseReady && searchSource === 'supabase' && searchStatus === 'results' && (
                <span
                  data-testid="add-meal-search-source-supabase"
                  className="text-[11px] uppercase tracking-wide text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-full px-2 py-0.5"
                >
                  Canlı veritabanı
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                data-testid="add-meal-search-input"
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
              <div
                data-testid="add-meal-suggestions-list"
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
              >
                {suggestions.map((food) => (
                  <button
                    key={food.id}
                    data-testid={`add-meal-suggestion-${food.id}`}
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
              <div data-testid="add-meal-search-loading" className="text-sm text-gray-500 mt-1">
                🔍 Aranıyor...
              </div>
            )}

            {/* Empty / error / fallback messages — never silent. */}
            {!isSearching && searchStatus === 'empty' && (
              <div data-testid="add-meal-search-empty" className="text-sm text-gray-500 mt-1">
                ❌ Sonuç bulunamadı. Manuel girebilirsiniz.
              </div>
            )}
            {!isSearching && searchStatus === 'error' && (
              <div
                data-testid="add-meal-search-error"
                className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mt-1"
              >
                ⚠️ {searchErrorMsg}
              </div>
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
