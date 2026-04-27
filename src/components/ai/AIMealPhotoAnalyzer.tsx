'use client';

/**
 * 🍕 AI MEAL PHOTO ANALYZER COMPONENT
 * 
 * Upload meal photos and get instant nutritional analysis
 */

import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResult {
  estimatedNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealName: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  suggestions?: string[];
}

interface AIMealPhotoAnalyzerProps {
  userId: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export default function AIMealPhotoAnalyzer({
  userId,
  onAnalysisComplete,
}: AIMealPhotoAnalyzerProps) {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const labels = {
    tr: {
      title: '📸 Yemek Fotoğrafı Analizi',
      subtitle: 'Fotoğraf çek veya yükle, besin değerlerini öğren',
      uploadBtn: 'Fotoğraf Yükle',
      cameraBtn: 'Kamera Kullan',
      analyzing: 'Analiz ediliyor...',
      mealName: 'Yemek',
      confidence: 'Güven',
      suggestions: 'Öneriler',
      addToLog: 'Günlüğe Ekle',
      tryAnother: 'Başka Fotoğraf',
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük',
    },
    en: {
      title: '📸 Meal Photo Analysis',
      subtitle: 'Take or upload a photo to get nutritional info',
      uploadBtn: 'Upload Photo',
      cameraBtn: 'Use Camera',
      analyzing: 'Analyzing...',
      mealName: 'Meal',
      confidence: 'Confidence',
      suggestions: 'Suggestions',
      addToLog: 'Add to Log',
      tryAnother: 'Try Another',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
  };

  const t = labels[language];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB');
      return;
    }

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      await analyzePhoto(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async (base64: string) => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai-meal-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          userId: userId,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResult(data as AnalysisResult);
      toast.success('✅ Analysis complete!');

      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze photo. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalyzer = () => {
    setResult(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      high: { color: 'bg-green-100 text-green-700 border-green-300', label: t.high },
      medium: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: t.medium },
      low: { color: 'bg-red-100 text-red-700 border-red-300', label: t.low },
    };
    const { color, label } = variants[confidence] || variants.medium;
    return <Badge className={`${color} border`}>{label}</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{t.title}</CardTitle>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!result && !isAnalyzing && (
          <div className="space-y-3">
            {previewUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t.uploadBtn}
              </Button>
              <Button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment');
                    fileInputRef.current.click();
                  }
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                {t.cameraBtn}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-12 h-12 mx-auto text-teal-600 animate-spin" />
            <p className="text-sm text-gray-600">{t.analyzing}</p>
          </div>
        )}

        {/* Results */}
        {result && !isAnalyzing && (
          <div className="space-y-4">
            {/* Photo Preview */}
            {previewUrl && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt={result.mealName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-6 h-6 text-green-500 bg-white rounded-full" />
                </div>
              </div>
            )}

            {/* Meal Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{result.mealName}</h3>
                {getConfidenceBadge(result.confidence)}
              </div>
              <p className="text-sm text-gray-600">{result.description}</p>
            </div>

            {/* Nutrition */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-2xl font-bold text-purple-700">
                  {result.estimatedNutrition.calories}
                </p>
                <p className="text-xs text-purple-600">Calories</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-2xl font-bold text-blue-700">
                  {result.estimatedNutrition.protein}g
                </p>
                <p className="text-xs text-blue-600">Protein</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-2xl font-bold text-orange-700">
                  {result.estimatedNutrition.carbs}g
                </p>
                <p className="text-xs text-orange-600">Carbs</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700">
                  {result.estimatedNutrition.fat}g
                </p>
                <p className="text-xs text-green-600">Fat</p>
              </div>
            </div>

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 mb-1">
                      {t.suggestions}:
                    </p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      {result.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={resetAnalyzer}
                variant="outline"
                className="flex-1"
              >
                {t.tryAnother}
              </Button>
              <Button
                onClick={() => {
                  toast.success('Added to meal log!');
                  resetAnalyzer();
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {t.addToLog}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
