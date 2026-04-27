/**
 * MAINTENANCE & ANNOUNCEMENT WRAPPER
 * 
 * Ana layout'ta maintenance ve announcement kontrolü yapar
 */

'use client';

import { useEffect, useState } from 'react';
import MaintenancePage from './maintenance/MaintenancePage';
import MaintenanceBanner from './maintenance/MaintenanceBanner';
import AnnouncementPopup from './announcements/AnnouncementPopup';
import type { Announcement } from '@/lib/maintenanceStore';

interface MaintenanceMode {
  enabled: boolean;
  message: string;
  estimatedEnd?: string;
  features?: string[];
  affectedSections?: string[];
}

export default function MaintenanceWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Maintenance mode'u kontrol et
    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMaintenanceMode(data.maintenance);
        }
      })
      .catch(err => console.error('[MaintenanceWrapper] Maintenance fetch error:', err));

    // Aktif duyuruları al
    fetch('/api/announcements?active=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(err => console.error('[MaintenanceWrapper] Announcements fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Yükleme durumu
  if (loading) {
    return <>{children}</>;
  }

  // Tam bakım modu - tüm uygulama engelleniyor
  if (maintenanceMode?.enabled && (!maintenanceMode.affectedSections || maintenanceMode.affectedSections.length === 0)) {
    return (
      <MaintenancePage
        message={maintenanceMode.message}
        estimatedEnd={maintenanceMode.estimatedEnd}
        features={maintenanceMode.features}
      />
    );
  }

  // Kısmi bakım modu - banner göster
  const showBanner = maintenanceMode?.enabled && 
    maintenanceMode.affectedSections && 
    maintenanceMode.affectedSections.length > 0;

  return (
    <>
      {showBanner && (
        <MaintenanceBanner
          message={maintenanceMode.message}
          estimatedEnd={maintenanceMode.estimatedEnd}
        />
      )}
      
      {announcements.length > 0 && (
        <AnnouncementPopup announcements={announcements} />
      )}
      
      <div className={showBanner ? 'pt-16' : ''}>
        {children}
      </div>
    </>
  );
}
