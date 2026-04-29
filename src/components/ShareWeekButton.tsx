'use client';

/**
 * ShareWeekButton
 *
 * One-click share for the user's "My week on Fitto" card.
 * Falls back through three modes:
 *   1. navigator.share (mobile + Farcaster client + iOS/Android)
 *   2. Open the share landing page in a new tab
 *   3. Copy link to clipboard with a toast confirmation
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShareWeekButtonProps {
  userId: string;
  className?: string;
}

export function ShareWeekButton({ userId, className = '' }: ShareWeekButtonProps) {
  const { language } = useLanguage();
  const [shared, setShared] = useState<boolean>(false);

  const handleShare = async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    const url = `${origin}/share/week/${userId}?lang=${language}`;
    const title = language === 'tr' ? 'Bu haftaki Fitto ilerlemem' : 'My week of progress on Fitto';
    const text =
      language === 'tr'
        ? 'Bu hafta Fitto ile beslenme ve fitness ilerlememi takip ettim. Sen de katıl 💪'
        : 'Tracking my nutrition & fitness progress this week with Fitto. Join me 💪';

    // 1. Try native share (works in Farcaster, iOS Safari, Android Chrome, Edge)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // user dismissed or blocked — fall through
      }
    }

    // 2. Try clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(
          language === 'tr'
            ? '🔗 Bağlantı kopyalandı!'
            : '🔗 Link copied to clipboard!',
        );
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // fall through to opening the page
      }
    }

    // 3. Last resort — open the share page so the user can copy the URL
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={() => void handleShare()}
      data-testid="share-week-btn"
      className={`bg-purple-600 hover:bg-purple-700 text-white border-2 border-black ${className}`}
    >
      {shared ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          {language === 'tr' ? 'Paylaşıldı' : 'Shared'}
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" />
          {language === 'tr' ? 'Haftamı Paylaş' : 'Share My Week'}
        </>
      )}
    </Button>
  );
}

export default ShareWeekButton;
