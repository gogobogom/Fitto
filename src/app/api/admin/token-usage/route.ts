import { NextResponse, type NextRequest } from 'next/server';

/**
 * 📊 ADMIN TOKEN USAGE API
 * 
 * Returns token usage statistics for admin dashboard
 * This is a mock implementation - replace with real Supabase queries
 */

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Replace with real Supabase queries
    // For now, returning mock data
    
    const stats = {
      totalMessages: 1250,
      totalInputTokens: 1750000,
      totalOutputTokens: 500000,
      totalCost: 1.575, // $0.40 per 1M input + $1.75 per 1M output
      monthlyLimit: 2777,
      usersCount: 85,
      premiumUsers: 12,
      trialUsers: 23,
      adUsers: 50,
    };

    const logs = [
      {
        identity: '0x1234567890abcdef',
        inputTokens: 1400,
        outputTokens: 400,
        costUsd: 0.00126,
        timestamp: Date.now() - 1000 * 60 * 5, // 5 min ago
      },
      {
        identity: '0x9876543210fedcba',
        inputTokens: 1350,
        outputTokens: 380,
        costUsd: 0.00121,
        timestamp: Date.now() - 1000 * 60 * 12, // 12 min ago
      },
      {
        identity: '0xabcdef1234567890',
        inputTokens: 1420,
        outputTokens: 420,
        costUsd: 0.00130,
        timestamp: Date.now() - 1000 * 60 * 18, // 18 min ago
      },
    ];

    return NextResponse.json({ stats, logs });
  } catch (error) {
    console.error('[Admin Token Usage] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token usage stats' },
      { status: 500 }
    );
  }
}

/**
 * TODO: Implement real database queries when needed
 */
