import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitto.app',
  appName: 'Fitto',
  // Next.js static export output directory.
  // Generate it with: `yarn build:mobile` (sets MOBILE_BUILD=true so
  // next.config.mjs activates `output: 'export'`).
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
