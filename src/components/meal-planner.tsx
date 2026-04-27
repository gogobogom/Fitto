'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Plus, ShoppingCart, Trash2, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PlannedMeal {
  id: string
  day: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface ShoppingItem {
  id: string
  name: string
  quantity: string
  category: string
  checked: boolean
}

const daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
const mealTypes = {
  breakfast: { label: 'Kahvaltı', color: 'bg-yellow-100 text-yellow-700' },
  lunch: { label: 'Öğle', color: 'bg-orange-100 text-orange-700' },
  dinner: { label: 'Akşam', color: 'bg-purple-100 text-purple-700' },
  snack: { label: 'Ara Öğün', color: 'bg-green-100 text-green-700' },
}

export function MealPlanner() {
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([])
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0])
  const [showAddMeal, setShowAddMeal] = useState<boolean>(false)
  const [newMeal, setNewMeal] = useState({
    mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })

  useEffect(() => {
    const saved = localStorage.getItem('mealPlan')
    if (saved) {
      setPlannedMeals(JSON.parse(saved))
    }
    const savedShopping = localStorage.getItem('shoppingList')
    if (savedShopping) {
      setShoppingList(JSON.parse(savedShopping))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('mealPlan', JSON.stringify(plannedMeals))
  }, [plannedMeals])

  useEffect(() => {
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList))
  }, [shoppingList])

  const addMeal = (): void => {
    const meal: PlannedMeal = {
      id: Date.now().toString(),
      day: selectedDay,
      mealType: newMeal.mealType,
      name: newMeal.name,
      calories: newMeal.calories,
      protein: newMeal.protein,
      carbs: newMeal.carbs,
      fat: newMeal.fat,
    }
    setPlannedMeals([...plannedMeals, meal])
    setNewMeal({
      mealType: 'breakfast',
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    })
    setShowAddMeal(false)
  }

  const deleteMeal = (id: string): void => {
    setPlannedMeals(plannedMeals.filter((m: PlannedMeal) => m.id !== id))
  }

  const copyDay = (fromDay: string, toDay: string): void => {
    const mealsFromDay = plannedMeals.filter((m: PlannedMeal) => m.day === fromDay)
    const newMeals = mealsFromDay.map((m: PlannedMeal) => ({
      ...m,
      id: Date.now().toString() + Math.random(),
      day: toDay,
    }))
    setPlannedMeals([...plannedMeals, ...newMeals])
  }

  const addToShoppingList = (item: string): void => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: item,
      quantity: '1 adet',
      category: 'Diğer',
      checked: false,
    }
    setShoppingList([...shoppingList, newItem])
  }

  const toggleShoppingItem = (id: string): void => {
    setShoppingList(
      shoppingList.map((item: ShoppingItem) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  const deleteShoppingItem = (id: string): void => {
    setShoppingList(shoppingList.filter((item: ShoppingItem) => item.id !== id))
  }

  const mealsForSelectedDay = plannedMeals.filter((m: PlannedMeal) => m.day === selectedDay)
  const dailyTotals = mealsForSelectedDay.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Meal Planner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Haftalık Yemek Planlayıcı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Day Selection */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {daysOfWeek.map((day: string) => (
              <Button
                key={day}
                variant={selectedDay === day ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className="whitespace-nowrap"
              >
                {day}
              </Button>
            ))}
          </div>

          {/* Daily Summary */}
          {mealsForSelectedDay.length > 0 && (
            <div className="grid grid-cols-4 gap-2 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold">{dailyTotals.calories}</div>
                <div className="text-xs text-muted-foreground">Kalori</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{dailyTotals.protein}g</div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{dailyTotals.carbs}g</div>
                <div className="text-xs text-muted-foreground">Karb</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{dailyTotals.fat}g</div>
                <div className="text-xs text-muted-foreground">Yağ</div>
              </div>
            </div>
          )}

          {/* Meals List */}
          <div className="space-y-2">
            {mealsForSelectedDay.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {selectedDay} için henüz öğün planlanmamış
              </div>
            ) : (
              mealsForSelectedDay.map((meal: PlannedMeal) => (
                <div key={meal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={mealTypes[meal.mealType].color}>
                        {mealTypes[meal.mealType].label}
                      </Badge>
                      <span className="font-semibold">{meal.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {meal.calories} kcal • P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMeal(meal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Add Meal Button */}
          {!showAddMeal ? (
            <Button onClick={() => setShowAddMeal(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Öğün Ekle
            </Button>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Öğün Tipi</Label>
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
                <Label>Yemek Adı</Label>
                <Input
                  value={newMeal.name}
                  onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                  placeholder="Örn: Izgara Tavuk"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Kalori</Label>
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
                  <Label>Karb (g)</Label>
                  <Input
                    type="number"
                    value={newMeal.carbs || ''}
                    onChange={(e) => setNewMeal({ ...newMeal, carbs: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yağ (g)</Label>
                  <Input
                    type="number"
                    value={newMeal.fat || ''}
                    onChange={(e) => setNewMeal({ ...newMeal, fat: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addMeal} className="flex-1">Ekle</Button>
                <Button variant="outline" onClick={() => setShowAddMeal(false)}>İptal</Button>
              </div>
            </div>
          )}

          {/* Copy Day */}
          {mealsForSelectedDay.length > 0 && (
            <div className="pt-4 border-t">
              <Label className="mb-2 block">Bu günü kopyala:</Label>
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

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Alışveriş Listesi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {shoppingList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Alışveriş listeniz boş
            </div>
          ) : (
            <div className="space-y-2">
              {shoppingList.map((item: ShoppingItem) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleShoppingItem(item.id)}
                    className="h-4 w-4"
                  />
                  <div className={`flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.quantity}</div>
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
          )}

          <Button
            onClick={() => {
              const item = prompt('Ürün adı:')
              if (item) addToShoppingList(item)
            }}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ürün Ekle
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
