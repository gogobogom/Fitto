'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Gender, ActivityLevel, GoalType } from '@/types/supabase';
import { DoodleImage } from './DoodleImage';
import { doodleAssets } from '@/lib/doodleAssets';
import { useLanguage } from '@/contexts/LanguageContext';


interface OnboardingProps {
  identity: string;
  onComplete: (username: string, age: number, weightKg: number, heightCm: number, gender: Gender, activityLevel: ActivityLevel, goalType: GoalType, targetWeightKg: number, dailyCalorieTarget: number) => void;
}

export function Onboarding({ identity, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<number>(1);
  const [username, setUsername] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [gender, setGender] = useState<Gender>('male');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderatelyActive');
  const [goalType, setGoalType] = useState<GoalType>('maintainWeight');
  const [targetWeightKg, setTargetWeightKg] = useState<string>('');
  const { t } = useLanguage();

  const handleNext = () => {
    if (step === 1 && username && age && weightKg && heightCm) {
      setStep(2);
    }
  };

  const handleComplete = () => {
    const ageNum = parseInt(age, 10);
    const weight = parseFloat(weightKg);
    const height = parseFloat(heightCm);
    const targetWeight = parseFloat(targetWeightKg) || weight;

    // Already using correct types from Supabase
    const genderEnum = gender;
    const activityEnum = activityLevel;
    const goalEnum = goalType;

    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * ageNum + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * ageNum - 161;
    }

    const activityMultipliers: Record<typeof activityLevel, number> = {
      sedentary: 1.2,
      lightlyActive: 1.375,
      moderatelyActive: 1.55,
      veryActive: 1.725,
      extraActive: 1.9,
    };

    let dailyCalories = Math.round(bmr * activityMultipliers[activityLevel]);

    if (goalType === 'loseWeight') {
      dailyCalories -= 500;
    } else if (goalType === 'gainWeight' || goalType === 'buildMuscle') {
      dailyCalories += 500;
    }

    onComplete(username, ageNum, weight, height, genderEnum, activityEnum, goalEnum, targetWeight, dailyCalories);
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 relative overflow-y-auto overscroll-contain" style={{ minHeight: '100dvh' }}>
      <div className="flex justify-center px-4 py-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 64px)', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 48px)', minHeight: '100dvh' }}>
        <Card className="w-full max-w-md doodle-card relative">
          {/* Mascot character */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 wiggle">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-orange-400 shadow-lg flex items-center justify-center p-2">
              <img 
                src="https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/2d71ee18-7748-46d0-8815-767362571d9a-Ez92oiTvznV9Srky5UUzKIQEKVccoA" 
                alt="Broccoli Character" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <CardHeader className="pb-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                      style={{
                        borderRadius: '27px 17px 22px 27px/17px 27px 22px 17px',
                      }}>
            <CardTitle className="text-3xl md:text-4xl font-bold font-doodle pt-6">
              {t('onboarding.createProfile')}
            </CardTitle>
            <CardDescription className="text-base text-white/90 font-doodle-alt">
              {step === 1 ? t('onboarding.step1Desc') : t('onboarding.step2Desc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pb-6 pt-8">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="font-doodle text-base">{t('onboarding.username')}</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('onboarding.usernamePlaceholder')}
                    className="doodle-border border-orange-500 font-doodle-alt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="font-doodle text-base">{t('onboarding.age')}</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t('onboarding.agePlaceholder')}
                    className="doodle-border border-orange-500 font-doodle-alt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="font-doodle text-base">{t('onboarding.weight')}</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder={t('onboarding.weightPlaceholder')}
                    className="doodle-border border-orange-500 font-doodle-alt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="font-doodle text-base">{t('onboarding.height')}</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder={t('onboarding.heightPlaceholder')}
                    className="doodle-border border-orange-500 font-doodle-alt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="font-doodle text-base">{t('onboarding.gender')}</Label>
                  <Select value={gender} onValueChange={(v: string) => setGender(v as typeof gender)}>
                    <SelectTrigger id="gender" className="doodle-border border-orange-500 font-doodle-alt">
                      <SelectValue placeholder={t('onboarding.genderSelect')}>
                        {gender === 'male' ? t('onboarding.male') : gender === 'female' ? t('onboarding.female') : t('onboarding.other')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('onboarding.male')}</SelectItem>
                      <SelectItem value="female">{t('onboarding.female')}</SelectItem>
                      <SelectItem value="other">{t('onboarding.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleNext} className="w-full h-12 text-lg font-semibold mt-2 doodle-button border-gray-900 font-doodle">
                  {t('common.next')} →
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="activity" className="font-doodle text-base">{t('onboarding.activityLevel')}</Label>
                  <Select value={activityLevel} onValueChange={(v: string) => setActivityLevel(v as typeof activityLevel)}>
                    <SelectTrigger id="activity" className="doodle-border border-orange-500 font-doodle-alt">
                      <SelectValue placeholder={t('onboarding.genderSelect')}>
                        {activityLevel === 'sedentary' ? t('onboarding.sedentary') :
                         activityLevel === 'lightlyActive' ? t('onboarding.lightlyActive') :
                         activityLevel === 'moderatelyActive' ? t('onboarding.moderatelyActive') :
                         activityLevel === 'veryActive' ? t('onboarding.veryActive') :
                         t('onboarding.extraActive')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">{t('onboarding.sedentary')}</SelectItem>
                      <SelectItem value="lightlyActive">{t('onboarding.lightlyActive')}</SelectItem>
                      <SelectItem value="moderatelyActive">{t('onboarding.moderatelyActive')}</SelectItem>
                      <SelectItem value="veryActive">{t('onboarding.veryActive')}</SelectItem>
                      <SelectItem value="extraActive">{t('onboarding.extraActive')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal" className="font-doodle text-base">{t('onboarding.goal')}</Label>
                  <Select value={goalType} onValueChange={(v: string) => setGoalType(v as typeof goalType)}>
                    <SelectTrigger id="goal" className="doodle-border border-orange-500 font-doodle-alt">
                      <SelectValue placeholder={t('onboarding.genderSelect')}>
                        {goalType === 'loseWeight' ? t('onboarding.lose') :
                         goalType === 'maintainWeight' ? t('onboarding.maintain') :
                         goalType === 'gainWeight' ? t('onboarding.gain') :
                         t('onboarding.buildMuscle')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loseWeight">{t('onboarding.lose')}</SelectItem>
                      <SelectItem value="maintainWeight">{t('onboarding.maintain')}</SelectItem>
                      <SelectItem value="gainWeight">{t('onboarding.gain')}</SelectItem>
                      <SelectItem value="buildMuscle">{t('onboarding.buildMuscle')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetWeight" className="font-doodle text-base">{t('onboarding.targetWeight')}</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    step="0.1"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(e.target.value)}
                    placeholder={weightKg || t('onboarding.weightPlaceholder')}
                    className="doodle-border border-orange-500 font-doodle-alt"
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 text-base font-semibold doodle-button border-gray-900 font-doodle">
                    {t('onboarding.back')}
                  </Button>
                  <Button onClick={handleComplete} className="flex-1 h-12 text-base font-semibold doodle-button border-gray-900 font-doodle">
                    {t('onboarding.complete')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
