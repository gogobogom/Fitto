'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface UseAuthResult extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const STORAGE_KEY = 'fitto_user';

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    isMountedRef.current = true;

    const loadUser = (): void => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        if (storedUser && isMountedRef.current) {
          const parsedUser: User = JSON.parse(storedUser);
          // Validate user object structure
          if (parsedUser.id && parsedUser.email && parsedUser.name) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: { user: User } = await response.json();

      if (!data.user || !data.user.id) {
        throw new Error('Invalid response from server');
      }

      if (isMountedRef.current) {
        setUser(data.user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        setError(null);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        setError(errorMessage);
        throw err;
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      });
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with local logout even if API call fails
    } finally {
      if (isMountedRef.current) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
      }
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;

    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data: { user: User } = await response.json();
        if (data.user && isMountedRef.current) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        }
      } else if (response.status === 401 && isMountedRef.current) {
        // Unauthorized - clear user
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Auth refresh error:', err);
      // Don't clear user on network errors
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    error,
    login,
    logout,
    refreshAuth
  };
}
