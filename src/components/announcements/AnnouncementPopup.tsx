/**
 * DUYURU POPUP COMPONENT
 * 
 * Admin panelinden gönderilen duyuruları gösterir
 * Resim, CTA buton desteği ile
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone, AlertCircle, Info, PartyPopper, CheckCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promotion';
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  startDate: string;
  endDate: string;
  dismissible: boolean;
}

interface AnnouncementPopupProps {
  announcements: Announcement[];
}

export default function AnnouncementPopup({ announcements }: AnnouncementPopupProps): JSX.Element | null {
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    // LocalStorage'dan dismissed announcement'ları al
    const storedDismissed = localStorage.getItem('dismissedAnnouncements');
    if (storedDismissed) {
      setDismissed(JSON.parse(storedDismissed));
    }
  }, []);

  useEffect(() => {
    // Aktif ve dismiss edilmemiş duyuruları filtrele
    const now = new Date();
    const activeAnnouncements = announcements.filter((ann: Announcement) => {
      const start = new Date(ann.startDate);
      const end = new Date(ann.endDate);
      return now >= start && now <= end && !dismissed.includes(ann.id);
    });

    if (activeAnnouncements.length > 0 && !currentAnnouncement) {
      setCurrentAnnouncement(activeAnnouncements[0]);
    }
  }, [announcements, dismissed, currentAnnouncement]);

  const handleDismiss = (): void => {
    if (currentAnnouncement) {
      const newDismissed = [...dismissed, currentAnnouncement.id];
      setDismissed(newDismissed);
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
      setCurrentAnnouncement(null);
    }
  };

  const handleCTA = (): void => {
    if (currentAnnouncement?.ctaLink) {
      window.open(currentAnnouncement.ctaLink, '_blank');
    }
    handleDismiss();
  };

  if (!currentAnnouncement) return null;

  // Type'a göre renk ve icon
  const typeConfig = {
    info: { bg: 'bg-blue-500', icon: Info },
    warning: { bg: 'bg-yellow-500', icon: AlertCircle },
    success: { bg: 'bg-green-500', icon: CheckCircle },
    promotion: { bg: 'bg-purple-500', icon: Megaphone },
  };

  const config = typeConfig[currentAnnouncement.type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        {/* Header */}
        <div className={`${config.bg} p-6 text-white relative`}>
          <Icon className="w-12 h-12 mb-3" />
          <h2 className="text-2xl font-bold mb-2">{currentAnnouncement.title}</h2>
          {currentAnnouncement.dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Kapat"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Image */}
          {currentAnnouncement.imageUrl && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img 
                src={currentAnnouncement.imageUrl} 
                alt={currentAnnouncement.title}
                className="w-full h-48 object-cover"
              />
            </div>
          )}

          {/* Message */}
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {currentAnnouncement.message}
          </p>

          {/* CTA Button (if provided) */}
          {currentAnnouncement.ctaText && (
            <button
              onClick={handleCTA}
              className={`mt-4 w-full ${config.bg} text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
            >
              {currentAnnouncement.ctaText}
            </button>
          )}

          {/* Default Action Button */}
          {!currentAnnouncement.ctaText && (
            <button
              onClick={handleDismiss}
              className={`mt-6 w-full ${config.bg} text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
            >
              {currentAnnouncement.dismissible ? 'Anladım' : 'Tamam'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
