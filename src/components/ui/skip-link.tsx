'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Skip Link - Klavye kullanıcıları için ana içeriğe atlama bağlantısı
 * Tab tuşuna basıldığında görünür olur
 */
export function SkipLink({ 
  href = '#main-content', 
  children = 'Ana içeriğe atla',
  className 
}: SkipLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      className={cn(
        // Varsayılan olarak gizli
        'sr-only',
        // Focus aldığında görünür
        'focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white',
        'focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300',
        'focus:font-medium focus:text-sm',
        'transition-all duration-200',
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Skip Links Container - Birden fazla atlama bağlantısı
 */
interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

export function SkipLinks({ links }: SkipLinksProps): React.ReactElement {
  const defaultLinks = [
    { href: '#main-content', label: 'Ana içeriğe atla' },
    { href: '#navigation', label: 'Navigasyona atla' },
  ];

  const skipLinks = links || defaultLinks;

  return (
    <div className="skip-links">
      {skipLinks.map((link, index) => (
        <SkipLink key={index} href={link.href}>
          {link.label}
        </SkipLink>
      ))}
    </div>
  );
}
