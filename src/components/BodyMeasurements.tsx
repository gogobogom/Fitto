'use client';

import { Card, CardContent } from './ui/card';
import { DoodleImage } from './DoodleImage';
import { useLanguage } from '../contexts/LanguageContext';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface BodyMeasurementsProps {
  connection: SupabaseConnection;
}

export function BodyMeasurements({ connection }: BodyMeasurementsProps) {
  const { language } = useLanguage();

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed doodle-card">
        <CardContent className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <DoodleImage character="scale" alt="Body Measurements" size="xl" className="opacity-60" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 font-doodle">
            {language === 'en' ? 'Body Measurements - Coming Soon!' : 'Vücut Ölçümleri - Yakında!'}
          </h3>
          <p className="text-gray-600 mb-4 font-doodle-alt">
            {language === 'en' 
              ? 'Track your body measurements including weight, waist, hip, chest, and more. This feature will be available soon!' 
              : 'Kilo, bel, kalça, göğüs ve daha fazlasını takip edin. Bu özellik yakında eklenecek!'}
          </p>
          <p className="text-sm text-gray-500">
            {language === 'en' 
              ? '📏 Stay tuned for updates!' 
              : '📏 Güncellemeler için takipte kalın!'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
