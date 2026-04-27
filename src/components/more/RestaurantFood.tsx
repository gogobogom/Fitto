'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { DoodleHeader } from '../DoodleHeader';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { UtensilsCrossed, Search, Plus } from 'lucide-react';

interface RestaurantFoodItem {
  id: string;
  restaurant: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  category: string;
}

interface RestaurantFoodProps {
  onBack: () => void;
  onAddFood?: (food: RestaurantFoodItem) => void;
}

// Pre-populated restaurant database
const restaurantDatabase: RestaurantFoodItem[] = [
  // McDonald's
  {
    id: '1',
    restaurant: "McDonald's",
    name: 'Big Mac',
    calories: 563,
    protein: 26,
    carbs: 46,
    fat: 33,
    servingSize: '1 porsiyon',
    category: 'burger',
  },
  {
    id: '2',
    restaurant: "McDonald's",
    name: 'McChicken',
    calories: 400,
    protein: 14,
    carbs: 41,
    fat: 21,
    servingSize: '1 porsiyon',
    category: 'burger',
  },
  {
    id: '3',
    restaurant: "McDonald's",
    name: 'Orta Boy Patates Kızartması',
    calories: 340,
    protein: 4,
    carbs: 44,
    fat: 16,
    servingSize: 'Orta boy',
    category: 'side',
  },
  // Burger King
  {
    id: '4',
    restaurant: 'Burger King',
    name: 'Whopper',
    calories: 657,
    protein: 28,
    carbs: 49,
    fat: 40,
    servingSize: '1 porsiyon',
    category: 'burger',
  },
  {
    id: '5',
    restaurant: 'Burger King',
    name: 'King Tavuk',
    calories: 533,
    protein: 22,
    carbs: 48,
    fat: 28,
    servingSize: '1 porsiyon',
    category: 'burger',
  },
  // Starbucks
  {
    id: '6',
    restaurant: 'Starbucks',
    name: 'Caffe Latte (Grande)',
    calories: 190,
    protein: 13,
    carbs: 19,
    fat: 7,
    servingSize: 'Grande',
    category: 'drink',
  },
  {
    id: '7',
    restaurant: 'Starbucks',
    name: 'Caramel Frappuccino (Grande)',
    calories: 370,
    protein: 5,
    carbs: 54,
    fat: 15,
    servingSize: 'Grande',
    category: 'drink',
  },
  {
    id: '8',
    restaurant: 'Starbucks',
    name: 'Tavuklu Sandviç',
    calories: 450,
    protein: 28,
    carbs: 48,
    fat: 16,
    servingSize: '1 porsiyon',
    category: 'sandwich',
  },
  // KFC
  {
    id: '9',
    restaurant: 'KFC',
    name: 'Tavuk Parçası (Original)',
    calories: 320,
    protein: 29,
    carbs: 10,
    fat: 19,
    servingSize: '1 parça',
    category: 'chicken',
  },
  {
    id: '10',
    restaurant: 'KFC',
    name: 'Twister',
    calories: 510,
    protein: 26,
    carbs: 52,
    fat: 22,
    servingSize: '1 porsiyon',
    category: 'wrap',
  },
  // Domino's
  {
    id: '11',
    restaurant: "Domino's",
    name: 'Pizza Dilimi (Karışık)',
    calories: 280,
    protein: 12,
    carbs: 34,
    fat: 11,
    servingSize: '1 dilim',
    category: 'pizza',
  },
  {
    id: '12',
    restaurant: "Domino's",
    name: 'Pizza Dilimi (Pepperoni)',
    calories: 300,
    protein: 13,
    carbs: 35,
    fat: 13,
    servingSize: '1 dilim',
    category: 'pizza',
  },
  // Subway
  {
    id: '13',
    restaurant: 'Subway',
    name: 'Tavuk Teriyaki (15cm)',
    calories: 360,
    protein: 26,
    carbs: 54,
    fat: 5,
    servingSize: '15cm',
    category: 'sandwich',
  },
  {
    id: '14',
    restaurant: 'Subway',
    name: 'Ton Balığı (15cm)',
    calories: 380,
    protein: 22,
    carbs: 50,
    fat: 10,
    servingSize: '15cm',
    category: 'sandwich',
  },
  // Popeyes
  {
    id: '15',
    restaurant: 'Popeyes',
    name: 'Tavuk Parçası (Klasik)',
    calories: 350,
    protein: 24,
    carbs: 12,
    fat: 23,
    servingSize: '1 parça',
    category: 'chicken',
  },
  {
    id: '16',
    restaurant: 'Popeyes',
    name: 'Tavuk Burger',
    calories: 480,
    protein: 28,
    carbs: 45,
    fat: 20,
    servingSize: '1 porsiyon',
    category: 'burger',
  },
];

export default function RestaurantFood({ onBack, onAddFood }: RestaurantFoodProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('all');

  const restaurants = useMemo(() => {
    const unique = Array.from(new Set(restaurantDatabase.map((item: RestaurantFoodItem) => item.restaurant)));
    return ['all', ...unique];
  }, []);

  const filteredFoods = useMemo(() => {
    return restaurantDatabase.filter((item: RestaurantFoodItem) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.restaurant.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRestaurant =
        selectedRestaurant === 'all' || item.restaurant === selectedRestaurant;
      return matchesSearch && matchesRestaurant;
    });
  }, [searchQuery, selectedRestaurant]);

  const handleAddFood = (food: RestaurantFoodItem): void => {
    if (onAddFood) {
      onAddFood(food);
    }
    alert(`${food.name} günlüğe eklendi!`);
  };

  return (
    <div className="space-y-6 pb-24">
      <DoodleHeader onBack={onBack} title="Restoran Yiyecekleri" subtitle="Popüler zincir ve restoran menüleri" emoji="🍔" />

      {/* Search */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Yemek veya restoran ara..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Filter Tabs */}
      <Tabs value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all">Tümü</TabsTrigger>
          <TabsTrigger value="McDonald's">McD</TabsTrigger>
          <TabsTrigger value="Burger King">BK</TabsTrigger>
          <TabsTrigger value="Starbucks">SB</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedRestaurant} className="space-y-3 mt-4">
          {filteredFoods.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">Sonuç bulunamadı</p>
              </CardContent>
            </Card>
          ) : (
            filteredFoods.map((food: RestaurantFoodItem) => (
              <Card key={food.id} className="border-2 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{food.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {food.restaurant}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddFood(food)}
                      className="ml-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ekle
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div className="bg-red-50 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">Kalori</p>
                      <p className="font-semibold text-gray-900">{food.calories}</p>
                    </div>
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">Protein</p>
                      <p className="font-semibold text-gray-900">{food.protein}g</p>
                    </div>
                    <div className="bg-yellow-50 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">Karb</p>
                      <p className="font-semibold text-gray-900">{food.carbs}g</p>
                    </div>
                    <div className="bg-purple-50 rounded p-2">
                      <p className="text-xs text-gray-600 mb-1">Yağ</p>
                      <p className="font-semibold text-gray-900">{food.fat}g</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">Porsiyon: {food.servingSize}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Restaurant List */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Popüler Restoranlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {restaurants.slice(1).map((restaurant: string) => (
              <Button
                key={restaurant}
                variant={selectedRestaurant === restaurant ? 'default' : 'outline'}
                onClick={() => setSelectedRestaurant(restaurant)}
                className="h-auto py-3"
              >
                {restaurant}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
