'use client';

/**
 * 🎯 AI FEATURES HUB
 * 
 * Central hub for accessing all AI-powered features
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, ChefHat, Calendar, MessageSquare } from 'lucide-react';
import AIMealPhotoAnalyzer from './AIMealPhotoAnalyzer';
import AIRecipeGenerator from './AIRecipeGenerator';

interface AIFeaturesHubProps {
  userId: string;
}

export default function AIFeaturesHub({ userId }: AIFeaturesHubProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('analyzer');

  const labels = {
    tr: {
      title: '🤖 AI Özellikleri',
      subtitle: 'Yapay zeka destekli beslenme araçları',
      analyzer: 'Fotoğraf Analizi',
      recipe: 'Tarif Üretici',
      planner: 'Haftalık Plan',
      coach: 'AI Koçu',
    },
    en: {
      title: '🤖 AI Features',
      subtitle: 'AI-powered nutrition tools',
      analyzer: 'Photo Analysis',
      recipe: 'Recipe Generator',
      planner: 'Weekly Planner',
      coach: 'AI Coach',
    },
  };

  const t = labels[language];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <p className="text-sm text-gray-500">{t.subtitle}</p>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="analyzer" className="text-xs">
              <Camera className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.analyzer}</span>
            </TabsTrigger>
            <TabsTrigger value="recipe" className="text-xs">
              <ChefHat className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.recipe}</span>
            </TabsTrigger>
            <TabsTrigger value="planner" className="text-xs">
              <Calendar className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.planner}</span>
            </TabsTrigger>
            <TabsTrigger value="coach" className="text-xs">
              <MessageSquare className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t.coach}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer" className="mt-4">
            <AIMealPhotoAnalyzer userId={userId} />
          </TabsContent>

          <TabsContent value="recipe" className="mt-4">
            <AIRecipeGenerator userId={userId} />
          </TabsContent>

          <TabsContent value="planner" className="mt-4">
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {language === 'tr' 
                  ? 'Haftalık plan özelliği yakında!' 
                  : 'Weekly planner coming soon!'}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="coach" className="mt-4">
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {language === 'tr'
                  ? 'AI Koçu için sağ alttaki teal butona tıklayın!'
                  : 'Click the teal button at bottom-right for AI Coach!'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
