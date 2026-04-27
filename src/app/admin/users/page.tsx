'use client';

import { Users } from 'lucide-react';
import { UsersModule } from '@/components/admin/UsersModule';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-purple-600" />
          User Management
        </h1>
        <p className="text-slate-600 mt-2">View and manage all platform users</p>
      </div>

      <UsersModule />
    </div>
  );
}
