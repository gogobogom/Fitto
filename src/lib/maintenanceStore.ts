/**
 * BAKIM MODU VE DUYURU YÖNETİMİ (In-Memory Store)
 * 
 * Admin panelinden kontrol edilen bakım modu ve duyurular
 * Şimdilik in-memory - sonra Supabase'e taşınacak
 */

// ============================================================================
// MAINTENANCE MODE STORE
// ============================================================================

interface MaintenanceMode {
  enabled: boolean;
  message: string;
  estimatedEnd?: string;
  features?: string[];
  affectedSections?: string[]; // Hangi bölümler etkileniyor
}

let maintenanceMode: MaintenanceMode = {
  enabled: false,
  message: 'Sistemde bakım çalışması yapılıyor. Lütfen daha sonra tekrar deneyin.',
  estimatedEnd: undefined,
  features: [],
  affectedSections: [],
};

export const MaintenanceStore = {
  get(): MaintenanceMode {
    return { ...maintenanceMode };
  },

  set(mode: Partial<MaintenanceMode>): MaintenanceMode {
    maintenanceMode = { ...maintenanceMode, ...mode };
    console.log('[Maintenance] Mod güncellendi:', maintenanceMode);
    return { ...maintenanceMode };
  },

  enable(message?: string, estimatedEnd?: string, features?: string[]): MaintenanceMode {
    maintenanceMode = {
      ...maintenanceMode,
      enabled: true,
      message: message || maintenanceMode.message,
      estimatedEnd,
      features: features || [],
    };
    console.log('[Maintenance] Mod aktif edildi');
    return { ...maintenanceMode };
  },

  disable(): MaintenanceMode {
    maintenanceMode = { ...maintenanceMode, enabled: false };
    console.log('[Maintenance] Mod devre dışı bırakıldı');
    return { ...maintenanceMode };
  },

  isSectionAffected(section: string): boolean {
    if (!maintenanceMode.enabled) return false;
    if (!maintenanceMode.affectedSections || maintenanceMode.affectedSections.length === 0) {
      return true; // Tüm bölümler etkileniyor
    }
    return maintenanceMode.affectedSections.includes(section);
  },
};

// ============================================================================
// ANNOUNCEMENTS STORE
// ============================================================================

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promotion';
  imageUrl?: string; // Reklam/duyuru görseli
  ctaText?: string; // Call-to-action buton metni
  ctaLink?: string; // Call-to-action buton linki
  startDate: string;
  endDate: string;
  dismissible: boolean;
  active: boolean;
  createdAt: string;
  createdBy?: string;
}

let announcements: Announcement[] = [];

export const AnnouncementsStore = {
  getAll(): Announcement[] {
    return [...announcements];
  },

  getActive(): Announcement[] {
    const now = new Date();
    return announcements.filter((ann: Announcement) => {
      if (!ann.active) return false;
      const start = new Date(ann.startDate);
      const end = new Date(ann.endDate);
      return now >= start && now <= end;
    });
  },

  getById(id: string): Announcement | undefined {
    return announcements.find((ann: Announcement) => ann.id === id);
  },

  create(announcement: Omit<Announcement, 'id' | 'createdAt'>): Announcement {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    announcements.push(newAnnouncement);
    console.log('[Announcements] Yeni duyuru oluşturuldu:', newAnnouncement.id);
    return newAnnouncement;
  },

  update(id: string, updates: Partial<Announcement>): Announcement | null {
    const index = announcements.findIndex((ann: Announcement) => ann.id === id);
    if (index === -1) return null;
    
    announcements[index] = { ...announcements[index], ...updates };
    console.log('[Announcements] Duyuru güncellendi:', id);
    return announcements[index];
  },

  delete(id: string): boolean {
    const index = announcements.findIndex((ann: Announcement) => ann.id === id);
    if (index === -1) return false;
    
    announcements.splice(index, 1);
    console.log('[Announcements] Duyuru silindi:', id);
    return true;
  },

  toggle(id: string): Announcement | null {
    const announcement = announcements.find((ann: Announcement) => ann.id === id);
    if (!announcement) return null;
    
    announcement.active = !announcement.active;
    console.log('[Announcements] Duyuru toggle:', id, announcement.active);
    return announcement;
  },
};

// ============================================================================
// ÖRNEK DUYURU (İLK AÇILIŞTA)
// ============================================================================

// Örnek duyuru ekle
AnnouncementsStore.create({
  title: '🎉 Hoş Geldiniz!',
  message: 'Fitto\'ya hoş geldiniz! Sağlıklı yaşam yolculuğunuzda size eşlik etmekten mutluluk duyuyoruz.\n\nYapay zeka destekli beslenme koçumuz, kişiselleştirilmiş öğün planları ve detaylı besin analizi ile hedeflerinize ulaşmanıza yardımcı olacak.',
  type: 'success',
  startDate: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 saat önce
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 gün sonra
  dismissible: true,
  active: true,
});
