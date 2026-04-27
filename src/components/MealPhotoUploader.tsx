'use client';

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { Badge } from './ui/badge';

interface MealPhoto {
  id: string;
  imageUrl: string;
  mealType: string;
  note: string;
  timestamp: string;
}

interface MealPhotoUploaderProps {
  mealId?: string;
  mealType: string;
  onPhotoAdded?: () => void;
}

export function MealPhotoUploader({ mealId, mealType, onPhotoAdded }: MealPhotoUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePhoto = (): void => {
    if (!selectedImage) return;

    try {
      const photos = JSON.parse(localStorage.getItem('meal_photos') || '[]') as MealPhoto[];
      const newPhoto: MealPhoto = {
        id: `photo_${Date.now()}`,
        imageUrl: selectedImage,
        mealType,
        note,
        timestamp: new Date().toISOString(),
      };

      photos.push(newPhoto);
      localStorage.setItem('meal_photos', JSON.stringify(photos));

      // Reset form
      setSelectedImage(null);
      setNote('');
      setShowUploadForm(false);

      if (onPhotoAdded) onPhotoAdded();
    } catch (error) {
      console.error('Fotoğraf kaydedilirken hata:', error);
      alert('Fotoğraf kaydedilemedi');
    }
  };

  if (!showUploadForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowUploadForm(true)}
        className="w-full"
      >
        <Camera className="h-4 w-4 mr-2" />
        Fotoğraf Ekle
      </Button>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Yemek Fotoğrafı
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowUploadForm(false);
              setSelectedImage(null);
              setNote('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image Preview */}
        {selectedImage ? (
          <div className="relative">
            <img
              src={selectedImage}
              alt="Yemek önizleme"
              className="w-full h-48 object-cover rounded-lg border-2"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <Label htmlFor="image-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700 font-medium">
                Fotoğraf Seç
              </span>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </Label>
          </div>
        )}

        {/* Note */}
        <div>
          <Label htmlFor="photo-note">Not (opsiyonel)</Label>
          <Textarea
            id="photo-note"
            placeholder="Bu yemek hakkında notlarınız..."
            value={note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
            rows={3}
          />
        </div>

        {/* Meal Type Badge */}
        <div>
          <Badge className="bg-green-100 text-green-700 border-green-300">
            {mealType}
          </Badge>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSavePhoto}
          disabled={!selectedImage}
          className="w-full"
        >
          Fotoğrafı Kaydet
        </Button>
      </CardContent>
    </Card>
  );
}
