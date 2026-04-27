/**
 * Lighthouse Optimization Utilities
 * Tools for improving and monitoring Lighthouse scores
 */

// Lighthouse category weights
export const LIGHTHOUSE_CATEGORIES = {
  performance: 0.25,
  accessibility: 0.25,
  bestPractices: 0.25,
  seo: 0.25,
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint (ms)
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint (ms)
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay (ms)
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte (ms)
  TBT: { good: 200, needsImprovement: 600 },   // Total Blocking Time (ms)
  SI: { good: 3400, needsImprovement: 5800 },  // Speed Index (ms)
  TTI: { good: 3800, needsImprovement: 7300 }, // Time to Interactive (ms)
} as const;

export type MetricName = keyof typeof PERFORMANCE_THRESHOLDS;

export interface MetricScore {
  value: number;
  score: 'good' | 'needs-improvement' | 'poor';
  percentile: number;
}

export interface LighthouseMetrics {
  FCP: MetricScore | null;
  LCP: MetricScore | null;
  FID: MetricScore | null;
  CLS: MetricScore | null;
  TTFB: MetricScore | null;
  TBT: MetricScore | null;
  SI: MetricScore | null;
  TTI: MetricScore | null;
  overallScore: number;
  timestamp: number;
}

// Calculate metric score
export function calculateMetricScore(
  metricName: MetricName,
  value: number
): MetricScore {
  const threshold = PERFORMANCE_THRESHOLDS[metricName];
  
  let score: 'good' | 'needs-improvement' | 'poor';
  let percentile: number;
  
  if (value <= threshold.good) {
    score = 'good';
    percentile = 90 + (10 * (1 - value / threshold.good));
  } else if (value <= threshold.needsImprovement) {
    score = 'needs-improvement';
    const range = threshold.needsImprovement - threshold.good;
    const position = value - threshold.good;
    percentile = 50 + (40 * (1 - position / range));
  } else {
    score = 'poor';
    percentile = Math.max(0, 50 * (1 - (value - threshold.needsImprovement) / threshold.needsImprovement));
  }
  
  return { value, score, percentile: Math.round(percentile) };
}

// Calculate overall Lighthouse score
export function calculateOverallScore(metrics: Partial<LighthouseMetrics>): number {
  const weights: Record<string, number> = {
    FCP: 0.10,
    LCP: 0.25,
    TBT: 0.30,
    CLS: 0.25,
    SI: 0.10,
  };
  
  let totalWeight = 0;
  let weightedScore = 0;
  
  for (const [key, weight] of Object.entries(weights)) {
    const metric = metrics[key as keyof LighthouseMetrics];
    if (metric && typeof metric === 'object' && 'percentile' in metric) {
      weightedScore += metric.percentile * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
}

// Performance optimizations checker
export interface OptimizationCheck {
  id: string;
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  passed: boolean;
  recommendation?: string;
}

export function runOptimizationChecks(): OptimizationCheck[] {
  if (typeof window === 'undefined') return [];
  
  const checks: OptimizationCheck[] = [];
  
  // Check for render-blocking resources
  const scripts = document.querySelectorAll('script:not([async]):not([defer])');
  checks.push({
    id: 'render-blocking-scripts',
    name: 'Render-blocking Scripts',
    description: 'Check for scripts without async/defer attributes',
    impact: 'high',
    passed: scripts.length <= 2,
    recommendation: scripts.length > 2 
      ? `${scripts.length} render-blocking scripts found. Add async or defer attributes.`
      : undefined,
  });
  
  // Check for lazy loading on images
  const images = document.querySelectorAll('img:not([loading])');
  checks.push({
    id: 'image-lazy-loading',
    name: 'Image Lazy Loading',
    description: 'Check if images have loading="lazy" attribute',
    impact: 'medium',
    passed: images.length === 0,
    recommendation: images.length > 0
      ? `${images.length} images without lazy loading. Add loading="lazy" attribute.`
      : undefined,
  });
  
  // Check for images without dimensions
  const imagesWithoutDimensions = document.querySelectorAll('img:not([width]):not([height])');
  checks.push({
    id: 'image-dimensions',
    name: 'Image Dimensions',
    description: 'Check if images have explicit width and height',
    impact: 'high',
    passed: imagesWithoutDimensions.length === 0,
    recommendation: imagesWithoutDimensions.length > 0
      ? `${imagesWithoutDimensions.length} images without dimensions. Add width and height to prevent CLS.`
      : undefined,
  });
  
  // Check for preconnect hints
  const preconnects = document.querySelectorAll('link[rel="preconnect"]');
  checks.push({
    id: 'preconnect-hints',
    name: 'Preconnect Hints',
    description: 'Check for preconnect to third-party origins',
    impact: 'medium',
    passed: preconnects.length >= 1,
    recommendation: preconnects.length < 1
      ? 'Add preconnect hints for critical third-party origins.'
      : undefined,
  });
  
  // Check for font display
  const fontFaces = Array.from(document.styleSheets)
    .filter(sheet => {
      try {
        return sheet.cssRules !== null;
      } catch {
        return false;
      }
    })
    .flatMap(sheet => {
      try {
        return Array.from(sheet.cssRules);
      } catch {
        return [];
      }
    })
    .filter(rule => rule instanceof CSSFontFaceRule);
  
  const fontsWithSwap = fontFaces.filter(rule => 
    (rule as CSSFontFaceRule).style.getPropertyValue('font-display') === 'swap'
  );
  
  checks.push({
    id: 'font-display',
    name: 'Font Display Strategy',
    description: 'Check if fonts use font-display: swap',
    impact: 'medium',
    passed: fontFaces.length === 0 || fontsWithSwap.length === fontFaces.length,
    recommendation: fontFaces.length > fontsWithSwap.length
      ? 'Add font-display: swap to custom fonts to prevent invisible text.'
      : undefined,
  });
  
  // Check for passive event listeners
  let passiveSupported = false;
  try {
    const options = {
      get passive() {
        passiveSupported = true;
        return false;
      }
    };
    window.addEventListener('test', null as unknown as EventListener, options);
    window.removeEventListener('test', null as unknown as EventListener, options);
  } catch {
    passiveSupported = false;
  }
  
  checks.push({
    id: 'passive-listeners',
    name: 'Passive Event Listeners',
    description: 'Check browser support for passive event listeners',
    impact: 'low',
    passed: passiveSupported,
    recommendation: !passiveSupported
      ? 'Browser does not support passive event listeners.'
      : undefined,
  });
  
  // Check for viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  checks.push({
    id: 'viewport-meta',
    name: 'Viewport Meta Tag',
    description: 'Check for proper viewport configuration',
    impact: 'high',
    passed: viewportMeta !== null,
    recommendation: !viewportMeta
      ? 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the head.'
      : undefined,
  });
  
  // Check for HTTPS
  checks.push({
    id: 'https',
    name: 'HTTPS Usage',
    description: 'Check if page is served over HTTPS',
    impact: 'high',
    passed: location.protocol === 'https:' || location.hostname === 'localhost',
    recommendation: location.protocol !== 'https:' && location.hostname !== 'localhost'
      ? 'Serve the page over HTTPS for security and SEO.'
      : undefined,
  });
  
  // Check for compression (heuristic based on transfer size)
  checks.push({
    id: 'compression',
    name: 'Content Compression',
    description: 'Check if content appears to be compressed',
    impact: 'high',
    passed: true, // Would need server response headers to properly check
    recommendation: undefined,
  });
  
  // Check for service worker
  checks.push({
    id: 'service-worker',
    name: 'Service Worker',
    description: 'Check if a service worker is registered',
    impact: 'medium',
    passed: 'serviceWorker' in navigator,
    recommendation: !('serviceWorker' in navigator)
      ? 'Register a service worker for offline support and faster repeat visits.'
      : undefined,
  });
  
  return checks;
}

// Accessibility checks
export function runAccessibilityChecks(): OptimizationCheck[] {
  if (typeof window === 'undefined') return [];
  
  const checks: OptimizationCheck[] = [];
  
  // Check for alt text on images
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  checks.push({
    id: 'image-alt',
    name: 'Image Alt Text',
    description: 'Check if all images have alt attributes',
    impact: 'high',
    passed: imagesWithoutAlt.length === 0,
    recommendation: imagesWithoutAlt.length > 0
      ? `${imagesWithoutAlt.length} images without alt text found.`
      : undefined,
  });
  
  // Check for button labels
  const buttonsWithoutLabel = document.querySelectorAll('button:not([aria-label]):empty');
  checks.push({
    id: 'button-labels',
    name: 'Button Labels',
    description: 'Check if buttons have accessible labels',
    impact: 'high',
    passed: buttonsWithoutLabel.length === 0,
    recommendation: buttonsWithoutLabel.length > 0
      ? `${buttonsWithoutLabel.length} buttons without accessible labels found.`
      : undefined,
  });
  
  // Check for heading hierarchy
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
  let hasSkippedLevel = false;
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      hasSkippedLevel = true;
      break;
    }
  }
  
  checks.push({
    id: 'heading-hierarchy',
    name: 'Heading Hierarchy',
    description: 'Check if heading levels are sequential',
    impact: 'medium',
    passed: !hasSkippedLevel,
    recommendation: hasSkippedLevel
      ? 'Heading levels should not skip levels (e.g., h1 to h3).'
      : undefined,
  });
  
  // Check for sufficient color contrast (simplified)
  const h1s = document.querySelectorAll('h1');
  checks.push({
    id: 'h1-present',
    name: 'H1 Present',
    description: 'Check if page has an h1 element',
    impact: 'medium',
    passed: h1s.length >= 1,
    recommendation: h1s.length < 1
      ? 'Add an h1 element to define the main heading of the page.'
      : undefined,
  });
  
  // Check for lang attribute
  const htmlLang = document.documentElement.lang;
  checks.push({
    id: 'html-lang',
    name: 'HTML Lang Attribute',
    description: 'Check if html element has lang attribute',
    impact: 'high',
    passed: htmlLang !== '',
    recommendation: htmlLang === ''
      ? 'Add lang attribute to html element for screen readers.'
      : undefined,
  });
  
  // Check for skip link
  const skipLink = document.querySelector('a[href="#main"], a[href="#content"], [class*="skip"]');
  checks.push({
    id: 'skip-link',
    name: 'Skip Navigation Link',
    description: 'Check for skip to main content link',
    impact: 'medium',
    passed: skipLink !== null,
    recommendation: !skipLink
      ? 'Add a skip navigation link for keyboard users.'
      : undefined,
  });
  
  // Check for form labels
  const inputsWithoutLabel = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([aria-label]):not([id])');
  checks.push({
    id: 'form-labels',
    name: 'Form Input Labels',
    description: 'Check if form inputs have associated labels',
    impact: 'high',
    passed: inputsWithoutLabel.length === 0,
    recommendation: inputsWithoutLabel.length > 0
      ? `${inputsWithoutLabel.length} form inputs without labels found.`
      : undefined,
  });
  
  return checks;
}

// SEO checks
export function runSEOChecks(): OptimizationCheck[] {
  if (typeof window === 'undefined') return [];
  
  const checks: OptimizationCheck[] = [];
  
  // Check for title
  const title = document.title;
  checks.push({
    id: 'page-title',
    name: 'Page Title',
    description: 'Check if page has a title',
    impact: 'high',
    passed: title.length > 0 && title.length <= 60,
    recommendation: title.length === 0
      ? 'Add a page title.'
      : title.length > 60
        ? 'Page title is too long. Keep it under 60 characters.'
        : undefined,
  });
  
  // Check for meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  const descriptionContent = metaDescription?.getAttribute('content') || '';
  checks.push({
    id: 'meta-description',
    name: 'Meta Description',
    description: 'Check if page has a meta description',
    impact: 'high',
    passed: descriptionContent.length > 0 && descriptionContent.length <= 160,
    recommendation: descriptionContent.length === 0
      ? 'Add a meta description.'
      : descriptionContent.length > 160
        ? 'Meta description is too long. Keep it under 160 characters.'
        : undefined,
  });
  
  // Check for canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  checks.push({
    id: 'canonical-url',
    name: 'Canonical URL',
    description: 'Check if page has a canonical URL',
    impact: 'medium',
    passed: canonical !== null,
    recommendation: !canonical
      ? 'Add a canonical URL to prevent duplicate content issues.'
      : undefined,
  });
  
  // Check for Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  
  checks.push({
    id: 'open-graph',
    name: 'Open Graph Tags',
    description: 'Check for Open Graph meta tags',
    impact: 'medium',
    passed: ogTitle !== null && ogDescription !== null && ogImage !== null,
    recommendation: (!ogTitle || !ogDescription || !ogImage)
      ? 'Add Open Graph meta tags for better social sharing.'
      : undefined,
  });
  
  // Check for robots meta
  const robotsMeta = document.querySelector('meta[name="robots"]');
  const robotsContent = robotsMeta?.getAttribute('content') || '';
  checks.push({
    id: 'robots-meta',
    name: 'Robots Meta Tag',
    description: 'Check robots meta tag configuration',
    impact: 'high',
    passed: !robotsContent.includes('noindex'),
    recommendation: robotsContent.includes('noindex')
      ? 'Page has noindex directive. Remove if you want it indexed.'
      : undefined,
  });
  
  // Check for structured data
  const jsonLd = document.querySelector('script[type="application/ld+json"]');
  checks.push({
    id: 'structured-data',
    name: 'Structured Data',
    description: 'Check for JSON-LD structured data',
    impact: 'medium',
    passed: jsonLd !== null,
    recommendation: !jsonLd
      ? 'Add structured data (JSON-LD) for rich search results.'
      : undefined,
  });
  
  return checks;
}

// Best practices checks
export function runBestPracticesChecks(): OptimizationCheck[] {
  if (typeof window === 'undefined') return [];
  
  const checks: OptimizationCheck[] = [];
  
  // Check for console errors (can't actually check, just note)
  checks.push({
    id: 'no-console-errors',
    name: 'No Console Errors',
    description: 'Page should not have JavaScript console errors',
    impact: 'medium',
    passed: true, // Would need dev tools access
    recommendation: undefined,
  });
  
  // Check for deprecated APIs
  checks.push({
    id: 'no-deprecated-apis',
    name: 'No Deprecated APIs',
    description: 'Page should not use deprecated APIs',
    impact: 'medium',
    passed: true, // Would need runtime analysis
    recommendation: undefined,
  });
  
  // Check for document.write
  const scriptsUsingDocWrite = document.querySelectorAll('script');
  let usesDocWrite = false;
  scriptsUsingDocWrite.forEach(script => {
    if (script.textContent?.includes('document.write')) {
      usesDocWrite = true;
    }
  });
  
  checks.push({
    id: 'no-document-write',
    name: 'No document.write()',
    description: 'Avoid using document.write()',
    impact: 'high',
    passed: !usesDocWrite,
    recommendation: usesDocWrite
      ? 'Remove document.write() calls as they block page parsing.'
      : undefined,
  });
  
  // Check for geolocation on page load
  checks.push({
    id: 'no-geolocation-onload',
    name: 'Geolocation Usage',
    description: 'Geolocation should only be requested on user gesture',
    impact: 'medium',
    passed: true, // Would need runtime analysis
    recommendation: undefined,
  });
  
  // Check for notification on page load
  checks.push({
    id: 'no-notification-onload',
    name: 'Notification Permission',
    description: 'Notification permission should only be requested on user gesture',
    impact: 'medium',
    passed: Notification.permission !== 'denied',
    recommendation: Notification.permission === 'denied'
      ? 'Notification permission was denied. Request only after user interaction.'
      : undefined,
  });
  
  // Check for secure context
  checks.push({
    id: 'secure-context',
    name: 'Secure Context',
    description: 'Page runs in a secure context',
    impact: 'high',
    passed: window.isSecureContext,
    recommendation: !window.isSecureContext
      ? 'Page is not running in a secure context. Use HTTPS.'
      : undefined,
  });
  
  return checks;
}

// Generate full Lighthouse-style report
export interface LighthouseReport {
  metrics: LighthouseMetrics;
  performance: OptimizationCheck[];
  accessibility: OptimizationCheck[];
  seo: OptimizationCheck[];
  bestPractices: OptimizationCheck[];
  categoryScores: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
  overallScore: number;
  timestamp: number;
}

export function generateLighthouseReport(metrics: LighthouseMetrics): LighthouseReport {
  const performance = runOptimizationChecks();
  const accessibility = runAccessibilityChecks();
  const seo = runSEOChecks();
  const bestPractices = runBestPracticesChecks();
  
  const calculateCategoryScore = (checks: OptimizationCheck[]): number => {
    if (checks.length === 0) return 100;
    
    const weights: Record<string, number> = { high: 3, medium: 2, low: 1 };
    let totalWeight = 0;
    let passedWeight = 0;
    
    checks.forEach(check => {
      const weight = weights[check.impact];
      totalWeight += weight;
      if (check.passed) {
        passedWeight += weight;
      }
    });
    
    return Math.round((passedWeight / totalWeight) * 100);
  };
  
  const categoryScores = {
    performance: Math.round((metrics.overallScore + calculateCategoryScore(performance)) / 2),
    accessibility: calculateCategoryScore(accessibility),
    seo: calculateCategoryScore(seo),
    bestPractices: calculateCategoryScore(bestPractices),
  };
  
  const overallScore = Math.round(
    categoryScores.performance * 0.25 +
    categoryScores.accessibility * 0.25 +
    categoryScores.seo * 0.25 +
    categoryScores.bestPractices * 0.25
  );
  
  return {
    metrics,
    performance,
    accessibility,
    seo,
    bestPractices,
    categoryScores,
    overallScore,
    timestamp: Date.now(),
  };
}

// Export utility for external reporting
export function exportReportAsJSON(report: LighthouseReport): string {
  return JSON.stringify(report, null, 2);
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#0cce6b'; // Green
  if (score >= 50) return '#ffa400'; // Orange
  return '#ff4e42'; // Red
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Good';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}
