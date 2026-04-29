'use client';

/**
 * ShareActions
 *
 * Client-side row of share targets shown on the public /share/week landing.
 * Optimized for X (Twitter) + Instagram + clipboard.
 *
 * - X (Twitter):  https://twitter.com/intent/tweet  (always works)
 * - Instagram:    no public web intent — we trigger the OS share sheet via
 *                 `navigator.share` which surfaces Instagram on mobile, and
 *                 offer a "Download image" button for desktop users to post
 *                 manually to Stories/Feed.
 * - Copy link:    universal fallback.
 */

import { useState } from 'react';
import { Copy, Check, Download, Twitter, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShareActionsProps {
  imageUrl: string;
  pageUrl: string;
  lang: 'tr' | 'en';
  username: string;
}

export function ShareActions({ imageUrl, pageUrl, lang, username }: ShareActionsProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const t = (tr: string, en: string) => (lang === 'tr' ? tr : en);

  const tweetText =
    lang === 'tr'
      ? `Bu hafta @FittoApp ile beslenme & fitness ilerlememi takip ettim. Sen de katıl 💪`
      : `Tracking my nutrition & fitness progress this week with @FittoApp. Join me 💪`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    tweetText,
  )}&url=${encodeURIComponent(pageUrl)}&hashtags=Fitto,FitnessJourney`;

  const handleNativeShare = async (): Promise<void> => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      toast.info(
        t(
          'Bu cihaz yerel paylaşımı desteklemiyor. Lütfen X veya kopyala düğmesini kullan.',
          "This device doesn't support native sharing. Use X or copy instead.",
        ),
      );
      return;
    }
    try {
      await navigator.share({
        title: t('Fitto · Bu haftaki ilerlemem', 'Fitto · My week of progress'),
        text: tweetText,
        url: pageUrl,
      });
    } catch {
      // user dismissed
    }
  };

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success(t('🔗 Bağlantı kopyalandı!', '🔗 Link copied to clipboard!'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('Kopyalanamadı', 'Could not copy'));
    }
  };

  const handleDownload = async (): Promise<void> => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `fitto-week-${username}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success(t('📥 Görsel indirildi!', '📥 Image downloaded!'));
    } catch (err) {
      console.error('Download failed:', err);
      toast.error(t('İndirme başarısız', 'Download failed'));
    }
  };

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-2xl border-4 border-black bg-black px-4 py-3 text-base font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition hover:bg-gray-800"
        data-testid="share-twitter-cta"
      >
        <Twitter className="h-5 w-5" />
        <span>{t('X', 'X')}</span>
      </a>

      <button
        type="button"
        onClick={() => void handleNativeShare()}
        className="flex items-center justify-center gap-2 rounded-2xl border-4 border-black bg-pink-500 px-4 py-3 text-base font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition hover:bg-pink-600"
        data-testid="share-native-cta"
      >
        <Share2 className="h-5 w-5" />
        <span>{t('Paylaş', 'Share')}</span>
      </button>

      <button
        type="button"
        onClick={() => void handleDownload()}
        className="flex items-center justify-center gap-2 rounded-2xl border-4 border-black bg-purple-600 px-4 py-3 text-base font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition hover:bg-purple-700"
        data-testid="download-image-cta"
      >
        <Download className="h-5 w-5" />
        <span>{t('İndir', 'Save')}</span>
      </button>

      <button
        type="button"
        onClick={() => void handleCopy()}
        className="flex items-center justify-center gap-2 rounded-2xl border-4 border-black bg-white px-4 py-3 text-base font-bold text-gray-900 shadow-[4px_4px_0_rgba(0,0,0,0.2)] transition hover:bg-gray-50"
        data-testid="copy-link-cta"
      >
        {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
        <span>{copied ? t('Kopyalandı', 'Copied') : t('Kopyala', 'Copy')}</span>
      </button>
    </div>
  );
}
