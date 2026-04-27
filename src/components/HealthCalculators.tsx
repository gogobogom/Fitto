'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calculator, Activity, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CalculatorResult {
  bmi?: number;
  bmiCategory?: string;
  bmr?: number;
  tdee?: number;
  idealWeightMin?: number;
  idealWeightMax?: number;
}

export function HealthCalculators() {
  const { language } = useLanguage();
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);

    if (!w || !h || !a) {
      alert(language === 'tr' ? 'Lütfen tüm alanları doldurun!' : 'Please fill in all fields!');
      return;
    }

    const heightM = h / 100;

    // BMI Calculation
    const bmi = w / (heightM * heightM);
    const bmiCategory = language === 'tr'
      ? (bmi < 18.5 ? 'Zayıf' :
         bmi < 25 ? 'Normal' :
         bmi < 30 ? 'Fazla Kilolu' :
         'Obez')
      : (bmi < 18.5 ? 'Underweight' :
         bmi < 25 ? 'Normal' :
         bmi < 30 ? 'Overweight' :
         'Obese');

    // BMR Calculation (Mifflin-St Jeor)
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    // TDEE Calculation
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9,
    };
    const tdee = bmr * activityMultipliers[activityLevel];

    // Ideal Weight Range (based on BMI 18.5-25)
    const idealWeightMin = 18.5 * heightM * heightM;
    const idealWeightMax = 25 * heightM * heightM;

    setResult({
      bmi,
      bmiCategory,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      idealWeightMin: Math.round(idealWeightMin),
      idealWeightMax: Math.round(idealWeightMax),
    });
  };

  return (
    <div className="space-y-6 pb-24">

      {/* Input Form */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            {language === 'tr' ? 'Bilgilerinizi Girin' : 'Enter Your Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">{language === 'tr' ? 'Kilo (kg)' : 'Weight (kg)'}</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">{language === 'tr' ? 'Boy (cm)' : 'Height (cm)'}</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">{language === 'tr' ? 'Yaş' : 'Age'}</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">{language === 'tr' ? 'Cinsiyet' : 'Gender'}</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{language === 'tr' ? 'Erkek' : 'Male'}</SelectItem>
                  <SelectItem value="female">{language === 'tr' ? 'Kadın' : 'Female'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity">{language === 'tr' ? 'Aktivite Seviyesi' : 'Activity Level'}</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger id="activity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">{language === 'tr' ? 'Hareketsiz (egzersiz yok)' : 'Sedentary (no exercise)'}</SelectItem>
                <SelectItem value="light">{language === 'tr' ? 'Az Aktif (hafif egzersiz)' : 'Lightly Active (light exercise)'}</SelectItem>
                <SelectItem value="moderate">{language === 'tr' ? 'Orta Aktif (orta egzersiz)' : 'Moderately Active (moderate exercise)'}</SelectItem>
                <SelectItem value="active">{language === 'tr' ? 'Çok Aktif (yoğun egzersiz)' : 'Very Active (intense exercise)'}</SelectItem>
                <SelectItem value="veryActive">{language === 'tr' ? 'Ekstra Aktif (çok yoğun)' : 'Extra Active (very intense)'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={calculate} className="w-full">
            <Calculator className="h-4 w-4 mr-2" />
            {language === 'tr' ? 'Hesapla' : 'Calculate'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* BMI */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">{language === 'tr' ? 'Vücut Kütle İndeksi (BMI)' : 'Body Mass Index (BMI)'}</div>
                <div className="text-4xl font-bold text-blue-600">{result.bmi?.toFixed(1)}</div>
                <div className="text-lg font-medium text-gray-700 mt-1">{result.bmiCategory}</div>
              </div>
            </CardContent>
          </Card>

          {/* BMR */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-green-600" />
                {language === 'tr' ? 'Bazal Metabolizma (BMR)' : 'Basal Metabolic Rate (BMR)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.bmr} kcal/gün</div>
                <div className="text-sm text-gray-600 mt-2">
                  {language === 'tr' ? 'Hiçbir şey yapmadan yaktığınız kalori' : 'Calories burned at rest'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TDEE */}
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-purple-600" />
                {language === 'tr' ? 'Günlük Kalori İhtiyacı (TDEE)' : 'Daily Calorie Needs (TDEE)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{result.tdee} kcal/gün</div>
                <div className="text-sm text-gray-600 mt-2">
                  {language === 'tr' ? 'Aktivite seviyenizle birlikte günlük kalori ihtiyacınız' : 'Your daily calorie needs with activity level'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ideal Weight */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg">{language === 'tr' ? 'İdeal Kilo Aralığı' : 'Ideal Weight Range'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {result.idealWeightMin} - {result.idealWeightMax} kg
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {language === 'tr' ? 'Boyunuza göre sağlıklı kilo aralığı' : 'Healthy weight range for your height'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">{language === 'tr' ? '📋 Öneriler' : '📋 Recommendations'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              <div className="p-3 bg-blue-50 rounded-lg">
                <strong>{language === 'tr' ? 'Kilo vermek için:' : 'To lose weight:'}</strong> {language === 'tr' ? 'Günde' : 'Consume'} {result.tdee && Math.round(result.tdee - 500)} kcal {language === 'tr' ? 'tüketin (-500 kcal açık)' : 'per day (-500 kcal deficit)'}
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <strong>{language === 'tr' ? 'Kilo korumak için:' : 'To maintain weight:'}</strong> {language === 'tr' ? 'Günde' : 'Consume'} {result.tdee} kcal {language === 'tr' ? 'tüketin' : 'per day'}
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <strong>{language === 'tr' ? 'Kilo almak için:' : 'To gain weight:'}</strong> {language === 'tr' ? 'Günde' : 'Consume'} {result.tdee && Math.round(result.tdee + 300)} kcal {language === 'tr' ? 'tüketin (+300 kcal fazla)' : 'per day (+300 kcal surplus)'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
