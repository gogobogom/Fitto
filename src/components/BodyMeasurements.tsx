'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Scale, Plus, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SupabaseConnection } from '@/hooks/useSupabase';
import type { BodyMeasurement } from '@/types/supabase';

interface BodyMeasurementsProps {
  connection: SupabaseConnection;
}

const todayStr = (): string => new Date().toISOString().split('T')[0];

interface FormState {
  weight: string;
  body_fat_percentage: string;
  muscle_mass: string;
  waist: string;
  hips: string;
  chest: string;
  arms: string;
  legs: string;
  notes: string;
  date: string;
}

const emptyForm: FormState = {
  weight: '',
  body_fat_percentage: '',
  muscle_mass: '',
  waist: '',
  hips: '',
  chest: '',
  arms: '',
  legs: '',
  notes: '',
  date: todayStr(),
};

export function BodyMeasurements({ connection }: BodyMeasurementsProps) {
  const { language } = useLanguage();
  const t = (tr: string, en: string): string => (language === 'tr' ? tr : en);

  const [showForm, setShowForm] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [items, setItems] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    if (!connection.userId) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', connection.userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    if (err) {
      setError(err.message);
    } else {
      setItems((data ?? []) as BodyMeasurement[]);
    }
    setLoading(false);
  }, [connection.userId]);

  useEffect(() => {
    void load();
    if (!connection.userId) return;
    const channel = supabase
      .channel(`body_measurements_${connection.userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'body_measurements',
          filter: `user_id=eq.${connection.userId}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [connection.userId, load]);

  const handleChange = (key: keyof FormState, value: string): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseOptional = (raw: string): number | null => {
    if (raw === '') return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!connection.userId) return;
    const weight = parseOptional(form.weight);
    if (weight === null || weight <= 0) {
      setError(t('Lütfen geçerli bir kilo gir', 'Please enter a valid weight'));
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from('body_measurements').insert({
      user_id: connection.userId,
      date: form.date || todayStr(),
      weight,
      body_fat_percentage: parseOptional(form.body_fat_percentage),
      muscle_mass: parseOptional(form.muscle_mass),
      waist: parseOptional(form.waist),
      hips: parseOptional(form.hips),
      chest: parseOptional(form.chest),
      arms: parseOptional(form.arms),
      legs: parseOptional(form.legs),
      notes: form.notes.trim() || null,
    });
    if (err) {
      setError(err.message);
    } else {
      setForm(emptyForm);
      setShowForm(false);
      await load();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!connection.userId) return;
    if (typeof window !== 'undefined' && !window.confirm(t('Bu kaydı silmek istediğine emin misin?', 'Delete this entry?'))) return;
    const { error: err } = await supabase.from('body_measurements').delete().eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      await load();
    }
  };

  const latest = items[0];
  const previous = items[1];
  const diff =
    latest && previous ? Number(latest.weight) - Number(previous.weight) : 0;
  const diffIcon = diff > 0.05 ? TrendingUp : diff < -0.05 ? TrendingDown : Minus;
  const diffColor =
    diff > 0.05 ? 'text-red-500' : diff < -0.05 ? 'text-green-600' : 'text-gray-500';

  return (
    <div className="space-y-6" data-testid="body-measurements-page">
      {/* Latest snapshot + Add button */}
      <Card className="border-4 border-black">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-orange-500" />
            {t('Vücut Ölçümleri', 'Body Measurements')}
          </CardTitle>
          <Button
            onClick={() => setShowForm((s) => !s)}
            data-testid="toggle-add-measurement-btn"
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            {showForm ? t('Kapat', 'Close') : t('Ekle', 'Add')}
          </Button>
        </CardHeader>
        <CardContent>
          {latest ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label={t('Kilo', 'Weight')} value={`${Number(latest.weight).toFixed(1)} kg`} />
              <Stat
                label={t('Yağ %', 'Body fat %')}
                value={latest.body_fat_percentage != null ? `${Number(latest.body_fat_percentage).toFixed(1)} %` : '—'}
              />
              <Stat
                label={t('Kas', 'Muscle')}
                value={latest.muscle_mass != null ? `${Number(latest.muscle_mass).toFixed(1)} kg` : '—'}
              />
              <Stat
                label={t('Bel', 'Waist')}
                value={latest.waist != null ? `${Number(latest.waist).toFixed(1)} cm` : '—'}
              />
              {previous && (
                <div className="col-span-2 sm:col-span-4 flex items-center gap-2 text-sm">
                  <span className="text-gray-500">
                    {t('Bir önceki ölçümden bu yana:', 'Since last entry:')}
                  </span>
                  {(() => {
                    const Icon = diffIcon;
                    return <Icon className={`h-4 w-4 ${diffColor}`} />;
                  })()}
                  <span className={`font-semibold ${diffColor}`}>
                    {diff > 0 ? '+' : ''}
                    {diff.toFixed(1)} kg
                  </span>
                </div>
              )}
            </div>
          ) : !loading ? (
            <p className="text-sm text-gray-500">
              {t('Henüz ölçüm yok. İlk ölçümünü ekle!', 'No measurements yet. Add your first one!')}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Add form */}
      {showForm && (
        <Card className="border-2 border-orange-300" data-testid="measurement-form">
          <CardHeader>
            <CardTitle className="text-lg">{t('Yeni Ölçüm', 'New Measurement')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Tarih', 'Date')} htmlFor="m-date">
                <Input
                  id="m-date"
                  data-testid="measurement-date-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                />
              </Field>
              <Field label={t('Kilo (kg) *', 'Weight (kg) *')} htmlFor="m-weight">
                <Input
                  id="m-weight"
                  data-testid="measurement-weight-input"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => handleChange('weight', e.target.value)}
                  required
                />
              </Field>
              <Field label={t('Yağ %', 'Body fat %')} htmlFor="m-bf">
                <Input
                  id="m-bf"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.body_fat_percentage}
                  onChange={(e) => handleChange('body_fat_percentage', e.target.value)}
                />
              </Field>
              <Field label={t('Kas (kg)', 'Muscle (kg)')} htmlFor="m-mm">
                <Input
                  id="m-mm"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.muscle_mass}
                  onChange={(e) => handleChange('muscle_mass', e.target.value)}
                />
              </Field>
              <Field label={t('Bel (cm)', 'Waist (cm)')} htmlFor="m-waist">
                <Input
                  id="m-waist"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.waist}
                  onChange={(e) => handleChange('waist', e.target.value)}
                />
              </Field>
              <Field label={t('Kalça (cm)', 'Hips (cm)')} htmlFor="m-hips">
                <Input
                  id="m-hips"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.hips}
                  onChange={(e) => handleChange('hips', e.target.value)}
                />
              </Field>
              <Field label={t('Göğüs (cm)', 'Chest (cm)')} htmlFor="m-chest">
                <Input
                  id="m-chest"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.chest}
                  onChange={(e) => handleChange('chest', e.target.value)}
                />
              </Field>
              <Field label={t('Kol (cm)', 'Arms (cm)')} htmlFor="m-arms">
                <Input
                  id="m-arms"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.arms}
                  onChange={(e) => handleChange('arms', e.target.value)}
                />
              </Field>
              <Field label={t('Bacak (cm)', 'Legs (cm)')} htmlFor="m-legs">
                <Input
                  id="m-legs"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.legs}
                  onChange={(e) => handleChange('legs', e.target.value)}
                />
              </Field>
            </div>
            <Field label={t('Not', 'Notes')} htmlFor="m-notes">
              <Input
                id="m-notes"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={t('İsteğe bağlı...', 'Optional...')}
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                {t('İptal', 'Cancel')}
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={submitting || !form.weight}
                data-testid="save-measurement-btn"
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {submitting ? t('Kaydediliyor...', 'Saving...') : t('Kaydet', 'Save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle className="text-lg">{t('Geçmiş', 'History')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-gray-500">{t('Yükleniyor...', 'Loading...')}</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-gray-500">
              {t('Henüz kayıt yok.', 'No entries yet.')}
            </p>
          )}
          <div className="divide-y" data-testid="measurement-history">
            {items.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(m.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {Number(m.weight).toFixed(1)} kg
                    {m.body_fat_percentage != null
                      ? ` · ${Number(m.body_fat_percentage).toFixed(1)}% ${t('yağ', 'bf')}`
                      : ''}
                    {m.waist != null
                      ? ` · ${t('bel', 'waist')} ${Number(m.waist).toFixed(1)} cm`
                      : ''}
                  </p>
                  {m.notes && <p className="text-xs text-gray-500 mt-1 italic">{m.notes}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`delete-measurement-${m.id}`}
                  onClick={() => void handleDelete(m.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-bold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
