'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Activity, DollarSign, MessageSquare, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface TokenStats {
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  monthlyLimit: number;
  usersCount: number;
  premiumUsers: number;
  trialUsers: number;
  adUsers: number;
}

interface TokenUsageLog {
  identity: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: number;
}

export default function TokenDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<TokenStats>({
    totalMessages: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    monthlyLimit: 2777, // ~2,777 messages/month for Pro plan
    usersCount: 0,
    premiumUsers: 0,
    trialUsers: 0,
    adUsers: 0,
  });
  const [recentLogs, setRecentLogs] = useState<TokenUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch token usage stats from API
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/token-usage');
        if (response.ok) {
          const data = await response.json() as { stats: TokenStats; logs: TokenUsageLog[] };
          setStats(data.stats);
          setRecentLogs(data.logs);
        }
      } catch (error) {
        console.error('[TokenDashboard] Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const usagePercentage = (stats.totalMessages / stats.monthlyLimit) * 100;
  const isNearLimit = usagePercentage >= 75;
  const isAtLimit = usagePercentage >= 90;

  const costPerMessage = stats.totalMessages > 0 ? stats.totalCost / stats.totalMessages : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Activity className="w-8 h-8 text-teal-500" />
            AI Token Usage Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Monitor GLM 4.6 Pro API token consumption and costs</p>
        </div>

        {/* Alert Banner */}
        {isNearLimit && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            isAtLimit ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${isAtLimit ? 'text-red-500' : 'text-yellow-500'}`} />
            <div>
              <p className={`font-semibold ${isAtLimit ? 'text-red-800' : 'text-yellow-800'}`}>
                {isAtLimit ? '⚠️ Critical: Monthly Limit Reached!' : '⚠️ Warning: Approaching Monthly Limit'}
              </p>
              <p className={`text-sm ${isAtLimit ? 'text-red-700' : 'text-yellow-700'}`}>
                {isAtLimit 
                  ? 'Consider upgrading your plan or enabling optimizations immediately.'
                  : 'You\'ve used 75% of your monthly token budget. Monitor usage closely.'}
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Messages */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-teal-500" />
              <span className="text-sm font-medium text-gray-500">Total Messages</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.totalMessages.toLocaleString()}</p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {stats.totalMessages} / {stats.monthlyLimit} ({usagePercentage.toFixed(1)}%)
              </p>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-500" />
              <span className="text-sm font-medium text-gray-500">Total Cost</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">${stats.totalCost.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-4">
              Avg: ${costPerMessage.toFixed(4)} / message
            </p>
          </div>

          {/* Tokens Used */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <span className="text-sm font-medium text-gray-500">Tokens Used</span>
            </div>
            <p className="text-xl font-bold text-gray-800">
              {(stats.totalInputTokens + stats.totalOutputTokens).toLocaleString()}
            </p>
            <div className="text-sm text-gray-600 mt-4 space-y-1">
              <p>Input: {stats.totalInputTokens.toLocaleString()}</p>
              <p>Output: {stats.totalOutputTokens.toLocaleString()}</p>
            </div>
          </div>

          {/* Users */}
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-500" />
              <span className="text-sm font-medium text-gray-500">Users</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.usersCount}</p>
            <div className="text-xs text-gray-600 mt-4 space-y-1">
              <p>👑 Premium: {stats.premiumUsers}</p>
              <p>🎁 Trial: {stats.trialUsers}</p>
              <p>🎬 Ad: {stats.adUsers}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity (Last 10)</h2>
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : recentLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activity yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Input Tokens</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Output Tokens</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cost</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-800 font-mono">
                        {log.identity.slice(0, 8)}...
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-700">
                        {log.inputTokens.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-700">
                        {log.outputTokens.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-700 font-semibold">
                        ${log.costUsd.toFixed(4)}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="mt-8 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Optimization Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-semibold text-gray-800 mb-2">✅ Context Optimization</p>
              <p className="text-sm text-gray-600">
                Reduce input tokens by 50% through smart context compression
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-semibold text-gray-800 mb-2">✅ Response Limiting</p>
              <p className="text-sm text-gray-600">
                Set max_tokens=300 to reduce output costs by 25%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-semibold text-gray-800 mb-2">✅ Caching System</p>
              <p className="text-sm text-gray-600">
                Cache common questions to reduce API calls by 20-30%
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-semibold text-gray-800 mb-2">✅ User Limits</p>
              <p className="text-sm text-gray-600">
                Set premium limit to 200 msg/month to prevent abuse
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
