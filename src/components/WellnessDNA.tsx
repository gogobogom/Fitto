'use client';

/**
 * WellnessDNA
 * ---------------------------------------------------------------
 * Compact "Wellness DNA" card + edit modal. Persists three fields
 * to `public.user_profiles`:
 *   - wellness_goal       (TEXT)
 *   - dietary_preference  (TEXT)
 *   - allergies           (TEXT[])
 *
 * Also exports `useWellnessDNA(userId)` — a tiny state hook that
 * Mira (or any future RAG layer) can `useWellnessDNA(uid)` from to
 * read the current snapshot. Wire-up only, no LLM/RAG logic here.
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Sparkles, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export interface WellnessDNAData {
  wellness_goal: string | null;
  dietary_preference: string | null;
  allergies: string[];
}

const EMPTY_DNA: WellnessDNAData = {
  wellness_goal: null,
  dietary_preference: null,
  allergies: [],
};

// Public hook so any consumer (Mira context, RAG enricher, etc.) can
// read the same snapshot without re-implementing the query.
export function useWellnessDNA(userId: string | null | undefined): {
  data: WellnessDNAData;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<WellnessDNAData>(EMPTY_DNA);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async (): Promise<void> => {
    if (!userId) {
      setData(EMPTY_DNA);
      return;
    }
    setLoading(true);
    try {
      const { data: row, error } = await supabase
        .from('user_profiles')
        .select('wellness_goal,dietary_preference,allergies')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && row) {
        setData({
          wellness_goal: (row.wellness_goal as string | null) ?? null,
          dietary_preference: (row.dietary_preference as string | null) ?? null,
          allergies: Array.isArray(row.allergies) ? (row.allergies as string[]) : [],
        });
      }
    } catch (err) {
      console.error('[WellnessDNA] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

interface WellnessDNACardProps {
  userId: string;
}

export function WellnessDNACard({ userId }: WellnessDNACardProps) {
  const { data, loading, refresh } = useWellnessDNA(userId);
  const [open, setOpen] = useState<boolean>(false);

  // Form state
  const [goal, setGoal] = useState<string>('');
  const [diet, setDiet] = useState<string>('');
  const [allergiesText, setAllergiesText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const incomplete =
    !data.wellness_goal && !data.dietary_preference && data.allergies.length === 0;

  const openModal = useCallback(() => {
    setGoal(data.wellness_goal ?? '');
    setDiet(data.dietary_preference ?? '');
    setAllergiesText(data.allergies.join(', '));
    setSaveErr(null);
    setOpen(true);
  }, [data]);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setSaveErr(null);
    try {
      const allergies = allergiesText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      const { error } = await supabase
        .from('user_profiles')
        .update({
          wellness_goal: goal.trim() || null,
          dietary_preference: diet.trim() || null,
          allergies,
        })
        .eq('user_id', userId);
      if (error) throw error;
      await refresh();
      setOpen(false);
    } catch (err) {
      console.error('[WellnessDNA] save failed:', err);
      setSaveErr(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [userId, goal, diet, allergiesText, refresh]);

  return (
    <>
      <Card
        data-testid="wellness-dna-card"
        className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 shadow-md"
      >
        <CardContent className="py-4 px-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow shrink-0">
            <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-emerald-700">
              Wellness DNA
            </div>
            {loading ? (
              <div className="text-sm text-emerald-900/70 mt-0.5">Loading…</div>
            ) : incomplete ? (
              <div className="text-sm text-emerald-900/80 mt-0.5">
                Complete your profile to personalize Mira.
              </div>
            ) : (
              <div className="text-sm text-emerald-900 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                {data.wellness_goal && (
                  <span data-testid="wellness-dna-goal">
                    🎯 <span className="font-medium">{data.wellness_goal}</span>
                  </span>
                )}
                {data.dietary_preference && (
                  <span data-testid="wellness-dna-diet">
                    🥗 <span className="font-medium">{data.dietary_preference}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          {incomplete ? (
            <Button
              data-testid="wellness-dna-complete-btn"
              onClick={openModal}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              Complete Your Profile
            </Button>
          ) : (
            <Button
              data-testid="wellness-dna-edit-btn"
              onClick={openModal}
              size="sm"
              variant="outline"
              className="shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="wellness-dna-modal" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Wellness DNA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wdna-goal">Wellness goal</Label>
              <Input
                id="wdna-goal"
                data-testid="wellness-dna-input-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Lose 5 kg, build muscle, sleep better"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wdna-diet">Dietary preference</Label>
              <Input
                id="wdna-diet"
                data-testid="wellness-dna-input-diet"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                placeholder="e.g. Mediterranean, vegetarian, low-carb"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wdna-allergies">Allergies</Label>
              <Input
                id="wdna-allergies"
                data-testid="wellness-dna-input-allergies"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="Comma-separated, e.g. peanuts, shellfish"
              />
              <p className="text-xs text-gray-500">Separate multiple allergies with commas.</p>
            </div>
            {saveErr && (
              <p data-testid="wellness-dna-error" className="text-xs text-red-600">
                {saveErr}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              data-testid="wellness-dna-cancel-btn"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              data-testid="wellness-dna-save-btn"
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
