/**
 * 🧠 AI BESLENME KOÇU - DETAYLI BİLGİ BANKASI VE SENARYO SİSTEMİ
 * 
 * Profesyonel diyetisyen persona ile detaylı beslenme koçluğu
 * Gemini API entegrasyonu için hazır yapı - şimdilik senaryo tabanlı
 * 
 * @author Fitto AI Team
 * @version 2.0.0
 */

// ============================================================================
// PERSONA & CHARACTER
// ============================================================================

export const COACH_PERSONA = {
  name: 'Dr. Ayşe Yılmaz',
  title: 'Uzman Diyetisyen & Beslenme Koçu',
  credentials: 'Beslenme ve Diyetetik Bölümü, Sağlıklı Yaşam Sertifikası',
  personality: {
    tone: 'Sıcak, destekleyici, profesyonel ama samimi',
    approach: 'Bilimsel ve kanıta dayalı, ama anlaşılır dille',
    style: 'Motivasyonel, pratik öneriler sunan',
  },
  expertise: [
    'Kilo yönetimi ve sağlıklı kilo verme',
    'Dengeli beslenme ve makro/mikro besin öğeleri',
    'Spor beslenmesi ve performans artırma',
    'Kronik hastalıklarda beslenme (diyabet, yüksek tansiyon vb.)',
    'Özel diyetler (vegan, vejetaryen, keto, düşük karbonhidrat)',
    'Besin alerjileri ve intoleransları',
    'Yeme bozuklukları ve duygusal yeme',
  ],
};

// ============================================================================
// KNOWLEDGE BASE - BESLENME BİLGİ BANKASI
// ============================================================================

export const NUTRITION_KNOWLEDGE = {
  // Temel Beslenme Prensipleri
  basics: {
    dailyCalories: {
      sedentary: { male: 2000, female: 1600 },
      moderate: { male: 2400, female: 2000 },
      active: { male: 2800, female: 2400 },
    },
    macroRatios: {
      balanced: { protein: 30, carbs: 40, fat: 30 },
      ketogenic: { protein: 25, carbs: 5, fat: 70 },
      highProtein: { protein: 40, carbs: 30, fat: 30 },
      mediterranean: { protein: 20, carbs: 50, fat: 30 },
    },
    waterIntake: '2-3 litre/gün (aktivite seviyesine göre)',
    mealFrequency: '3 ana öğün + 2-3 ara öğün (metabolizmaya göre)',
  },

  // Besin Grupları ve Faydaları
  foodGroups: {
    protein: {
      sources: ['Tavuk', 'Balık', 'Yumurta', 'Baklagiller', 'Yoğurt', 'Peynir', 'Tofu'],
      benefits: 'Kas yapımı, tokluk hissi, metabolizma hızlandırma',
      dailyAmount: '1.2-2.0g/kg vücut ağırlığı (aktiviteye göre)',
    },
    carbs: {
      complex: ['Yulaf', 'Tam buğday', 'Kinoa', 'Tatlı patates', 'Esmer pirinç'],
      simple: ['Meyve', 'Bal', 'Kuruyemiş'],
      avoid: ['İşlenmiş şeker', 'Beyaz ekmek', 'Gazlı içecekler'],
      benefits: 'Enerji kaynağı, beyin fonksiyonu, lif sağlama',
    },
    fats: {
      healthy: ['Avokado', 'Zeytinyağı', 'Fındık', 'Ceviz', 'Somon', 'Chia tohumu'],
      unhealthy: ['Trans yağlar', 'İşlenmiş et', 'Kızartmalar', 'Margarın'],
      benefits: 'Hormon üretimi, vitamin emilimi, beyin sağlığı',
    },
    vegetables: {
      leafy: ['Ispanak', 'Marul', 'Roka', 'Lahana'],
      cruciferous: ['Brokoli', 'Karnabahar', 'Brüksel lahanası'],
      benefits: 'Vitamin, mineral, antioksidan, lif kaynağı',
      dailyAmount: 'En az 5 porsiyon sebze ve meyve',
    },
  },

  // Özel Durumlar
  specialCases: {
    weightLoss: {
      calorieDeficit: '300-500 kalori açığı (sağlıklı kilo kaybı)',
      proteinPriority: 'Yüksek protein (kas kaybını önler)',
      mealTiming: 'Ara öğünlerde protein ve lif ağırlıklı',
      tips: [
        'Sabah kahvaltısını atlamayın',
        'Her öğüne protein ekleyin',
        'Bol su için (açlık hissini azaltır)',
        'Yavaş ve özenle yemek yiyin',
        'Gece 8\'den sonra ağır yemek yemeyin',
      ],
    },
    muscleGain: {
      calorieSurplus: '200-300 kalori fazlası',
      proteinIntake: '1.8-2.2g/kg vücut ağırlığı',
      preworkout: 'Karb + protein (enerji için)',
      postworkout: 'Hızlı protein (30-45 dakika içinde)',
      tips: [
        'Her öğüne 30-40g protein',
        'Antrenman sonrası hızlı karbonhidrat + protein',
        'Bol bol su için',
        'Uyku kalitesine dikkat (kas onarımı)',
      ],
    },
    diabetes: {
      carbControl: 'Düşük GI (Glisemik İndeks) karbonhidratlar',
      mealTiming: 'Düzenli ve küçük öğünler',
      avoid: 'İşlenmiş şeker, beyaz un ürünleri',
      recommended: [
        'Tam tahıllar',
        'Baklagiller',
        'Yeşil yapraklı sebzeler',
        'Omega-3 zengin balıklar',
        'Fındık ve tohumlar',
      ],
    },
    vegan: {
      proteinSources: 'Baklagiller, tofu, tempeh, kinoa, chia tohumu',
      b12: 'B12 vitamini takviyesi gerekli',
      iron: 'Demir (C vitamini ile beraber alın)',
      calcium: 'Tahini, fındık, yeşil yapraklı sebzeler',
      tips: [
        'Proteini çeşitli kaynaklardan alın',
        'B12 takviyesi alın',
        'Omega-3 için chia/keten tohumu',
        'Demir emilimi için C vitamini',
      ],
    },
  },

  // Sık Sorulan Sorular ve Yanıtları
  faq: {
    intermittentFasting: {
      q: 'Aralıklı oruç yapmalı mıyım?',
      a: 'Aralıklı oruç (örn: 16/8 metodu) bazı kişiler için etkili olabilir. Ancak herkes için uygun değildir. Özellikle diyabet, hipoglisemi veya yeme bozukluğu geçmişiniz varsa doktorunuza danışın. İyi çalışıyorsa devam edebilirsiniz ama zorunlu değildir.',
    },
    cheatMeal: {
      q: 'Hile günü yapabilir miyim?',
      a: 'Haftada bir kontrollü "cheat meal" (hile öğün) motivasyonu artırır ve metabolizmayı hızlandırabilir. Ama tüm gün değil, sadece bir öğün. Ve haftalık kalori hedefini çok aşmamaya dikkat edin.',
    },
    supplements: {
      q: 'Hangi takviyeleri almalıyım?',
      a: 'Temel takviyeler: D vitamini (güneş azsa), Omega-3 (balık yemiyorsanız), B12 (vegan iseniz). Protein tozu ihtiyaca göre. Diğer takviyeler için kan tahlili yaptırıp eksiklik varsa alın. Gereksiz takviye almayın.',
    },
    carbsTiming: {
      q: 'Karbonhidratları ne zaman yemeliyim?',
      a: 'Karbon hidratları özellikle aktivite öncesi ve sonrası iyi. Sabah kahvaltıda kompleks karb (yulaf), antrenman öncesi hızlı karb (muz), sonrasında protein+karb. Akşamları daha hafif karbonhidrat tercih edin.',
    },
  },
};

// ============================================================================
// CONVERSATION SCENARIOS - KONUŞMA SENARYOLARI
// ============================================================================

export interface ConversationContext {
  userMessage: string;
  intent?: string;
  keywords?: string[];
}

export const CONVERSATION_SCENARIOS = {
  greeting: {
    patterns: ['merhaba', 'selam', 'hey', 'hi', 'günaydın', 'iyi günler'],
    response: `Merhaba! Ben ${COACH_PERSONA.name}, senin kişisel beslenme koçunum 🥗\n\nBugün sana nasıl yardımcı olabilirim? İşte yapabileceklerim:\n\n• 🎯 Kilo verme/alma hedefleri için destek\n• 🍽️ Günlük beslenme planı hazırlama\n• 💪 Spor beslenmesi tavsiyeleri\n• 🥗 Sağlıklı yemek önerileri\n• ❓ Beslenme hakkında sorularını yanıtlama\n\nNe konuda yardım istiyorsun?`,
  },

  weightLoss: {
    patterns: ['kilo vermek', 'zayıflamak', 'kilo kaybı', 'diyet', 'yağ yakmak'],
    response: `Kilo vermek istiyorsun, harika! Sağlıklı ve sürdürülebilir kilo kaybı için şu adımları öneriyorum:\n\n✅ **1. Kalori Açığı Oluştur**\n- Günlük 300-500 kalori eksiği (haftada 0.5-1 kg kilo kaybı)\n- Aşırı kısıtlama yapma (metabolizma yavaşlar)\n\n✅ **2. Protein Önceliğini Artır**\n- Her öğüne protein ekle (tokluk hissi)\n- Önerilen: Tavuk, balık, yumurta, yoğurt, baklagiller\n\n✅ **3. Su Tüketimini Artır**\n- Günde 2-3 litre su\n- Açlık hissini azaltır, metabolizmayı hızlandırır\n\n✅ **4. Düzenli Öğünler**\n- 3 ana + 2 ara öğün\n- Sabah kahvaltısını atla MA\n\n✅ **5. Hareketli Ol**\n- Haftada en az 3-4 gün egzersiz\n- Kardiyo + direnç antrenmanı kombinasyonu\n\nBir örnek günlük plan ister misin? Ya da özel bir durumun var mı?`,
  },

  muscleGain: {
    patterns: ['kas yapmak', 'kas kazanmak', 'bulk', 'hacim', 'kütlelenme'],
    response: `Kas kazanmak için harika bir hedef! İşte profesyonel önerilerim:\n\n💪 **1. Kalori Fazlası Oluştur**\n- Günlük ihtiyacın + 200-300 kalori\n- Temiz bulk (çok fazla artırma)\n\n💪 **2. Yüksek Protein**\n- 1.8-2.2g/kg vücut ağırlığı\n- Her öğüne 30-40g protein dağıt\n\n💪 **3. Antrenman Beslenmesi**\n- **Öncesi:** Karb + protein (1-2 saat önce)\n- **Sonrası:** Hızlı protein + karb (30-45 dk içinde)\n\n💪 **4. Önerilen Besinler**\n- Protein: Tavuk, yumurta, balık, yoğurt\n- Karb: Yulaf, tatlı patates, esmer pirinç\n- Yağ: Fındık, avokado, zeytinyağı\n\n💪 **5. Uyku ve Dinlenme**\n- 7-9 saat kaliteli uyku (kas onarımı)\n- Bol su (kas hücrelerine taşıma)\n\nBir örnek beslenme planı hazırlayayım mı?`,
  },

  mealPlan: {
    patterns: ['beslenme planı', 'menü', 'yemek listesi', 'diyet programı', 'ne yemeliyim'],
    response: `Harika! Sana dengeli bir günlük beslenme planı hazırlayacağım 📋\n\nAma önce birkaç bilgiye ihtiyacım var:\n\n1️⃣ **Hedefin nedir?**\n   - Kilo vermek / Kilo almak / Kilonu korumak\n\n2️⃣ **Aktivite seviyeni nasıl?**\n   - Hareketsiz / Orta / Çok aktif\n\n3️⃣ **Özel durumun var mı?**\n   - Alerji, intolerans, vegan/vejetaryen vb.\n\n4️⃣ **Kaç öğün tercih edersin?**\n   - 3 ana + 2 ara / 5-6 küçük öğün\n\nBu bilgileri paylaşırsan sana özel bir plan hazırlayayım! 🥗`,
  },

  healthyFood: {
    patterns: ['sağlıklı', 'ne yesem', 'öneri', 'yemek', 'besin'],
    response: `Sağlıklı beslenme için süper besin önerilerim 🌟\n\n🥗 **Sebzeler (Sınırsız)**\n- Brokoli, ıspanak, karnabahar (vitamin bombası)\n- Yeşil yapraklılar (lif ve antioksidan)\n\n🍗 **Protein Kaynakları**\n- Tavuk göğsü, hindi\n- Somon, ton balığı (Omega-3)\n- Yumurta (tam protein)\n- Baklagiller (vegan protein)\n\n🍚 **Kompleks Karbonhidratlar**\n- Yulaf, kinoa, bulgur\n- Tatlı patates, esmer pirinç\n- Tam buğday ürünleri\n\n🥑 **Sağlıklı Yağlar**\n- Avokado, zeytinyağı\n- Fındık, ceviz, badem\n- Chia tohumu, keten tohumu\n\n🍎 **Meyveler (Porsiyonla)**\n- Elma, muz (lif)\n- Çilek, yaban mersini (antioksidan)\n\nHangisi hakkında daha fazla bilgi istersin?`,
  },

  supplements: {
    patterns: ['takviye', 'vitamin', 'supplement', 'protein tozu', 'kreatin'],
    response: `Takviyeler hakkında merak ettiklerini cevaplayalım 💊\n\n✅ **Kesinlikle Alınması Gerekenler**\n- **D Vitamini:** Güneş azsa mutlaka (2000-4000 IU)\n- **Omega-3:** Balık yemiyorsanız (1000-2000mg EPA+DHA)\n- **B12:** Vegan/vejetaryenler için zorunlu\n\n✔️ **İhtiyaca Göre Alınabilir**\n- **Protein Tozu:** Günlük proteini karşılamıyorsan\n- **Kreatin:** Spor yapıyorsan (5g/gün)\n- **Magnezyum:** Uyku problemin varsa\n\n❌ **Gereksiz Takviyeler**\n- Yağ yakıcılar (işe yaramaz)\n- Detoks tozları (vücut zaten detoks yapar)\n- Çoklu vitamin (dengeli besleniyorsan gerekli değil)\n\n💡 **Önerim:** Önce kan tahlili yaptır, eksik olanları al. Gereksiz takviye alma, paraya değmez!\n\nHangi takviye hakkında daha fazla bilgi istersin?`,
  },

  water: {
    patterns: ['su', 'su içmek', 'sıvı', 'hidrasyon'],
    response: `Su tüketimi çok önemli! İşte bilmen gerekenler 💧\n\n✅ **Günlük Su İhtiyacı**\n- Hareketsiz: 2-2.5 litre\n- Orta aktif: 2.5-3 litre\n- Çok aktif: 3-4 litre\n\n✅ **Su İçmenin Faydaları**\n- Metabolizmayı %3-4 hızlandırır\n- Açlık hissini azaltır\n- Toksik atıkları temizler\n- Cilt sağlığı ve parlaklık\n- Kas performansı\n\n✅ **Ne Zaman İçilmeli?**\n- Sabah kalktığında (1-2 bardak)\n- Her öğün öncesi (1 bardak)\n- Egzersiz sırasında (sık sık)\n- Yatmadan önce (1 bardak)\n\n💡 **İpucu:** Telefonuna hatırlatıcı kur, her saat başı 1 bardak iç!\n\nBaşka sorum var mı?`,
  },

  exercise: {
    patterns: ['spor', 'egzersiz', 'antrenman', 'workout', 'fitness'],
    response: `Spor beslenmesi hakkında bilgi vermek isterim 💪\n\n🏋️ **Antrenman Öncesi (1-2 saat önce)**\n- Kompleks karb + protein\n- Örnek: Yulaf + yumurta / Tatlı patates + tavuk\n- Amaç: Enerji sağlamak\n\n🏋️ **Antrenman Sırasında**\n- Bol su (her 15 dakikada)\n- Uzun antrenman (>90dk) ise BCAA\n\n🏋️ **Antrenman Sonrası (30-45 dk içinde)**\n- Hızlı protein + hızlı karb\n- Örnek: Whey protein + muz / Tavuk + pirinç\n- Amaç: Kas onarımı ve glikojen depolama\n\n💡 **Genel İpuçları**\n- Antrenman öncesi ağır yemek yeme\n- Antrenman sonrası acele etme (30-45 dk penceresi var)\n- Uyku ve dinlenme çok önemli (kas büyüme burada olur)\n\nHangi sporu yapıyorsun? Özel öneride bulunayım!`,
  },

  motivation: {
    patterns: ['motivasyon', 'pes ettim', 'yapamıyorum', 'zor', 'bırakmak istiyorum'],
    response: `Anlıyorum, bazen zorlayıcı olabiliyor. Ama sen harikasın ve başarabilirsin! 💪✨\n\n🌟 **Unutma:**\n- Mükemmel olmana gerek yok, tutarlı olmana gerek var\n- Küçük adımlar büyük değişiklikler yaratır\n- Kötü bir gün, kötü bir yaşam demek değil\n\n🎯 **Pratik İpuçları**\n1. Küçük hedefler koy (haftada 0.5 kg, her gün 30 dk yürüyüş)\n2. İlerlemeni kaydet (fotoğraf, ölçüm, not)\n3. Kendini ödüllendir (hile öğün, yeni kıyafet)\n4. Destek al (arkadaş, aile, ben)\n\n💡 **Bugün için tek hedefin:**\n- 2 litre su iç\n- Sağlıklı bir öğün ye\n- 10 dakika yürü\n\nKüçük başla, sonuçlar gelecek! Ben hep yanındayım 🤗\n\nBugün nasıl hissediyorsun? Konuşmak ister misin?`,
  },

  general: {
    patterns: ['*'], // Catch-all
    response: `Anladım! Beslenme hakkında sorduğun soru için elimden geleni yapacağım 🤓\n\nŞu konularda uzmanım:\n- 🎯 Kilo yönetimi (verme/alma)\n- 🍽️ Beslenme planları ve menüler\n- 💪 Spor beslenmesi\n- 🥗 Sağlıklı besin önerileri\n- 💊 Takviye önerileri\n- ❓ Beslenme hakkında genel sorular\n\nDaha spesifik bir soru sorabilir misin? Örneğin:\n- "Kilo vermek istiyorum, nasıl başlamalıyım?"\n- "Kas yapmak için ne yemeliyim?"\n- "Günlük beslenme planı hazırla"\n\nSana nasıl yardımcı olabilirim?`,
  },
};

// ============================================================================
// AI COACH ENGINE - AKILLI CEVAP MOTORU
// ============================================================================

export class NutritionCoachEngine {
  /**
   * Kullanıcı mesajını analiz edip en uygun cevabı döner
   */
  static async generateResponse(userMessage: string): Promise<string> {
    const normalizedMessage = userMessage.toLowerCase().trim();
    
    // Intent detection (senaryo tespiti)
    for (const [scenarioKey, scenario] of Object.entries(CONVERSATION_SCENARIOS)) {
      if (scenario.patterns.some((pattern: string) => 
        pattern === '*' || normalizedMessage.includes(pattern)
      )) {
        return scenario.response;
      }
    }

    // Default fallback
    return CONVERSATION_SCENARIOS.general.response;
  }

  /**
   * Gemini API ile entegrasyon için hazır fonksiyon
   * Şimdilik senaryo tabanlı, sonra Gemini API bağlanacak
   */
  static async callGeminiAPI(userMessage: string): Promise<string> {
    // TODO: Gemini API entegrasyonu
    // const response = await fetch(GEMINI_API_URL + '/models/gemini-pro:generateContent', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-goog-api-key': GEMINI_API_KEY,
    //   },
    //   body: JSON.stringify({
    //     contents: [{
    //       parts: [{ text: userMessage }]
    //     }]
    //   })
    // });
    
    // Şimdilik senaryo tabanlı dön
    return this.generateResponse(userMessage);
  }

  /**
   * Kullanıcı profiline göre özelleştirilmiş cevap
   */
  static async generatePersonalizedResponse(
    userMessage: string,
    userProfile?: {
      goal?: 'weightLoss' | 'muscleGain' | 'maintain';
      activityLevel?: 'sedentary' | 'moderate' | 'active';
      specialConditions?: string[];
    }
  ): Promise<string> {
    // Basit personalizasyon
    let response = await this.generateResponse(userMessage);
    
    if (userProfile?.goal === 'weightLoss') {
      response += '\n\n💡 *Kilo verme hedefin için özel ipucu: Her öğüne protein ekle, su tüketimini artır!*';
    } else if (userProfile?.goal === 'muscleGain') {
      response += '\n\n💡 *Kas kazanma hedefin için özel ipucu: Antrenman sonrası 30 dakika içinde protein al!*';
    }
    
    return response;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default NutritionCoachEngine;
