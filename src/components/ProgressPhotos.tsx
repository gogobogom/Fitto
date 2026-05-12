'use client';

/**
 * ProgressPhotos
 *
 * Placeholder implementation. The previous file referenced types and a
 * `progress_photos` table that don't exist in the current Supabase schema.
 * Today the component is always rendered from MorePage with a `null`
 * connection (`<ProgressPhotos connection={null as any} />`), so users
 * have never actually seen a photo gallery. Until the table + storage
 * bucket are designed, render a friendly "coming soon" empty state.
 */

import { Card, CardContent } from './ui/card';
import { Camera } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupabaseConnection } from '@/hooks/useSupabase';

interface ProgressPhotosProps {
  connection: SupabaseConnection | null;
}

export function ProgressPhotos({ connection: _connection }: ProgressPhotosProps) {
  const { language } = useLanguage();
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        <Camera className="h-10 w-10 text-gray-400 mb-3" />
        <p className="font-semibold text-gray-700">
          {language === 'tr' ? 'İlerleme Fotoğrafları' : 'Progress Photos'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {language === 'tr'
            ? 'Bu özellik yakında kullanıma sunulacak.'
            : 'This feature is coming soon.'}
        </p>
      </CardContent>
    </Card>
  );
}
