'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { Save, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onProfileUpdated?: () => void;
}

interface ProfileData {
  full_name: string;
  username: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  gender: string;
  activity_level: string;
}

export function EditProfileDialog({ open, onOpenChange, userId, onProfileUpdated }: EditProfileDialogProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [activityLevel, setActivityLevel] = useState<string>('');

  // Load current profile data
  useEffect(() => {
    if (open && userId) {
      void loadProfile();
    }
  }, [open, userId]);

  const loadProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Profil yükleme hatası:', error);
        toast.error('Profil yüklenemedi');
        return;
      }

      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setAge(data.age?.toString() || '');
        setWeight(data.weight_kg?.toString() || '');
        setHeight(data.height_cm?.toString() || '');
        setGender(data.gender || '');
        setActivityLevel(data.activity_level || '');
      }
    } catch (err) {
      console.error('Profil yükleme hatası:', err);
      toast.error('Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const calculateCalories = (ageNum: number, weightKg: number, heightCm: number, genderVal: string, activityLvl: string, goalType: string): number => {
    // BMR Calculation (Mifflin-St Jeor)
    let bmr = 0;
    if (genderVal === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
    }

    // Activity multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      lightlyActive: 1.375,
      moderatelyActive: 1.55,
      veryActive: 1.725,
      extraActive: 1.9,
    };

    let dailyCalories = Math.round(bmr * (activityMultipliers[activityLvl] || 1.55));

    // Adjust based on goal type
    if (goalType === 'loseWeight') {
      dailyCalories -= 500;
    } else if (goalType === 'gainWeight' || goalType === 'buildMuscle') {
      dailyCalories += 500;
    }

    return dailyCalories;
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);

      // Validation
      if (!fullName.trim()) {
        toast.error('İsim alanı boş olamaz');
        return;
      }

      if (!age || parseInt(age, 10) < 1 || parseInt(age, 10) > 120) {
        toast.error('Geçerli bir yaş giriniz (1-120)');
        return;
      }

      if (!weight || parseFloat(weight) < 1 || parseFloat(weight) > 500) {
        toast.error('Geçerli bir kilo giriniz (1-500 kg)');
        return;
      }

      if (!height || parseFloat(height) < 50 || parseFloat(height) > 300) {
        toast.error('Geçerli bir boy giriniz (50-300 cm)');
        return;
      }

      if (!gender) {
        toast.error('Cinsiyet seçiniz');
        return;
      }

      if (!activityLevel) {
        toast.error('Aktivite seviyesi seçiniz');
        return;
      }

      const ageNum = parseInt(age, 10);
      const weightKg = parseFloat(weight);
      const heightCm = parseFloat(height);

      const profileData: Partial<ProfileData> = {
        full_name: fullName.trim(),
        username: username.trim() || fullName.trim(),
        age: ageNum,
        weight_kg: weightKg,
        height_cm: heightCm,
        gender,
        activity_level: activityLevel,
      };

      // Update profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', userId);

      if (profileError) {
        console.error('Profil güncelleme hatası:', profileError);
        toast.error('Profil güncellenemedi: ' + profileError.message);
        return;
      }

      // Fetch current goal type to recalculate calories
      const { data: goalsData } = await supabase
        .from('user_goals')
        .select('goal_type')
        .eq('user_id', userId)
        .single();

      if (goalsData && goalsData.goal_type) {
        // Recalculate calories based on updated profile
        const newCalories = calculateCalories(
          ageNum,
          weightKg,
          heightCm,
          gender,
          activityLevel,
          goalsData.goal_type
        );

        // Update calorie target in user_goals
        const { error: goalsError } = await supabase
          .from('user_goals')
          .update({
            daily_calorie_target: newCalories,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (goalsError) {
          console.error('Kalori hedefi güncelleme hatası:', goalsError);
          // Don't fail the whole operation, just log
        } else {
          console.log('✅ Kalori hedefi otomatik güncellendi:', newCalories);
        }
      }

      toast.success('✅ Profil ve kalori hedefi başarıyla güncellendi!');
      onOpenChange(false);
      
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err) {
      console.error('Profil kaydetme hatası:', err);
      toast.error('Profil kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-doodle text-xl">
            👤 Profil Bilgilerini Düzenle
          </DialogTitle>
          <DialogDescription className="font-doodle-alt">
            Profil bilgilerinizi güncelleyin
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-doodle">
                İsim Soyisim *
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="font-doodle-alt"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="font-doodle">
                Kullanıcı Adı
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullaniciadi"
                className="font-doodle-alt"
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age" className="font-doodle">
                Yaş *
              </Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="font-doodle-alt"
              />
            </div>

            {/* Weight and Height */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="font-doodle">
                  Kilo (kg) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="1"
                  max="500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="70.5"
                  className="font-doodle-alt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="font-doodle">
                  Boy (cm) *
                </Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="50"
                  max="300"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className="font-doodle-alt"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="font-doodle">
                Cinsiyet *
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender" className="font-doodle-alt">
                  <SelectValue placeholder="Cinsiyet seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Level */}
            <div className="space-y-2">
              <Label htmlFor="activityLevel" className="font-doodle">
                Aktivite Seviyesi *
              </Label>
              <Select value={activityLevel} onValueChange={setActivityLevel}>
                <SelectTrigger id="activityLevel" className="font-doodle-alt">
                  <SelectValue placeholder="Aktivite seviyesi seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Hareketsiz (Ofis işi)</SelectItem>
                  <SelectItem value="lightlyActive">Hafif Aktif (Haftada 1-3 gün)</SelectItem>
                  <SelectItem value="moderatelyActive">Orta Aktif (Haftada 3-5 gün)</SelectItem>
                  <SelectItem value="veryActive">Çok Aktif (Haftada 6-7 gün)</SelectItem>
                  <SelectItem value="extraActive">Ekstra Aktif (Günde 2 kez)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="font-doodle"
          >
            İptal
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={loading || saving}
            className="font-doodle"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
