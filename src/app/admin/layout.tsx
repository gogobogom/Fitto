'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  Shield,
  Activity,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Wrench,
  Bug,
  Lock,
  Plug,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { AdminSessionManager, checkAdminStatus } from '@/lib/adminAuth';
import type { AdminRole } from '@/types/supabase';

const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
      { title: 'AI Usage', href: '/admin/ai-usage', icon: MessageSquare },
    ],
  },
  {
    title: 'Platform',
    items: [
      { title: 'Maintenance', href: '/admin/platform/maintenance', icon: Wrench },
      { title: 'Features', href: '/admin/platform/features', icon: Settings },
      { title: 'Announcements', href: '/admin/platform/announcements', icon: Bell },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      { title: 'Bugs', href: '/admin/monitoring/bugs', icon: Bug },
      { title: 'Errors', href: '/admin/monitoring/errors', icon: Activity },
    ],
  },
  {
    title: 'Security',
    items: [
      { title: 'Overview', href: '/admin/security', icon: Lock },
      { title: 'Blocked IPs', href: '/admin/security/blocked-ips', icon: Shield },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { title: 'APIs', href: '/admin/integrations/apis', icon: Plug },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<AdminRole | null>(null);

  const verifyAdminAccess = useCallback(async () => {
    try {
      // Check Supabase session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('❌ No Supabase session, redirecting to login');
        router.push('/auth/login');
        return;
      }

      // Check if user is admin in database
      const adminUser = await checkAdminStatus();
      
      if (!adminUser) {
        console.log('❌ User is not an admin, redirecting to home');
        router.push('/');
        return;
      }

      // Create/update local admin session
      AdminSessionManager.createSession(
        adminUser.identity,
        adminUser.email,
        adminUser.role
      );

      console.log('✅ Admin verified:', adminUser.email, 'Role:', adminUser.role);
      setUserEmail(adminUser.email);
      setUserRole(adminUser.role);
      setIsVerifying(false);
    } catch (error) {
      console.error('Admin verification error:', error);
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    // Skip verification for login page (legacy route, redirect to main login)
    if (pathname === '/admin/login') {
      router.push('/auth/login');
      return;
    }

    verifyAdminAccess();
  }, [pathname, router, verifyAdminAccess]);

  const handleLogout = async () => {
    // Clear local admin session
    AdminSessionManager.clearSession();
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    console.log('👋 Logged out');
    router.push('/auth/login');
  };

  // Redirect old admin login to main login
  if (pathname === '/admin/login') {
    return null;
  }

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen transition-transform',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'w-64 bg-white border-r border-slate-200'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Fitto Admin</h1>
                <p className="text-xs text-slate-500 mt-1">
                  {userEmail}
                </p>
                {userRole && (
                  <span className={cn(
                    "inline-block mt-1 px-2 py-0.5 text-xs rounded-full",
                    userRole === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                    userRole === 'admin' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    {userRole === 'super_admin' ? 'Süper Admin' :
                     userRole === 'admin' ? 'Admin' : 'Moderatör'}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-6">
              {navigationGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                              isActive
                                ? 'bg-purple-100 text-purple-900'
                                : 'text-slate-700 hover:bg-slate-100'
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.title}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-700 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all',
          isSidebarOpen ? 'lg:ml-64' : 'ml-0'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-600">
                <span className="font-medium">Admin:</span>{' '}
                <span className="text-purple-600">
                  {userEmail}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
