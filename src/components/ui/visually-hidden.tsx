import * as React from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * VisuallyHidden - Ekran okuyucular için görünür ama görsel olarak gizli içerik
 * 
 * Kullanım:
 * <VisuallyHidden>Bu metin sadece ekran okuyucular tarafından okunur</VisuallyHidden>
 */
export function VisuallyHidden({ 
  children, 
  as: Component = 'span',
  className,
  ...props 
}: VisuallyHiddenProps): React.ReactElement {
  return (
    <Component
      className={cn('sr-only', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * Accessible Icon - İkon için erişilebilir wrapper
 * Dekoratif ikonlar için aria-hidden, anlamlı ikonlar için label
 */
interface AccessibleIconProps {
  children: React.ReactNode;
  label?: string;
  decorative?: boolean;
}

export function AccessibleIcon({ 
  children, 
  label, 
  decorative = false 
}: AccessibleIconProps): React.ReactElement {
  if (decorative) {
    return (
      <span aria-hidden="true" role="presentation">
        {children}
      </span>
    );
  }

  return (
    <span role="img" aria-label={label}>
      {children}
      {label && <VisuallyHidden>{label}</VisuallyHidden>}
    </span>
  );
}

/**
 * Live Region - Dinamik içerik değişikliklerini duyurmak için
 */
interface LiveRegionProps {
  children: React.ReactNode;
  mode?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export function LiveRegion({ 
  children, 
  mode = 'polite',
  atomic = true,
  relevant = 'additions',
  className
}: LiveRegionProps): React.ReactElement {
  return (
    <div
      aria-live={mode}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
}

/**
 * Announcement - Ekran okuyuculara duyuru yapmak için
 */
interface AnnouncementProps {
  message: string;
  mode?: 'polite' | 'assertive';
}

export function Announcement({ 
  message, 
  mode = 'polite' 
}: AnnouncementProps): React.ReactElement | null {
  const [announcement, setAnnouncement] = React.useState('');

  React.useEffect(() => {
    if (message) {
      // Önce temizle, sonra yeni mesajı göster (ekran okuyucunun fark etmesi için)
      setAnnouncement('');
      const timer = setTimeout(() => {
        setAnnouncement(message);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!announcement) return null;

  return (
    <LiveRegion mode={mode}>
      {announcement}
    </LiveRegion>
  );
}
