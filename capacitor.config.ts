import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitto.app',
  appName: 'Fitto',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
