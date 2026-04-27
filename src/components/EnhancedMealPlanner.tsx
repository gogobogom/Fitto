'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar, Plus, ShoppingCart, Trash2, Copy, Edit, Star, ChefHat } from 'lucide-react';
import { Badge } from './ui/badge';
import { DoodleImage } from './DoodleImage';
import { Progress } from './ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface PlannedMeal {
  id: string;
  day: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

interface FavoriteMeal {
  id: string;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function EnhancedMealPlanner() {
  const { language } = useLanguage();
  
  const daysOfWeek = language === 'en' 
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    : ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  
  const mealTypes = {
    breakfast: { 
      label: language === 'en' ? 'Breakfast' : 'Kahvaltı', 
      color: 'bg-yellow-100 text-yellow-700' 
    },
    lunch: { 
      label: language === 'en' ? 'Lunch' : 'Öğle', 
      color: 'bg-orange-100 text-orange-700' 
    },
    dinner: { 
      label: language === 'en' ? 'Dinner' : 'Akşam', 
      color: 'bg-purple-100 text-purple-700' 
    },
    snack: { 
      label: language === 'en' ? 'Snack' : 'Ara Öğün', 
      color: 'bg-green-100 text-green-700' 
    },
  };
  
  const shoppingCategories = language === 'en'
    ? ['Fruits & Vegetables', 'Meat & Poultry', 'Dairy Products', 'Grains', 'Other']
    : ['Meyve & Sebze', 'Et & Tavuk', 'Süt Ürünleri', 'Tahıllar', 'Diğer'];
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMeal[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0]);
  const [showAddMeal, setShowAddMeal] = useState<boolean>(false);
  const [showAddShoppingItem, setShowAddShoppingItem] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('planner');

  const [newMeal, setNewMeal] = useState({
    mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const [newShoppingItem, setNewShoppingItem] = useState({
    name: '',
    quantity: language === 'en' ? '1 piece' : '1 adet',
    category: shoppingCategories[0],
  });

  useEffect(() => {
    const saved = localStorage.getItem('mealPlan');
    if (saved) setPlannedMeals(JSON.parse(saved));

    const savedShopping = localStorage.getItem('shoppingList');
    if (savedShopping) setShoppingList(JSON.parse(savedShopping));

    const savedFavorites = localStorage.getItem('favoriteMeals');
    if (savedFavorites) setFavoriteMeals(JSON.parse(savedFavorites));
  }, []);

  useEffect(() => {
    localStorage.setItem('mealPlan', JSON.stringify(plannedMeals));
  }, [plannedMeals]);

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('favoriteMeals', JSON.stringify(favoriteMeals));
  }, [favoriteMeals]);

  const addMeal = (): void => {
    if (!newMeal.name.trim()) return;

    const meal: PlannedMeal = {
      id: Date.now().toString(),
      day: selectedDay,
      mealType: newMeal.mealType,
      name: newMeal.name,
      calories: newMeal.calories,
      protein: newMeal.protein,
      carbs: newMeal.carbs,
      fat: newMeal.fat,
    };
    setPlannedMeals([...plannedMeals, meal]);
    setNewMeal({
      mealType: 'breakfast',
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
    setShowAddMeal(false);
  };

  const deleteMeal = (id: string): void => {
    setPlannedMeals(plannedMeals.filter((m: PlannedMeal) => m.id !== id));
  };

  const copyDay = (fromDay: string, toDay: string): void => {
    const mealsFromDay = plannedMeals.filter((m: PlannedMeal) => m.day === fromDay);
    const newMeals = mealsFromDay.map((m: PlannedMeal) => ({
      ...m,
      id: Date.now().toString() + Math.random(),
      day: toDay,
    }));
    setPlannedMeals([...plannedMeals, ...newMeals]);
  };

  const addToFavorites = (meal: PlannedMeal): void => {
    const favorite: FavoriteMeal = {
      id: Date.now().toString(),
      name: meal.name,
      mealType: meal.mealType,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    };
    setFavoriteMeals([...favoriteMeals, favorite]);
  };

  const addFavoriteToDay = (favorite: FavoriteMeal): void => {
    const meal: PlannedMeal = {
      ...favorite,
      id: Date.now().toString(),
      day: selectedDay,
    };
    setPlannedMeals([...plannedMeals, meal]);
  };

  const deleteFavorite = (id: string): void => {
    setFavoriteMeals(favoriteMeals.filter((f) => f.id !== id));
  };

  const addShoppingItem = (): void => {
    if (!newShoppingItem.name.trim()) return;

    const item: ShoppingItem = {
      id: Date.now().toString(),
      name: newShoppingItem.name,
      quantity: newShoppingItem.quantity,
      category: newShoppingItem.category,
      checked: false,
    };
    setShoppingList([...shoppingList, item]);
    setNewShoppingItem({
      name: '',
      quantity: language === 'en' ? '1 piece' : '1 adet',
      category: shoppingCategories[0],
    });
    setShowAddShoppingItem(false);
  };

  const toggleShoppingItem = (id: string): void => {
    setShoppingList(
      shoppingList.map((item: ShoppingItem) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const deleteShoppingItem = (id: string): void => {
    setShoppingList(shoppingList.filter((item: ShoppingItem) => item.id !== id));
  };

  const clearCompleted = (): void => {
    setShoppingList(shoppingList.filter((item) => !item.checked));
  };

  const mealsForSelectedDay = plannedMeals.filter((m: PlannedMeal) => m.day === selectedDay);
  const dailyTotals = mealsForSelectedDay.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Weekly stats
  const weeklyStats = daysOfWeek.map((day) => {
    const dayMeals = plannedMeals.filter((m) => m.day === day);
    const dayTotal = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    return { day, calories: dayTotal, mealCount: dayMeals.length };
  });

  const weeklyTotalCalories = weeklyStats.reduce((sum, day) => sum + day.calories, 0);
  const weeklyAvgCalories = Math.round(weeklyTotalCalories / 7);
  const completionPercentage = Math.round((weeklyStats.filter(d => d.mealCount > 0).length / 7) * 100);

  // Shopping list by category
  const shoppingByCategory = shoppingCategories.map((category) => ({
    category,
    items: shoppingList.filter((item) => item.category === category),
  }));

  const completedItems = shoppingList.filter((item) => item.checked).length;
  const shoppingProgress = shoppingList.length > 0 
    ? Math.round((completedItems / shoppingList.length) * 100)
    : 0;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="planner">{language === 'en' ? 'Planner' : 'Planlayıcı'}</TabsTrigger>
        <TabsTrigger value="shopping">{language === 'en' ? 'Shopping' : 'Alışveriş'}</TabsTrigger>
        <TabsTrigger value="favorites">{language === 'en' ? 'Favorites' : 'Favoriler'}</TabsTrigger>
      </TabsList>

      {/* Planner Tab */}
      <TabsContent value="planner" className="space-y-6">
        {/* Doodle Character */}
        <Card className="bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50 border-2 border-teal-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 relative">
                <DoodleImage 
                  character={completionPercentage >= 75 ? 'celebration' : completionPercentage >= 40 ? 'apple' : 'empty'}
                  alt={language === 'en' ? 'Planning Status' : 'Planlama Durumu'}
                  size="xl"
                  className="w-full h-full"
                />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">
                  {completionPercentage >= 75 
                    ? (language === 'en' ? '🎉 Great Plan!' : '🎉 Harika Plan!') 
                    : completionPercentage >= 40 
                    ? (language === 'en' ? '📅 Going Well!' : '📅 İyi gidiyor!') 
                    : (language === 'en' ? '🌱 Start Planning!' : '🌱 Planla başla!')}
                </h3>
                <p className="text-sm text-gray-600">
                  {weeklyStats.filter(d => d.mealCount > 0).length}/7 {language === 'en' ? 'days planned' : 'gün planlandı'}
                </p>
              </div>
              <Progress value={completionPercentage} className="w-full h-3" />
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">{language === 'en' ? 'Weekly Average' : 'Haftalık Ortalama'}</p>
                  <p className="text-xl font-bold text-teal-600">{weeklyAvgCalories} kcal</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">{language === 'en' ? 'Total Meals' : 'Toplam Öğün'}</p>
                  <p className="text-xl font-bold text-emerald-600">{plannedMeals.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {language === 'en' ? 'Weekly Meal Planner' : 'Haftalık Yemek Planlayıcı'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Day Selection */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {daysOfWeek.map((day: string) => {
                const dayMeals = plannedMeals.filter((m) => m.day === day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`relative px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      selectedDay === day
                        ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white scale-105'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="font-medium">{day}</span>
                    {dayMeals.length > 0 && (
                      <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                        selectedDay === day ? 'bg-white text-teal-600' : 'bg-teal-500 text-white'
                      }`}>
                        {dayMeals.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Daily Summary */}
            {mealsForSelectedDay.length > 0 && (
              <div className="grid grid-cols-4 gap-2 p-4 bg-gradient-to-r from-teal-50 to-green-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold">{dailyTotals.calories}</div>
                  <div className="text-xs text-gray-600">{language === 'en' ? 'Calories' : 'Kalori'}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{dailyTotals.protein}g</div>
                  <div className="text-xs text-gray-600">{language === 'en' ? 'Protein' : 'Protein'}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{dailyTotals.carbs}g</div>
                  <div className="text-xs text-gray-600">{language === 'en' ? 'Carbs' : 'Karb'}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{dailyTotals.fat}g</div>
                  <div className="text-xs text-gray-600">{language === 'en' ? 'Fat' : 'Yağ'}</div>
                </div>
              </div>
            )}

            {/* Meals List */}
            <div className="space-y-2">
              {mealsForSelectedDay.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <DoodleImage character="apple" alt={language === 'en' ? 'No meals yet' : 'Henüz öğün yok'} size="xl" className="w-full h-full" />
                  </div>
                  <p className="text-gray-500">{language === 'en' ? `No meals planned for ${selectedDay}` : `${selectedDay} için henüz öğün planlanmamış`}</p>
                </div>
              ) : (
                mealsForSelectedDay.map((meal: PlannedMeal) => (
                  <div key={meal.id} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={mealTypes[meal.mealType].color}>
                          {mealTypes[meal.mealType].label}
                        </Badge>
                        <span className="font-semibold">{meal.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => addToFavorites(meal)}
                        title={language === 'en' ? 'Add to Favorites' : 'Favorilere Ekle'}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMeal(meal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Meal Dialog */}
            <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Add Meal' : 'Öğün Ekle'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'en' ? 'Add New Meal' : 'Yeni Öğün Ekle'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Meal Type' : 'Öğün Tipi'}</Label>
                    <Select
                      value={newMeal.mealType}
                      onValueChange={(value: string) =>
                        setNewMeal({ ...newMeal, mealType: value as 'breakfast' | 'lunch' | 'dinner' | 'snack' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(mealTypes).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Meal Name' : 'Yemek Adı'}</Label>
                    <Input
                      value={newMeal.name}
                      onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                      placeholder={language === 'en' ? 'E.g: Grilled Chicken' : 'Örn: Izgara Tavuk'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Calories' : 'Kalori'}</Label>
                      <Input
                        type="number"
                        value={newMeal.calories || ''}
                        onChange={(e) => setNewMeal({ ...newMeal, calories: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Protein (g)</Label>
                      <Input
                        type="number"
                        value={newMeal.protein || ''}
                        onChange={(e) => setNewMeal({ ...newMeal, protein: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Carbs (g)' : 'Karb (g)'}</Label>
                      <Input
                        type="number"
                        value={newMeal.carbs || ''}
                        onChange={(e) => setNewMeal({ ...newMeal, carbs: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === 'en' ? 'Fat (g)' : 'Yağ (g)'}</Label>
                      <Input
                        type="number"
                        value={newMeal.fat || ''}
                        onChange={(e) => setNewMeal({ ...newMeal, fat: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addMeal} className="flex-1">{language === 'en' ? 'Add' : 'Ekle'}</Button>
                    <Button variant="outline" onClick={() => setShowAddMeal(false)}>{language === 'en' ? 'Cancel' : 'İptal'}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Copy Day */}
            {mealsForSelectedDay.length > 0 && (
              <div className="pt-4 border-t">
                <Label className="mb-2 block">{language === 'en' ? 'Copy this day to:' : 'Bu günü kopyala:'}</Label>
                <div className="flex gap-2 flex-wrap">
                  {daysOfWeek
                    .filter((day: string) => day !== selectedDay)
                    .map((day: string) => (
                      <Button
                        key={day}
                        variant="outline"
                        size="sm"
                        onClick={() => copyDay(selectedDay, day)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {day}
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Shopping Tab */}
      <TabsContent value="shopping" className="space-y-6">
        {/* Shopping Progress */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20">
                <ShoppingCart className="w-full h-full text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{language === 'en' ? 'Shopping Progress' : 'Alışveriş İlerlemesi'}</h3>
                <p className="text-sm text-gray-600">
                  {completedItems}/{shoppingList.length} {language === 'en' ? 'items completed' : 'ürün tamamlandı'}
                </p>
              </div>
            </div>
            <Progress value={shoppingProgress} className="h-3 mb-2" />
            <p className="text-center text-lg font-semibold text-blue-600">%{shoppingProgress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {language === 'en' ? 'Shopping List' : 'Alışveriş Listesi'}
            </CardTitle>
            {completedItems > 0 && (
              <Button variant="outline" size="sm" onClick={clearCompleted}>
                {language === 'en' ? 'Clear Completed' : 'Tamamlananları Sil'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {shoppingList.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4">
                  <DoodleImage character="apple" alt={language === 'en' ? 'List empty' : 'Liste boş'} size="xl" className="w-full h-full" />
                </div>
                <p className="text-gray-500">{language === 'en' ? 'Your shopping list is empty' : 'Alışveriş listeniz boş'}</p>
              </div>
            ) : (
              shoppingByCategory
                .filter((cat) => cat.items.length > 0)
                .map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <ChefHat className="w-4 h-4" />
                      {cat.category}
                    </h4>
                    {cat.items.map((item: ShoppingItem) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleShoppingItem(item.id)}
                          className="h-5 w-5 rounded"
                        />
                        <div className={`flex-1 ${item.checked ? 'line-through text-gray-400' : ''}`}>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.quantity}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteShoppingItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ))
            )}

            {/* Add Shopping Item Dialog */}
            <Dialog open={showAddShoppingItem} onOpenChange={setShowAddShoppingItem}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'en' ? 'Add Item' : 'Ürün Ekle'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{language === 'en' ? 'Add New Item' : 'Yeni Ürün Ekle'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Item Name' : 'Ürün Adı'}</Label>
                    <Input
                      value={newShoppingItem.name}
                      onChange={(e) => setNewShoppingItem({ ...newShoppingItem, name: e.target.value })}
                      placeholder={language === 'en' ? 'E.g: Tomatoes' : 'Örn: Domates'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Quantity' : 'Miktar'}</Label>
                    <Input
                      value={newShoppingItem.quantity}
                      onChange={(e) => setNewShoppingItem({ ...newShoppingItem, quantity: e.target.value })}
                      placeholder={language === 'en' ? 'E.g: 1 kg' : 'Örn: 1 kg'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'en' ? 'Category' : 'Kategori'}</Label>
                    <Select
                      value={newShoppingItem.category}
                      onValueChange={(value: string) =>
                        setNewShoppingItem({ ...newShoppingItem, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {shoppingCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addShoppingItem} className="flex-1">{language === 'en' ? 'Add' : 'Ekle'}</Button>
                    <Button variant="outline" onClick={() => setShowAddShoppingItem(false)}>{language === 'en' ? 'Cancel' : 'İptal'}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Favorites Tab */}
      <TabsContent value="favorites" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              {language === 'en' ? 'Favorite Meals' : 'Favori Öğünler'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoriteMeals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4">
                  <DoodleImage character="heart" alt={language === 'en' ? 'No favorites' : 'Favori yok'} size="xl" className="w-full h-full" />
                </div>
                <p className="text-gray-500">{language === 'en' ? 'You have no favorite meals yet' : 'Henüz favori öğününüz yok'}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {language === 'en' ? 'Click the star icon in the planner to add' : 'Planlayıcıda yıldız ikonuna tıklayarak ekleyin'}
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {favoriteMeals.map((meal) => (
                  <div key={meal.id} className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={mealTypes[meal.mealType].color}>
                            {mealTypes[meal.mealType].label}
                          </Badge>
                          <span className="font-semibold">{meal.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addFavoriteToDay(meal)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {language === 'en' ? 'Add to Plan' : 'Plana Ekle'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFavorite(meal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
