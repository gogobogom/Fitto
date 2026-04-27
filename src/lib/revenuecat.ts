import { Purchases, LOG_LEVEL, PurchasesPackage, CustomerInfo, PurchasesOfferings } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

// API Keys - Replace these with your actual keys from RevenueCat Dashboard
const API_KEYS = {
  ios: 'appl_your_ios_api_key',
  android: 'goog_your_android_api_key',
};

export class RevenueCatService {
  private static isInitialized = false;

  static async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.warn('RevenueCat: Not running on a native platform. Purchases will be simulated or disabled.');
      return;
    }

    if (this.isInitialized) return;

    try {
      if (Capacitor.getPlatform() === 'ios') {
        await Purchases.configure({ apiKey: API_KEYS.ios });
      } else if (Capacitor.getPlatform() === 'android') {
        await Purchases.configure({ apiKey: API_KEYS.android });
      }

      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      
      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
    }
  }

  static async getOfferings(): Promise<PurchasesOfferings | null> {
    if (!Capacitor.isNativePlatform()) {
      console.log('RevenueCat: getOfferings called on web - returning null');
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  static async purchasePackage(pkg: PurchasesPackage): Promise<{ customerInfo: CustomerInfo; productIdentifier: string; } | null> {
    if (!Capacitor.isNativePlatform()) {
      console.log('RevenueCat: purchasePackage called on web');
      return null;
    }

    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage({ aPackage: pkg });
      return { customerInfo, productIdentifier };
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase error:', error);
      }
      return null;
    }
  }

  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }
}
