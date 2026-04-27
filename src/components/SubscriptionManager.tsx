'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Check, Crown, Sparkles, Zap, Calendar, Info, TrendingUp, Star } from 'lucide-react';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { Subscription } from '@/types/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { RevenueCatService } from '@/lib/revenuecat';
import { Capacitor } from '@capacitor/core';
import type { PurchasesOfferings, PurchasesPackage } from '@revenuecat/purchases-capacitor';

interface SubscriptionManagerProps {
  connection: SupabaseConnection;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanPricing {
  currency: string;
  price: string;
  originalPrice?: string;
  discount?: string;
}

interface Plan {
  id: string;
  name: string;
  pricing: {
    tr: PlanPricing;
    usd: PlanPricing;
  };
  period: string;
  icon: React.ReactNode;
  color: string;
  features: PlanFeature[];
  popular?: boolean;
  revenueCatPackage?: PurchasesPackage; // Store the RevenueCat package if available
}

export function SubscriptionManager({ connection }: SubscriptionManagerProps) {
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'tr' | 'usd'>('tr');
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const { t, language } = useLanguage();

  // Set currency based on GEOLOCATION (not language) for pricing security
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        const geoResponse = await fetch('/api/geolocation');
        if (geoResponse.ok) {
          const geoData = await geoResponse.json() as { country?: string };
          // Currency is determined by geographic location, not language
          if (geoData.country === 'TR') {
            setCurrency('tr');
          } else {
            setCurrency('usd');
          }
        }
      } catch (error) {
        console.error('[Subscription] Geolocation detection failed:', error);
        // Fallback to TR for errors
        setCurrency('tr');
      }
    };

    detectCurrency();
  }, []); // Only run once on mount, independent of language changes

  // Load current subscription and RevenueCat offerings
  useEffect(() => {
    const loadSubscription = async () => {
      // 1. Check Native Platform (RevenueCat)
      if (Capacitor.isNativePlatform()) {
        try {
          // Check Status
          const customerInfo = await RevenueCatService.getCustomerInfo();
          if (customerInfo?.activeSubscriptions && customerInfo.activeSubscriptions.length > 0) {
            // Assume premium if any subscription is active for now
            // You can refine this to check specific entitlements
            setCurrentPlan('premium');
            
            // Try to get expiration date from entitlement
            const entitlement = Object.values(customerInfo.entitlements.active)[0];
            if (entitlement && entitlement.expirationDate) {
               const endDate = new Date(entitlement.expirationDate);
               const dateLocale = language === 'tr' ? 'tr-TR' : 'en-US';
               setSubscriptionEndDate(endDate.toLocaleDateString(dateLocale));
            }
          }

          // Fetch Offerings
          const fetchedOfferings = await RevenueCatService.getOfferings();
          if (fetchedOfferings) {
            setOfferings(fetchedOfferings);
          }
        } catch (error) {
          console.error('RevenueCat load error:', error);
        }
      } 
      
      // 2. Check Supabase (Web or sync fallback)
      // Even if native, we might want to check Supabase if RevenueCat didn't return active
      // But typically RevenueCat is the source of truth on mobile.
      // For now, if NOT native, we definitely use Supabase.
      if (!Capacitor.isNativePlatform()) {
        try {
          const { data, error } = await connection.supabase
            .from('subscriptions')
            .select('*')
            .eq('identity', connection.userId)
            .maybeSingle();
          
          if (error) {
            console.error('Subscription load error:', error);
            return;
          }
          
          if (data) {
            setCurrentPlan(data.plan_type);
            if (data.expires_at) {
              const endDate = new Date(data.expires_at);
              const dateLocale = language === 'tr' ? 'tr-TR' : 'en-US';
              setSubscriptionEndDate(endDate.toLocaleDateString(dateLocale));
            }
          }
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Subscription load error:', errorMsg);
        }
      }
    };

    loadSubscription();
  }, [connection, language]);

  const handleUpgrade = async (planType: string) => {
    if (planType === currentPlan) {
      toast.info(t('subscription.alreadyOnPlan'));
      return;
    }

    if (planType === 'free') {
      toast.info(t('subscription.cancelTip'));
      return;
    }

    setIsLoading(true);

    try {
      // NATIVE FLOW (RevenueCat)
      if (Capacitor.isNativePlatform()) {
        if (!offerings?.current?.availablePackages?.length) {
          toast.error('No packages available for purchase.');
          setIsLoading(false);
          return;
        }

        // Find the package matching the plan (simplification: just take the first monthly one or first available)
        // In a real app, you'd map plan IDs to RevenueCat package identifiers.
        const pkg = offerings.current.monthly || offerings.current.availablePackages[0];

        if (!pkg) {
          toast.error('Product not found.');
          setIsLoading(false);
          return;
        }

        const result = await RevenueCatService.purchasePackage(pkg);
        
        if (result?.customerInfo.entitlements.active['premium'] || result?.customerInfo.activeSubscriptions.length) {
          // Success!
           setCurrentPlan('premium');
           toast.success(t('subscription.upgradeSuccess'));
           
           // Optionally sync to Supabase here if you want web to know about mobile sub
           // But usually you rely on webhooks from RevenueCat to your backend for that.
        } else {
           // User cancelled or failed
        }
      } 
      // WEB FLOW (Supabase Simulation)
      else {
        const now = new Date();
        let expiresAt: string | null = null;

        if (planType === 'premium') {
          const expires = new Date(now);
          expires.setMonth(expires.getMonth() + 1);
          expiresAt = expires.toISOString();
        }

        const { error } = await connection.supabase
          .from('subscriptions')
          .upsert({
            identity: connection.userId,
            plan_type: planType as 'free' | 'premium' | 'trial',
            status: 'active',
            started_at: now.toISOString(),
            expires_at: expiresAt,
            auto_renew: true,
            ai_requests_used: 0,
            ai_requests_limit: planType === 'premium' ? 1000 : 10,
          }, { onConflict: 'identity' });

        if (error) {
          console.error('Upgrade error:', error);
          toast.error(t('subscription.upgradeError') + ': ' + error.message);
          return;
        }

        setCurrentPlan(planType);
        if (expiresAt) {
          const endDateObj = new Date(expiresAt);
          const dateLocale = language === 'tr' ? 'tr-TR' : 'en-US';
          setSubscriptionEndDate(endDateObj.toLocaleDateString(dateLocale));
        } else {
          setSubscriptionEndDate(null);
        }

        toast.success(t('subscription.upgradeSuccess'));
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Upgrade error:', errorMsg);
      if (!String(errorMsg).includes('User cancelled')) {
         toast.error(t('subscription.upgradeError') + ': ' + errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format price from RevenueCat package
  const getRevenueCatPrice = (pkg: PurchasesPackage) => {
      return pkg.product.priceString; 
  };

  const getPricing = (plan: Plan): { currency: string, price: string } => {
    // If native and we have a RevenueCat package for this plan, use it
    if (Capacitor.isNativePlatform() && offerings?.current) {
        // Try to match 'premium' to monthly
        if (plan.id === 'premium') {
            const pkg = offerings.current.monthly || offerings.current.availablePackages[0];
            if (pkg) {
                 return { currency: '', price: pkg.product.priceString }; // priceString includes currency symbol
            }
        }
    }
    
    // Fallback to static pricing
    return plan.pricing[currency];
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: t('subscription.free'),
      pricing: {
        tr: { currency: '₺', price: '0' },
        usd: { currency: '$', price: '0' },
      },
      period: t('subscription.freePeriod'),
      icon: <Sparkles className="h-6 w-6" />,
      color: 'from-gray-400 to-gray-500',
      features: [
        { text: t('subscription.calorieTracking'), included: true },
        { text: t('subscription.exerciseLog'), included: true },
        { text: t('subscription.manualFood'), included: true },
        { text: t('subscription.basicReports'), included: true },
        { text: t('subscription.aiPhotoAnalysis'), included: false },
        { text: t('subscription.advancedDatabase'), included: false },
        { text: t('subscription.unlimitedRecipes'), included: false },
      ],
    },
    {
      id: 'premium',
      name: t('subscription.monthly'),
      pricing: {
        tr: { currency: '₺', price: '150' },
        usd: { currency: '$', price: '9.99' },
      },
      period: t('subscription.monthlyPeriod'),
      icon: <Zap className="h-6 w-6" />,
      color: 'from-blue-500 to-purple-500',
      popular: true,
      features: [
        { text: t('subscription.allFreeFeatures'), included: true },
        { text: t('subscription.aiPhotoAnalysis'), included: true },
        { text: t('subscription.advancedDatabase'), included: true },
        { text: t('subscription.unlimitedRecipes'), included: true },
        { text: t('subscription.detailedAnalytics'), included: true },
        { text: t('subscription.prioritySupport'), included: true },
        { text: t('subscription.adFree'), included: true },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan Info */}
      {currentPlan !== 'free' && (
        <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <Crown className="h-4 w-4 text-purple-600" />
          <AlertDescription className="font-doodle-alt">
            <span className="font-semibold">
              {t('subscription.currentPlan')}: {plans.find((p) => p.id === currentPlan)?.name || 'Premium'}
            </span>
            {subscriptionEndDate && (
              <span className="block mt-1 text-sm">
                {t('subscription.endDate')}: {subscriptionEndDate}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* AI Features Info */}
      <Card className="doodle-card border-2 border-dashed border-purple-300 dark:border-purple-700">
        <CardHeader>
          <CardTitle className="font-doodle flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            {t('subscription.aiFeatures')}
          </CardTitle>
          <CardDescription className="font-doodle-alt">
            {t('subscription.aiDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 font-doodle-alt text-sm">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>{t('subscription.aiFeature1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>{t('subscription.aiFeature2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5" />
              <span>{t('subscription.aiFeature3')}</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Currency Info - Language-based */}
      <div className="flex justify-end items-center gap-2">
        <span className="text-sm font-doodle-alt text-gray-600 dark:text-gray-400">
          {Capacitor.isNativePlatform() ? '' : (currency === 'tr' ? '🇹🇷 TL' : '🌍 USD')}
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const pricing = getPricing(plan);
          return (
            <Card
              key={plan.id}
              className={`doodle-card relative ${
                plan.popular ? 'border-2 border-purple-500 shadow-lg' : ''
              } ${currentPlan === plan.id ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white font-doodle">
                    {t('subscription.mostPopular')}
                  </Badge>
                </div>
              )}

              {currentPlan === plan.id && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-500 text-white font-doodle">
                    {t('subscription.active')}
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-2`}
                >
                  {plan.icon}
                </div>
                <CardTitle className="font-doodle text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold font-doodle">
                    {pricing.currency}
                    {pricing.price}
                  </span>
                  <span className="text-sm text-gray-500 font-doodle-alt">/ {plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-doodle-alt">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <span className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0">✕</span>
                      )}
                      <span className={feature.included ? '' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading || currentPlan === plan.id}
                  className={`w-full font-doodle ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                      : ''
                  }`}
                  variant={currentPlan === plan.id ? 'outline' : 'default'}
                >
                  {isLoading ? (
                    t('subscription.processing')
                  ) : currentPlan === plan.id ? (
                    t('subscription.currentPlanButton')
                  ) : plan.id === 'free' ? (
                    t('subscription.useFree')
                  ) : (
                    t('subscription.upgrade')
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="font-doodle-alt text-sm">
          <strong>{Capacitor.isNativePlatform() ? 'App Store / Play Store' : t('subscription.demoNote')}</strong> {Capacitor.isNativePlatform() ? 'Payments are processed securely via store.' : t('subscription.demoDescription')}
        </AlertDescription>
      </Alert>
    </div>
  );
}
