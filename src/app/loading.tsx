'use client';

/**
 * ⚡ GLOBAL LOADING STATE
 * 
 * Shown during page transitions and initial loads
 */

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
      <div className="text-center space-y-4">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-full bg-teal-600 flex items-center justify-center animate-pulse">
            <span className="text-3xl font-bold text-white">F</span>
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping" />
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          <p className="text-lg font-medium text-teal-700">
            Loading Fitto...
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-sm text-gray-500">
          Your AI nutrition coach is getting ready
        </p>
      </div>
    </div>
  );
}
