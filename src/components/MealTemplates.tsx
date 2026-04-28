'use client';

/**
 * MealTemplates - placeholder.
 * Legacy implementation queried the dropped `daily_logs` table.
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function MealTemplates() {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Şablonlarım</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Şablon özelliği yakında geri gelecek.
        </p>
      </CardContent>
    </Card>
  );
}

export default MealTemplates;
