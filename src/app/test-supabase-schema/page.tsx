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
  sampleData: unknown;
  error: string | null;
}

const TABLES_TO_TEST: Array<{ name: string; userIdField?: string }> = [
  { name: 'user_profiles', userIdField: 'user_id' },
  { name: 'user_goals', userIdField: 'user_id' },
  { name: 'meals', userIdField: 'user_id' },
  { name: 'exercises', userIdField: 'user_id' },
  { name: 'food_database' },
  { name: 'daily_summaries', userIdField: 'user_id' },
  { name: 'water_logs', userIdField: 'user_id' },
  { name: 'body_measurements', userIdField: 'user_id' },
  { name: 'subscriptions', userIdField: 'user_id' },
  { name: 'trial_status', userIdField: 'user_id' },
];

export default function TestSupabaseSchema() {
  const [userId, setUserId] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [results, setResults] = useState<TableTest[]>([]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    })();
  }, []);

  const testTable = async (
    tableName: string,
    userIdField?: string,
  ): Promise<TableTest> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from as any)(tableName).select('*');
      if (userIdField && userId) query = query.eq(userIdField, userId);

      const { data, error } = await query.limit(1);

      if (error) {
        return {
          name: tableName,
          exists: false,
          columns: [],
          sampleData: null,
          error: `${error.code ?? ''} ${error.message}`.trim(),
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
    } catch (err) {
      return {
        name: tableName,
        exists: false,
        columns: [],
        sampleData: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  };

  const runTests = async (): Promise<void> => {
    setTesting(true);
    setResults([]);
    const out: TableTest[] = [];
    for (const t of TABLES_TO_TEST) {
      // eslint-disable-next-line no-await-in-loop
      out.push(await testTable(t.name, t.userIdField));
    }
    setResults(out);
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
            <p>
              <strong>User ID:</strong> {userId || 'Not logged in'}
            </p>
            <Button onClick={() => void runTests()} disabled={testing}>
              {testing ? 'Testing…' : 'Run Schema Tests'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-bold">Test Results:</h3>
              {results.map((r) => (
                <Card key={r.name} className={r.exists ? 'border-green-200' : 'border-red-200'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {r.exists ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {r.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {r.exists ? (
                      <>
                        <p className="font-semibold text-sm">Columns ({r.columns.length}):</p>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                          {JSON.stringify(r.columns, null, 2)}
                        </pre>
                        {r.sampleData ? (
                          <>
                            <p className="font-semibold text-sm">Sample Row:</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-40">
                              {JSON.stringify(r.sampleData, null, 2)}
                            </pre>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">(empty table)</p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Error:</p>
                          <p className="text-sm text-red-600">{r.error}</p>
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
