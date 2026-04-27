/**
 * Critical CSS Extraction and Optimization
 * Extracts and inlines critical CSS for faster First Contentful Paint (FCP)
 */

// Critical CSS rules for above-the-fold content
export const criticalCSSRules = `
/* Critical Reset & Base */
*,*::before,*::after{box-sizing:border-box}
html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif}
body{margin:0;padding:0;min-height:100vh;background-color:hsl(var(--background));color:hsl(var(--foreground))}

/* Critical Layout */
.min-h-screen{min-height:100vh}
.flex{display:flex}
.flex-col{flex-direction:column}
.items-center{align-items:center}
.justify-center{justify-content:center}
.w-full{width:100%}
.h-full{height:100%}
.overflow-hidden{overflow:hidden}
.overflow-x-hidden{overflow-x:hidden}

/* Critical Spacing */
.p-4{padding:1rem}
.px-4{padding-left:1rem;padding-right:1rem}
.py-2{padding-top:0.5rem;padding-bottom:0.5rem}
.pt-12{padding-top:3rem}
.pb-20{padding-bottom:5rem}
.mb-4{margin-bottom:1rem}
.mt-4{margin-top:1rem}
.gap-4{gap:1rem}

/* Critical Typography */
.text-sm{font-size:0.875rem;line-height:1.25rem}
.text-base{font-size:1rem;line-height:1.5rem}
.text-lg{font-size:1.125rem;line-height:1.75rem}
.text-xl{font-size:1.25rem;line-height:1.75rem}
.text-2xl{font-size:1.5rem;line-height:2rem}
.font-medium{font-weight:500}
.font-semibold{font-weight:600}
.font-bold{font-weight:700}
.text-center{text-align:center}

/* Critical Colors */
.bg-background{background-color:hsl(var(--background))}
.text-foreground{color:hsl(var(--foreground))}
.bg-primary{background-color:hsl(var(--primary))}
.text-primary{color:hsl(var(--primary))}
.bg-card{background-color:hsl(var(--card))}
.text-muted-foreground{color:hsl(var(--muted-foreground))}

/* Critical Borders */
.rounded{border-radius:0.25rem}
.rounded-lg{border-radius:0.5rem}
.rounded-xl{border-radius:0.75rem}
.rounded-2xl{border-radius:1rem}
.rounded-full{border-radius:9999px}
.border{border-width:1px}
.border-border{border-color:hsl(var(--border))}

/* Critical Shadows */
.shadow{box-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1)}
.shadow-lg{box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1)}

/* Critical Positioning */
.relative{position:relative}
.absolute{position:absolute}
.fixed{position:fixed}
.inset-0{inset:0}
.z-10{z-index:10}
.z-50{z-index:50}

/* Critical Button Styles */
.cursor-pointer{cursor:pointer}
.select-none{user-select:none}
.touch-manipulation{touch-action:manipulation}
.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(0.4,0,0.2,1);transition-duration:150ms}

/* Critical Loading States */
@keyframes pulse{50%{opacity:.5}}
.animate-pulse{animation:pulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.animate-spin{animation:spin 1s linear infinite}

/* Safe Area Support */
.safe-top{padding-top:env(safe-area-inset-top)}
.safe-bottom{padding-bottom:env(safe-area-inset-bottom)}

/* Critical Dark Mode */
.dark body{background-color:hsl(222 47% 11%);color:hsl(210 40% 98%)}
.dark .bg-background{background-color:hsl(222 47% 11%)}
.dark .text-foreground{color:hsl(210 40% 98%)}
.dark .bg-card{background-color:hsl(222 47% 11%)}
.dark .border-border{border-color:hsl(217 33% 20%)}

/* Skeleton Loading */
.skeleton{background:linear-gradient(90deg,hsl(var(--muted)) 25%,hsl(var(--muted-foreground)/0.1) 50%,hsl(var(--muted)) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* Hide scrollbar during initial load */
.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
.no-scrollbar::-webkit-scrollbar{display:none}

/* Anti-aliased text */
.antialiased{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
`;

// Minified critical CSS
export const minifiedCriticalCSS = criticalCSSRules
  .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
  .replace(/\s+/g, ' ') // Collapse whitespace
  .replace(/\s*([{};:,])\s*/g, '$1') // Remove whitespace around special chars
  .replace(/;}/g, '}') // Remove trailing semicolons
  .trim();

/**
 * Generate inline style tag for critical CSS
 */
export function generateCriticalStyleTag(): string {
  return `<style id="critical-css">${minifiedCriticalCSS}</style>`;
}

/**
 * CSS property priority map for critical path
 */
export const criticalProperties = new Set([
  'display',
  'position',
  'width',
  'height',
  'min-height',
  'max-height',
  'min-width',
  'max-width',
  'margin',
  'padding',
  'box-sizing',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'color',
  'background-color',
  'background',
  'border',
  'border-radius',
  'overflow',
  'visibility',
  'opacity',
  'z-index',
  'flex',
  'flex-direction',
  'align-items',
  'justify-content',
  'gap',
]);

/**
 * Extract critical CSS from computed styles
 */
export function extractCriticalFromElement(element: Element): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const computed = window.getComputedStyle(element);
  const critical: Record<string, string> = {};

  criticalProperties.forEach((prop) => {
    const value = computed.getPropertyValue(prop);
    if (value && value !== 'initial' && value !== 'auto' && value !== 'none') {
      critical[prop] = value;
    }
  });

  return critical;
}

/**
 * Generate critical CSS for above-the-fold elements
 */
export function generateCriticalCSSForViewport(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return minifiedCriticalCSS;
  }

  const viewportHeight = window.innerHeight;
  const criticalSelectors = new Map<string, Record<string, string>>();

  // Get all elements above the fold
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const rect = (node as Element).getBoundingClientRect();
        return rect.top < viewportHeight
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    }
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    const classes = Array.from(element.classList).join('.');
    const selector = classes ? `${tagName}.${classes}` : tagName;

    if (!criticalSelectors.has(selector)) {
      criticalSelectors.set(selector, extractCriticalFromElement(element));
    }
  }

  // Generate CSS rules
  const rules: string[] = [];
  criticalSelectors.forEach((styles, selector) => {
    const declarations = Object.entries(styles)
      .map(([prop, value]) => `${prop}:${value}`)
      .join(';');
    if (declarations) {
      rules.push(`${selector}{${declarations}}`);
    }
  });

  return rules.join('');
}

/**
 * Preload non-critical CSS
 */
export function preloadStylesheet(href: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = () => {
    link.rel = 'stylesheet';
  };
  document.head.appendChild(link);
}

/**
 * Defer non-critical CSS loading
 */
export function deferStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = 'print';
    link.onload = () => {
      link.media = 'all';
      resolve();
    };
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * Remove critical CSS after full CSS loads
 */
export function removeCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  const criticalStyle = document.getElementById('critical-css');
  if (criticalStyle) {
    // Use requestIdleCallback for non-blocking removal
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        criticalStyle.remove();
      });
    } else {
      setTimeout(() => {
        criticalStyle.remove();
      }, 0);
    }
  }
}

/**
 * Check if full CSS is loaded
 */
export function isCSSLoaded(href: string): boolean {
  if (typeof document === 'undefined') return false;

  const stylesheets = document.styleSheets;
  for (let i = 0; i < stylesheets.length; i++) {
    try {
      if (stylesheets[i].href === href) {
        return true;
      }
    } catch {
      // CORS error - stylesheet from different origin
    }
  }
  return false;
}

/**
 * Font display optimization
 */
export const fontDisplayCSS = `
@font-face {
  font-family: 'Geist';
  font-display: swap;
}
@font-face {
  font-family: 'Caveat';
  font-display: swap;
}
@font-face {
  font-family: 'Architects Daughter';
  font-display: swap;
}
`;

/**
 * Critical CSS for loading states
 */
export const loadingStateCSS = `
.loading-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}
@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f0f0f0;
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
`;

/**
 * CSS containment for performance
 */
export const containmentCSS = `
.contain-layout { contain: layout; }
.contain-paint { contain: paint; }
.contain-strict { contain: strict; }
.contain-content { contain: content; }
.will-change-transform { will-change: transform; }
.will-change-opacity { will-change: opacity; }
`;

/**
 * Get all critical CSS combined
 */
export function getAllCriticalCSS(): string {
  return [
    minifiedCriticalCSS,
    fontDisplayCSS.replace(/\s+/g, ' ').trim(),
    loadingStateCSS.replace(/\s+/g, ' ').trim(),
    containmentCSS.replace(/\s+/g, ' ').trim(),
  ].join('');
}

export default {
  criticalCSSRules,
  minifiedCriticalCSS,
  generateCriticalStyleTag,
  extractCriticalFromElement,
  generateCriticalCSSForViewport,
  preloadStylesheet,
  deferStylesheet,
  removeCriticalCSS,
  isCSSLoaded,
  fontDisplayCSS,
  loadingStateCSS,
  containmentCSS,
  getAllCriticalCSS,
};
