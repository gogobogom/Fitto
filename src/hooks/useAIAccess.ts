'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AIConnection {
  requiresSubscription?: boolean;
  trialDays?: number;
}

export type AIAccessStatus = 'premium' | 'trial' | 'ad_credits' | 'no_access';

export interface AITrialStatus {
  daysLeft: number;
  messagesLeft: number;
  dailyLimit: number;
}

export interface AIAccessResult {
  accessStatus: AIAccessStatus;
  isPremium: boolean;
  trialStatus: AITrialStatus | null;
  adCredits: number;
  startTrial: () => Promise<void>;
  addAdCredits: (count: number) => Promise<void>;
  consumeCredit: () => Promise<void>;
  showUpgrade: () => void;
}

const TRIAL_DURATION_DAYS = 3;
const TRIAL_DAILY_MESSAGE_LIMIT = 10;
const STORAGE_KEY_TRIAL_START = 'fitto_ai_trial_start';
const STORAGE_KEY_TRIAL_MESSAGES = 'fitto_ai_trial_messages';
const STORAGE_KEY_AD_CREDITS = 'fitto_ai_ad_credits';
const STORAGE_KEY_SUBSCRIPTION = 'fitto_subscription';

export function useAIAccess(connection: AIConnection = {}): AIAccessResult {
  const router = useRouter();
  const [accessStatus, setAccessStatus] = useState<AIAccessStatus>('no_access');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [trialStatus, setTrialStatus] = useState<AITrialStatus | null>(null);
  const [adCredits, setAdCredits] = useState<number>(0);

  const calculateAccess = useCallback((): void => {
    try {
      // Check premium subscription
      const subscriptionData = localStorage.getItem(STORAGE_KEY_SUBSCRIPTION);
      const hasValidSubscription = subscriptionData 
        ? JSON.parse(subscriptionData).isActive === true 
        : false;

      if (hasValidSubscription) {
        setAccessStatus('premium');
        setIsPremium(true);
        setTrialStatus(null);
        return;
      }

      setIsPremium(false);

      // If feature doesn't require subscription, grant access
      if (!connection.requiresSubscription) {
        setAccessStatus('premium'); // Treat as premium for free features
        setTrialStatus(null);
        return;
      }

      // Check trial status
      const trialStartStr = localStorage.getItem(STORAGE_KEY_TRIAL_START);
      const now = new Date();

      if (trialStartStr) {
        const trialStart = new Date(trialStartStr);
        const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, TRIAL_DURATION_DAYS - daysSinceStart);

        if (daysLeft > 0) {
          // Get today's messages count
          const messagesDataStr = localStorage.getItem(STORAGE_KEY_TRIAL_MESSAGES);
          const messagesData = messagesDataStr ? JSON.parse(messagesDataStr) : {};
          const today = now.toISOString().split('T')[0];
          const todayMessages = messagesData[today] || 0;
          const messagesLeft = Math.max(0, TRIAL_DAILY_MESSAGE_LIMIT - todayMessages);

          setAccessStatus('trial');
          setTrialStatus({
            daysLeft,
            messagesLeft,
            dailyLimit: TRIAL_DAILY_MESSAGE_LIMIT,
          });
          return;
        }
      }

      // Check ad credits
      const creditsStr = localStorage.getItem(STORAGE_KEY_AD_CREDITS);
      const credits = creditsStr ? parseInt(creditsStr, 10) : 0;
      setAdCredits(credits);

      if (credits > 0) {
        setAccessStatus('ad_credits');
        setTrialStatus(null);
        return;
      }

      // No access
      setAccessStatus('no_access');
      setTrialStatus(null);
    } catch (error) {
      console.error('Error calculating AI access:', error);
      setAccessStatus('no_access');
      setIsPremium(false);
      setTrialStatus(null);
      setAdCredits(0);
    }
  }, [connection.requiresSubscription]);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      calculateAccess();
    }

    // Check access periodically (every 60 seconds)
    const intervalId = setInterval(() => {
      if (isMounted) {
        calculateAccess();
      }
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [calculateAccess]);

  const startTrial = useCallback(async (): Promise<void> => {
    try {
      const now = new Date();
      localStorage.setItem(STORAGE_KEY_TRIAL_START, now.toISOString());
      localStorage.setItem(STORAGE_KEY_TRIAL_MESSAGES, JSON.stringify({}));
      calculateAccess();
    } catch (error) {
      console.error('Error starting trial:', error);
      throw error;
    }
  }, [calculateAccess]);

  const addAdCredits = useCallback(async (count: number): Promise<void> => {
    try {
      const creditsStr = localStorage.getItem(STORAGE_KEY_AD_CREDITS);
      const currentCredits = creditsStr ? parseInt(creditsStr, 10) : 0;
      const newCredits = currentCredits + count;
      localStorage.setItem(STORAGE_KEY_AD_CREDITS, String(newCredits));
      setAdCredits(newCredits);
      calculateAccess();
    } catch (error) {
      console.error('Error adding ad credits:', error);
      throw error;
    }
  }, [calculateAccess]);

  const consumeCredit = useCallback(async (): Promise<void> => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      if (accessStatus === 'trial') {
        // Increment today's message count
        const messagesDataStr = localStorage.getItem(STORAGE_KEY_TRIAL_MESSAGES);
        const messagesData = messagesDataStr ? JSON.parse(messagesDataStr) : {};
        messagesData[today] = (messagesData[today] || 0) + 1;
        localStorage.setItem(STORAGE_KEY_TRIAL_MESSAGES, JSON.stringify(messagesData));
        calculateAccess();
      } else if (accessStatus === 'ad_credits') {
        // Decrement ad credits
        const creditsStr = localStorage.getItem(STORAGE_KEY_AD_CREDITS);
        const currentCredits = creditsStr ? parseInt(creditsStr, 10) : 0;
        const newCredits = Math.max(0, currentCredits - 1);
        localStorage.setItem(STORAGE_KEY_AD_CREDITS, String(newCredits));
        setAdCredits(newCredits);
        calculateAccess();
      }
      // Premium users don't need to consume credits
    } catch (error) {
      console.error('Error consuming credit:', error);
      throw error;
    }
  }, [accessStatus, calculateAccess]);

  const showUpgrade = useCallback((): void => {
    router.push('/subscription?upgrade=true');
  }, [router]);

  return {
    accessStatus,
    isPremium,
    trialStatus,
    adCredits,
    startTrial,
    addAdCredits,
    consumeCredit,
    showUpgrade,
  };
}
