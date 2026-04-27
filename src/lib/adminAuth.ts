/**
 * 🔒 SECURE ADMIN AUTHENTICATION SYSTEM
 * 
 * Uses Supabase for admin user management
 * No hardcoded credentials - all admin users are in database
 * 
 * @version 3.0.0 - SUPABASE INTEGRATED
 */

import { supabase } from '@/lib/supabase/client';
import type { AdminRole, AdminStatus } from '@/types/supabase';

// Admin user interface
export interface AdminUser {
  identity: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
}

// Session interface
export interface AdminSession {
  userId: string;
  email: string;
  role: AdminRole;
  timestamp: number;
  expiresAt: number;
}

// Session duration (4 hours)
const SESSION_DURATION = 4 * 60 * 60 * 1000;

/**
 * Check if current Supabase user is an admin
 * Returns admin user data if valid, null otherwise
 */
export async function checkAdminStatus(): Promise<AdminUser | null> {
  try {
    // Get current Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return null;
    }

    // Check admin_users table
    const { data: adminData, error } = await supabase
      .from('admin_users')
      .select('identity, role, status')
      .eq('identity', session.user.id)
      .eq('status', 'active')
      .single();

    if (error || !adminData) {
      return null;
    }

    return {
      identity: adminData.identity,
      email: session.user.email || '',
      role: adminData.role as AdminRole,
      status: adminData.status as AdminStatus,
    };
  } catch (error) {
    console.error('[SECURITY] Admin status check error:', error);
    return null;
  }
}

/**
 * Validate if user has required admin role
 */
export function hasRequiredRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const roleHierarchy: Record<AdminRole, number> = {
    'super_admin': 3,
    'admin': 2,
    'moderator': 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Client-side session management
export class AdminSessionManager {
  private static readonly STORAGE_KEY = 'admin_session';

  static saveSession(session: AdminSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('[SECURITY] Failed to save session:', error);
    }
  }

  static getSession(): AdminSession | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const session = JSON.parse(stored) as AdminSession;
      
      // Check if session is valid
      if (!this.isSessionValid(session)) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('[SECURITY] Failed to get session:', error);
      return null;
    }
  }

  static clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('[SECURITY] Failed to clear session:', error);
    }
  }

  static isSessionValid(session: AdminSession | null): boolean {
    if (!session) return false;
    if (!session.userId) return false;
    return Date.now() < session.expiresAt;
  }

  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null && this.isSessionValid(session);
  }

  static createSession(userId: string, email: string, role: AdminRole): AdminSession {
    const now = Date.now();
    const session: AdminSession = {
      userId,
      email,
      role,
      timestamp: now,
      expiresAt: now + SESSION_DURATION,
    };
    this.saveSession(session);
    return session;
  }
}

/**
 * Log admin action for audit trail
 */
export async function logAdminAction(
  adminId: string,
  actionType: string,
  targetId: string | null,
  description: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_identity: adminId,
      action_type: actionType,
      target_identity: targetId,
      description,
      metadata,
    });
  } catch (error) {
    console.error('[AUDIT] Failed to log admin action:', error);
  }
}
