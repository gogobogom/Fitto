'use client';

/**
 * ShareWeekButton
 *
 * One-click share for the user's "My week on Fitto" card.
 * Falls back through:
 *   1. navigator.share (mobile OS share sheet → X / Instagram / WhatsApp / etc.)
 *   2. Copy link to clipboard (desktop)
 *   3. Open the share landing page in a new tab
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { copyToClipboard } from '@/lib/clipboard';

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
    const title =
      language === 'tr' ? 'Bu haftaki Fitto ilerlemem' : 'My week of progress on Fitto';
    const text =
      language === 'tr'
        ? 'Bu hafta Fitto ile beslenme ve fitness ilerlememi takip ettim. Sen de katıl 💪'
        : 'Tracking my nutrition & fitness progress this week with Fitto. Join me 💪';

    // 1. Native OS share sheet (iOS Safari, Android Chrome, Edge)
    //    Surfaces X / Twitter, Instagram, WhatsApp, Messages, etc.
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // user dismissed — fall through
      }
    }

    // 2. Clipboard fallback (desktop)
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(
          language === 'tr' ? '🔗 Bağlantı kopyalandı!' : '🔗 Link copied to clipboard!',
        );
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {
        // fall through to opening the page
      }
    }

    // 3. Last resort — open the share page so the user can copy the URL manually
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
