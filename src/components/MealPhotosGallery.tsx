'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { Camera, X, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface MealPhoto {
  id: string;
  imageUrl: string;
  mealType: string;
  note: string;
  timestamp: string;
}

export function MealPhotosGallery() {
  const { language } = useLanguage();
  const [photos, setPhotos] = useState<MealPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<MealPhoto | null>(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = (): void => {
    try {
      const stored = localStorage.getItem('meal_photos');
      if (stored) {
        const parsed = JSON.parse(stored) as MealPhoto[];
        setPhotos(parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (error) {
      console.error('Fotoğraflar yüklenirken hata:', error);
    }
  };

  const handleDeletePhoto = (photoId: string): void => {
    try {
      const updated = photos.filter((p) => p.id !== photoId);
      localStorage.setItem('meal_photos', JSON.stringify(updated));
      setPhotos(updated);
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Fotoğraf silinirken hata:', error);
    }
  };

  if (photos.length === 0) {
    return (
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{language === 'tr' ? 'Henüz yemek fotoğrafı yok' : 'No meal photos yet'}</p>
            <p className="text-sm text-gray-500 mt-2">
              {language === 'tr' ? 'Yemek eklerken fotoğraf ekleyebilirsiniz' : 'You can add photos when logging meals'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-br from-pink-50 to-rose-50">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-pink-600" />
            {language === 'tr' ? 'Yemek Fotoğrafları' : 'Meal Photos'} ({photos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.mealType}
                  className="w-full h-32 object-cover rounded-lg border-2 group-hover:opacity-90 transition-opacity"
                />
                <Badge className="absolute top-2 left-2 bg-white/90 text-gray-900 border">
                  {photo.mealType}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Photo Detail Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-md">
            <div className="space-y-4">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.mealType}
                className="w-full h-64 object-cover rounded-lg border-2"
              />
              
              <div className="space-y-2">
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  {selectedPhoto.mealType}
                </Badge>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedPhoto.timestamp).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {selectedPhoto.note && (
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    <p className="text-sm text-gray-700">{selectedPhoto.note}</p>
                  </div>
                )}
              </div>

              <Button
                variant="destructive"
                onClick={() => handleDeletePhoto(selectedPhoto.id)}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                {language === 'tr' ? 'Fotoğrafı Sil' : 'Delete Photo'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
