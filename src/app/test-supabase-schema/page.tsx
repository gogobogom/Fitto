'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface TableTest {
  name: string;
  exists: boolean;
  columns: string[];
  sampleData: any;
  error: string | null;
}

export default function TestSupabaseSchema() {
  const [userId, setUserId] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [results, setResults] = useState<TableTest[]>([]);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();
  }, []);

  const testTable = async (tableName: string, userIdField?: string): Promise<TableTest> => {
    try {
      let query = supabase.from(tableName).select('*');
      
      if (userIdField && userId) {
        query = query.eq(userIdField, userId);
      }
      
      const { data, error } = await query.limit(1);

      if (error) {
        return {
          name: tableName,
          exists: false,
          columns: [],
          sampleData: null,
          error: `${error.code}: ${error.message}`,
        };
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

      return {
        name: tableName,
        exists: true,
        columns,
        sampleData: data && data.length > 0 ? data[0] : null,
        error: null,
      };
    } catch (error) {
      return {
        name: tableName,
        exists: false,
        columns: [],
        sampleData: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  const runTests = async (): Promise<void> => {
    if (!userId) {
      alert('Please login first!');
      return;
    }

    setTesting(true);
    setResults([]);

    const tablesToTest = [
      { name: 'profiles', userIdField: 'id' },
      { name: 'user_goals', userIdField: 'id' },
      { name: 'daily_summaries', userIdField: 'user_id' },
      { name: 'daily_logs', userIdField: 'user_id' },
      { name: 'food_items', userIdField: 'user_id' },
      { name: 'exercise_logs', userIdField: 'user_id' },
      { name: 'body_measurements', userIdField: 'user_id' },
      { name: 'subscriptions', userIdField: 'identity' },
      { name: 'trial_status', userIdField: 'identity' },
    ];

    const testResults: TableTest[] = [];

    for (const table of tablesToTest) {
      const result = await testTable(table.name, table.userIdField);
      testResults.push(result);
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Schema Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>User ID:</strong> {userId || 'Not logged in'}</p>
            <Button onClick={runTests} disabled={testing || !userId}>
              {testing ? 'Testing...' : 'Run Schema Tests'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-bold">Test Results:</h3>
              {results.map((result, index) => (
                <Card key={index} className={result.exists ? 'border-green-200' : 'border-red-200'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {result.exists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {result.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.exists ? (
                      <>
                        <div>
                          <p className="font-semibold text-sm">Columns ({result.columns.length}):</p>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(result.columns, null, 2)}
                          </pre>
                        </div>
                        {result.sampleData && (
                          <div>
                            <p className="font-semibold text-sm">Sample Data:</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-40">
                              {JSON.stringify(result.sampleData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Error:</p>
                          <p className="text-sm text-red-600">{result.error}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
