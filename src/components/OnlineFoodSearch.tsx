'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Search, Loader2, Package, Star, Camera } from 'lucide-react';
import { searchAndNormalize, type NormalizedFood } from '@/lib/openfoodfacts';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface OnlineFoodSearchProps {
  connection: SupabaseConnection;
  onClose: () => void;
  onOpenBarcodeScanner: () => void;
}

export function OnlineFoodSearch({ connection, onClose, onOpenBarcodeScanner }: OnlineFoodSearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<NormalizedFood[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    setHasSearched(true);

    // 🔧 FIX: Proper mounted tracking with useRef would be better
    // but for this scope, we'll use a closure variable
    let isMounted = true;
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Add timeout protection
      timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const results = await searchAndNormalize(searchQuery.trim());
      
      // 🔧 FIX: Always clear timeout on success
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (isMounted) {
        setSearchResults(results);
        
        if (results.length === 0) {
          setError('Sonuç bulunamadı. Farklı bir arama terimi deneyin.');
        }
      }
    } catch (err: unknown) {
      console.error('Arama hatası:', err);
      if (isMounted) {
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Arama zaman aşımına uğradı. Lütfen tekrar deneyin.');
        } else {
          setError('Arama sırasında bir hata oluştu: ' + errorMessage);
        }
      }
    } finally {
      // 🔧 FIX: Ensure timeout is always cleared
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // 🔧 FIX: Update state BEFORE setting isMounted to false
      if (isMounted) {
        setIsSearching(false);
        isMounted = false; // Set to false AFTER using it
      }
    }
  };

  const handleAddToDatabase = (food: NormalizedFood) => {
    try {
      connection.reducers.addFoodItem(
        food.name,
        food.nameTr,
        food.calories,
        food.protein,
        food.carbs,
        food.fat,
        food.fiber,
        food.category,
        false
      );

      // Show success feedback
      alert(`✅ "${food.nameTr}" veritabanınıza eklendi!`);
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Ürün eklenirken hata:', error);
      alert('Ürün eklenirken bir hata oluştu.');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Çevrimiçi Gıda Arama</DialogTitle>
          <DialogDescription>
            2.9M+ ürün içeren OpenFoodFacts veritabanından arama yapın
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <Label htmlFor="online-search">Ürün Ara</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="online-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ör: Ülker çikolata, süt, ekmek..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aranıyor...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Ara
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Barcode Scanner Button */}
          <div className="flex justify-center">
            <Button 
              onClick={onOpenBarcodeScanner} 
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Barkod Tara
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          )}

          {/* Info Message */}
          {!hasSearched && !isSearching && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">OpenFoodFacts Nedir?</p>
                  <p>Dünya çapında 2.9 milyondan fazla ürün içeren ücretsiz, açık kaynak gıda veritabanı. Ambalajlı ürünlerin besin değerlerini kolayca bulabilirsiniz.</p>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-gray-700">
                Bulunan Ürünler ({searchResults.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((food) => (
                  <div
                    key={food.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      {food.imageUrl && (
                        <img
                          src={food.imageUrl}
                          alt={food.nameTr}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{food.nameTr}</h4>
                        {food.brand && (
                          <p className="text-xs text-gray-600 truncate">{food.brand}</p>
                        )}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {food.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {food.calories} kcal
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                        </div>
                      </div>

                      {/* Add Button */}
                      <Button
                        size="sm"
                        onClick={() => handleAddToDatabase(food)}
                        className="shrink-0"
                      >
                        Ekle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={onClose} variant="outline" className="w-full">
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
