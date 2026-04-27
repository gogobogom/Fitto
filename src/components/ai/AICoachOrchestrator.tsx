'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIAccess } from '@/hooks/useAIAccess';
import AIFloatingButton from './AIFloatingButton';
import AIPopupContainer from './AIPopupContainer';
import AISubscriptionUpsell from './AISubscriptionUpsell';
import AIChatInterface from './AIChatInterface';
import AIQuickActions from './AIQuickActions';
import AITrialBanner from './AITrialBanner';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AICoachOrchestratorProps {
  userId: string;
}

// ============================================================================
// ADVANCED CONVERSATIONAL AI SYSTEM
// ============================================================================

class ConversationalAICoach {
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private userProfile: {
    hasSharedCalories?: boolean;
    hasSharedGoal?: boolean;
    calorieBudget?: number;
    goalType?: 'lose' | 'gain' | 'maintain';
    activityLevel?: 'low' | 'medium' | 'high';
    preferences?: string[];
  } = {};

  constructor(private language: 'tr' | 'en') {}

  /**
   * Generate human-like, empathetic, conversational response
   * This AI coach ASKS QUESTIONS, shows EMPATHY, and builds RAPPORT
   */
  async generateResponse(userMessage: string): Promise<string> {
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: userMessage });

    // Analyze user message for context
    const context = this.analyzeMessage(userMessage);
    
    // Update user profile
    this.updateUserProfile(context);

    // Generate response based on context and conversation stage
    let response = await this.craftResponse(userMessage, context);

    // Add to history
    this.conversationHistory.push({ role: 'assistant', content: response });

    return response;
  }

  private analyzeMessage(message: string): any {
    const lower = message.toLowerCase();
    const numbers = message.match(/\d+/g);

    return {
      isGreeting: /^(merhaba|hi|hello|selam|hey|günaydın|good morning)/i.test(message),
      hasCalories: /kalori|calorie/i.test(message),
      hasWeight: /kilo|kg|weight|pound/i.test(message),
      hasGoal: /hedef|goal|amaç|target|vermek|kazanmak|lose|gain/i.test(message),
      hasMeal: /ne yesem|yemek|öğün|kahvaltı|öğle|akşam|meal|breakfast|lunch|dinner|food|eat/i.test(message),
      hasExercise: /egzersiz|spor|workout|exercise|gym|koş|yürü|run|walk/i.test(message),
      hasMotivation: /motivasyon|motivation|destek|support|zorlanıyorum|struggling|help|yardım/i.test(message),
      hasQuestion: /\?/i.test(message) || /nasıl|how|ne|what|hangi|which/i.test(message),
      isShort: message.length < 20,
      isLong: message.length > 100,
      numbers: numbers ? numbers.map(n => parseInt(n)) : [],
      sentiment: this.detectSentiment(lower),
      messageType: this.classifyMessageType(lower),
    };
  }

  private detectSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['harika', 'güzel', 'mutlu', 'başardım', 'great', 'good', 'happy', 'success'];
    const negativeWords = ['zorlanıyorum', 'başaramıyorum', 'üzgün', 'kötü', 'struggling', 'failed', 'sad', 'bad'];
    
    const hasPositive = positiveWords.some(w => message.includes(w));
    const hasNegative = negativeWords.some(w => message.includes(w));

    if (hasNegative) return 'negative';
    if (hasPositive) return 'positive';
    return 'neutral';
  }

  private classifyMessageType(message: string): string {
    if (/canım.*çekti|craving|istiyorum.*yemek|want to eat/i.test(message)) return 'craving';
    if (/bugün ne|what.*today|öneri|suggest/i.test(message)) return 'seeking_advice';
    if (/\d+.*kalori|consumed.*calorie/i.test(message)) return 'tracking';
    if (/kilo vermek|lose weight|zayıflamak|slim/i.test(message)) return 'goal_setting';
    if (/nasıl|how to|yöntem|method/i.test(message)) return 'asking_how';
    return 'general';
  }

  private updateUserProfile(context: any): void {
    if (context.hasCalories && context.numbers.length > 0) {
      this.userProfile.hasSharedCalories = true;
      this.userProfile.calorieBudget = context.numbers[0];
    }

    if (context.hasGoal) {
      this.userProfile.hasSharedGoal = true;
      if (/vermek|lose/i.test(context.messageType)) {
        this.userProfile.goalType = 'lose';
      } else if (/almak|gain/i.test(context.messageType)) {
        this.userProfile.goalType = 'gain';
      }
    }
  }

  private async craftResponse(userMessage: string, context: any): Promise<string> {
    const isFirstMessage = this.conversationHistory.length <= 2;
    const isTurkish = this.language === 'tr';

    // 1. GREETING - Warm, friendly, personal
    if (context.isGreeting || isFirstMessage) {
      return isTurkish
        ? `Merhaba! 😊 Ben senin kişisel beslenme ve yaşam koçunum. Beni Fitto diye çağırabilirsin.\n\nSenle tanışmak beni çok mutlu etti! Sağlıklı yaşam yolculuğunda yanında olmak için buradayım.\n\n🤔 Söyle bakalım, bugün nasılsın? Hedeflerin hakkında konuşalım mı, yoksa başka bir konuda yardımcı olayım mı?`
        : `Hello! 😊 I'm your personal nutrition and life coach. You can call me Fitto.\n\nSo happy to meet you! I'm here to support you on your healthy living journey.\n\n🤔 Tell me, how are you today? Shall we talk about your goals, or can I help you with something else?`;
    }

    // 2. CRAVING - Empathetic, understanding, helpful
    if (context.messageType === 'craving') {
      const wantsMeat = /et|meat|tavuk|chicken|köfte|meatball|steak/i.test(userMessage);
      const wantsSweet = /tatlı|sweet|çikolata|chocolate|dondurma|ice cream/i.test(userMessage);

      if (wantsMeat) {
        return isTurkish
          ? `Ah, et canın çekmiş! 😊 Bunu çok iyi anlıyorum - protein ihtiyacın var demek!\n\n🍗 İşte sana hem lezzetli hem sağlıklı seçenekler:\n\n**Tavuk Göğsü (150g) - 165 kalori**\n• Baharatlarla marine et, ızgarada 6-7 dakika\n• Yanında renkli salata harika olur\n• Protein bombası! 💪\n\n**Dana Biftek (120g) - 250 kalori**\n• Yağsız kısım seç, orta pişirme ideal\n• Limon + tuz + karabiber = mükemmel!\n\n**Köfte (ev yapımı, 4 adet) - 280 kalori**\n• Fırında pişirerek yağ oranını düşür\n• Yoğurt + salata ile servir\n\nSence hangisi daha iyi görünüyor? 😋 Ya da başka bir et türü mü aklında?`
          : `Ah, you're craving meat! 😊 I totally understand - your body needs protein!\n\n🍗 Here are delicious AND healthy options:\n\n**Chicken Breast (150g) - 165 calories**\n• Marinate with spices, grill for 6-7 minutes\n• Colorful salad on the side is perfect\n• Protein bomb! 💪\n\n**Beef Steak (120g) - 250 calories**\n• Choose lean cut, medium is ideal\n• Lemon + salt + pepper = perfection!\n\n**Meatballs (homemade, 4 pieces) - 280 calories**\n• Bake to reduce fat\n• Serve with yogurt + salad\n\nWhich one looks better to you? 😋 Or did you have another type of meat in mind?`;
      }

      if (wantsSweet) {
        return isTurkish
          ? `Tatlı canın çekmişse, bu tamamen doğal! 🍫 Vücudun enerji istiyor olabilir.\n\n💡 Önce bir şey sorayım: Bugün yeterli su içtin mi? Bazen susuzluk tatlı isteği olarak hissedilebilir.\n\nAma eğer gerçekten tatlı istiyorsan, işte akıllı seçenekler:\n\n🍓 **Meyve + Bitter Çikolata (2 kare)** - 120 kal\n🥜 **Fıstık Ezmesi + Muz** - 180 kal\n🍨 **Yoğurt + Bal + Tarçın** - 140 kal\n\nHangisi kulağa daha çekici geliyor? Yoksa başka bir şey mi düşünüyordun? 😊`
          : `If you're craving sweets, that's totally natural! 🍫 Your body might be asking for energy.\n\n💡 Let me ask first: Did you drink enough water today? Sometimes thirst can feel like sugar cravings.\n\nBut if you really want something sweet, here are smart choices:\n\n🍓 **Fruit + Dark Chocolate (2 squares)** - 120 cal\n🥜 **Peanut Butter + Banana** - 180 cal\n🍨 **Yogurt + Honey + Cinnamon** - 140 cal\n\nWhich one sounds more appealing? Or were you thinking of something else? 😊`;
      }

      // General craving
      return isTurkish
        ? `Anlıyorum, bir şeyler atıştırmak istiyorsun! 😊 Bu çok normal.\n\n🤔 Bana biraz daha detay verir misin?\n• Tatlı mı istiyorsun, tuzlu mu?\n• Çok aç mısın yoksa sadece canın mı çekiyor?\n• Bugün kaç kalori aldın?\n\nBunları bildiğimde sana en uygun öneriyi yapabilirim! 🎯`
        : `I understand, you want to snack on something! 😊 That's totally normal.\n\n🤔 Can you give me a bit more detail?\n• Do you want something sweet or savory?\n• Are you very hungry or just craving?\n• How many calories have you had today?\n\nOnce I know these, I can give you the best suggestion! 🎯`;
    }

    // 3. CALORIE TRACKING - Analytical, supportive, actionable
    if (context.hasCalories && context.numbers.length > 0) {
      const intake = context.numbers[0];
      const target = context.numbers.length > 1 ? context.numbers[1] : 1800;
      const diff = target - intake;

      if (diff > 0) {
        return isTurkish
          ? `Harika! 👏 Şu an ${intake} kaloriyi tamamlamışsın, hedefin ${target} kalori.\n\nYani bugün için elinde **${diff} kalori** daha var! 🎉\n\n💭 Şimdi sana birkaç soru sorayım:\n\n1️⃣ Bu ${diff} kaloriyi nasıl kullanmak istersin?\n   • Sağlıklı bir öğünle mi?\n   • Atıştırmalıklarla mı?\n   • Bugün egzersiz yaptın mı?\n\n2️⃣ Şu an nasıl hissediyorsun?\n   • Aç mısın?\n   • Tok ama bir şeyler atıştırmak istiyorsun?\n\nSöyle bana, senin için en uygun planı hazırlayayım! 😊`
          : `Great! 👏 You've consumed ${intake} calories so far, your goal is ${target} calories.\n\nSo you have **${diff} more calories** left for today! 🎉\n\n💭 Let me ask you a few questions:\n\n1️⃣ How would you like to use these ${diff} calories?\n   • With a healthy meal?\n   • With snacks?\n   • Did you exercise today?\n\n2️⃣ How are you feeling right now?\n   • Are you hungry?\n   • Full but want to snack?\n\nTell me, and I'll prepare the perfect plan for you! 😊`;
      } else if (diff < 0) {
        const over = Math.abs(diff);
        return isTurkish
          ? `Hey, dinle... 😊 Bugün hedefinin ${over} kalori üzerindesin. Ama önce bir şey söyleyeyim:\n\n**Bu tamamen normal!** 🌟\n\n🤔 Merak ediyorum:\n• Bugün özel bir durum mu vardı?\n• Kendini aç mı hissettin?\n• Yeterince su içtin mi?\n\nBak, bir günlük fazlalık hiçbir şey değil. Önemli olan haftalık dengeni koruman. Yarın için akıllı bir plan yapalım mı?\n\n💪 Sana yardımcı olmak istiyorum - sen ne dersin?`
          : `Hey, listen... 😊 You're ${over} calories over your target today. But let me tell you something first:\n\n**This is completely normal!** 🌟\n\n🤔 I'm curious:\n• Was there a special occasion today?\n• Were you feeling hungry?\n• Did you drink enough water?\n\nLook, one day over doesn't matter. What matters is keeping your weekly balance. Shall we make a smart plan for tomorrow?\n\n💪 I want to help you - what do you think?`;
      } else {
        return isTurkish
          ? `WOW! 🎯🎉 Tam hedefine ulaşmışsın - ${target} kalori!\n\nBu inanılmaz bir başarı! Gerçekten gurur duymalısın. 👏\n\n🤔 Söyle bana:\n• Bugün kendini nasıl hissediyorsun?\n• Bu başarıyı nasıl kutlamak istersin? (Yemeksiz bir şeyler tabii! 😄)\n• Yarın da devam etmek için motivasyonun nasıl?\n\nSen harikasın! Ben senin yanındayım! 💪✨`
          : `WOW! 🎯🎉 You hit your target exactly - ${target} calories!\n\nThis is an incredible achievement! You should really be proud. 👏\n\n🤔 Tell me:\n• How are you feeling today?\n• How would you like to celebrate this success? (Non-food of course! 😄)\n• What's your motivation like for continuing tomorrow?\n\nYou're amazing! I'm with you! 💪✨`;
      }
    }

    // 4. GOAL SETTING - Empowering, detailed, personalized
    if (context.messageType === 'goal_setting' || (context.hasWeight && context.hasGoal)) {
      return isTurkish
        ? `Kilo verme hedefin var, harika! 🎯 Bunu başarmak için buradayım.\n\nAma önce seni daha iyi tanımalıyım. Birkaç soru sorabilir miyim? 🤗\n\n1️⃣ **Şu anki kilon ve hedef kilon nedir?**\n   (Örnek: "75 kiloyum, 68 kilo olmak istiyorum")\n\n2️⃣ **Bu hedefe ne kadar sürede ulaşmak istiyorsun?**\n   (Sağlıklı: Ayda 2-4 kg)\n\n3️⃣ **Günlük aktivite seviyeni nasıl tanımlarsın?**\n   • Az hareketli (ofis işi, çoğunlukla oturuyorum)\n   • Orta (günde 30 dk yürüyüş yapıyorum)\n   • Aktif (düzenli spor yapıyorum)\n\n4️⃣ **Daha önce diyet denedin mi? Sonuçlar nasıldı?**\n\nBu bilgileri paylaşırsan, sana özel, sürdürülebilir bir plan hazırlayabilirim! 💪`
        : `You have a weight loss goal, great! 🎯 I'm here to help you achieve it.\n\nBut first, I need to know you better. Can I ask a few questions? 🤗\n\n1️⃣ **What's your current weight and target weight?**\n   (Example: "I'm 165 lbs, want to be 150 lbs")\n\n2️⃣ **How long do you want to reach this goal?**\n   (Healthy: 4-8 lbs per month)\n\n3️⃣ **How would you describe your daily activity level?**\n   • Sedentary (office job, mostly sitting)\n   • Moderate (30 min walk per day)\n   • Active (regular exercise)\n\n4️⃣ **Have you tried diets before? How did they go?**\n\nIf you share this info, I can prepare a personalized, sustainable plan for you! 💪`;
    }

    // 5. SEEKING ADVICE - Helpful, detailed, interactive
    if (context.messageType === 'seeking_advice' || context.hasMeal) {
      const askingBreakfast = /kahvaltı|breakfast/i.test(userMessage);
      const askingLunch = /öğle|lunch/i.test(userMessage);
      const askingDinner = /akşam|dinner/i.test(userMessage);

      if (askingBreakfast) {
        return isTurkish
          ? `Kahvaltı önerisi mi? Güzel! ☀️ Günü doğru başlatmak çok önemli.\n\n🤔 Sana birkaç soru sorayım:\n\n1️⃣ **Kahvaltı için ne kadar vaktinvar?**\n   • 5-10 dakika (hızlı)\n   • 20-30 dakika (rahat)\n\n2️⃣ **Tatlı mı tuzlu mu tercih edersin?**\n\n3️⃣ **Kahvaltıda kesinlikle bulunmasını istediğin bir şey var mı?**\n   (Örnek: Yumurta, peynir, ekmek...)\n\n4️⃣ **Bugün için kalori hedefin ne?**\n\nBu soruları cevaplayınca, sana mükemmel bir kahvaltı menüsü hazırlayacağım! 🍳`
          : `Breakfast suggestion? Nice! ☀️ Starting the day right is so important.\n\n🤔 Let me ask you a few questions:\n\n1️⃣ **How much time do you have for breakfast?**\n   • 5-10 minutes (quick)\n   • 20-30 minutes (relaxed)\n\n2️⃣ **Do you prefer sweet or savory?**\n\n3️⃣ **Is there something you absolutely want in breakfast?**\n   (Example: Eggs, cheese, bread...)\n\n4️⃣ **What's your calorie target for today?**\n\nOnce you answer these, I'll prepare a perfect breakfast menu for you! 🍳`;
      }

      // General meal advice
      return isTurkish
        ? `Yemek konusunda yardım istiyorsun, harika! 🍽️\n\n🤔 Daha iyi önerebilmem için:\n\n1️⃣ **Hangi öğün için öneri istiyorsun?**\n   • Kahvaltı ☀️\n   • Öğle yemeği 🌤️\n   • Akşam yemeği 🌙\n   • Atıştırmalık 🍪\n\n2️⃣ **Bugün ne kadar kalori aldın?**\n\n3️⃣ **Özel bir isteğin var mı?**\n   (Örnek: "Et yemek istiyorum" veya "Vejetaryen")\n\n4️⃣ **Alerjin veya yiyemediğin bir şey var mı?**\n\nBöylece tam senlik bir menü çıkarabilirim! 😊`
        : `You want help with meals, great! 🍽️\n\n🤔 To suggest better:\n\n1️⃣ **Which meal do you need suggestions for?**\n   • Breakfast ☀️\n   • Lunch 🌤️\n   • Dinner 🌙\n   • Snack 🍪\n\n2️⃣ **How many calories have you had today?**\n\n3️⃣ **Any special requests?**\n   (Example: "I want meat" or "Vegetarian")\n\n4️⃣ **Any allergies or foods you can't eat?**\n\nThis way I can create the perfect menu for you! 😊`;
    }

    // 6. MOTIVATION - Empathetic, uplifting, real
    if (context.hasMotivation || context.sentiment === 'negative') {
      return isTurkish
        ? `Hey... Dur bir dakika. 🤗\n\nSenin şu an desteğe ihtiyacın olduğunu hissediyorum. Ve bu tamamen normal. Biliyorsun, sağlıklı yaşam yolculuğu her zaman kolay olmuyor.\n\n💭 **Sana bir şey söyleyeyim:**\n\nBaşarı, her gün mükemmel olmak değil. Başarı, her gün denemeye devam etmek. Sen şu an benimle konuşuyorsun - bu bile büyük bir adım! 💪\n\n🤔 Söyle bana:\n• Şu an neden zorlanıyorsun?\n• En çok ne seni engelliyor?\n• Sana nasıl destek olabilirim?\n\nSeninle konuşmak istiyorum. Yalnız değilsin! 🌟\n\nBazen sadece dinlenmek ve ertesi gün daha güçlü başlamak gerekir. Sen ne dersin?`
        : `Hey... Hold on a second. 🤗\n\nI feel like you need support right now. And that's completely normal. You know, the healthy living journey isn't always easy.\n\n💭 **Let me tell you something:**\n\nSuccess isn't being perfect every day. Success is continuing to try every day. You're talking to me right now - that's already a big step! 💪\n\n🤔 Tell me:\n• Why are you struggling right now?\n• What's blocking you the most?\n• How can I support you?\n\nI want to talk with you. You're not alone! 🌟\n\nSometimes you just need to rest and start stronger the next day. What do you think?`;
    }

    // 7. EXERCISE - Enthusiastic, practical, motivating
    if (context.hasExercise) {
      return isTurkish
        ? `Egzersiz! Evet! 💪 Bunu duyduğuma çok sevindim!\n\n🤔 Peki sana en uygun programı hazırlayabilmem için:\n\n1️⃣ **Şu an spor yapıyor musun?**\n   • Hiç yapmıyorum (yeni başlayacağım)\n   • Ara sıra yapıyorum\n   • Düzenli yapıyorum\n\n2️⃣ **Haftada kaç gün spor yapabilirsin?**\n   (Gerçekçi ol! 😊)\n\n3️⃣ **Hangi tür egzersizleri seviyorsun?**\n   • Yürüyüş/Koşu 🏃\n   • Evde egzersiz 🏠\n   • Spor salonu 🏋️\n   • Yoga/Pilates 🧘\n   • Diğer? (söyle!)\n\n4️⃣ **Hedefin ne?**\n   • Kilo vermek\n   • Form tutmak\n   • Kas yapmak\n\nSöyle bakalım, sana özel program hazırlayayım! 🎯`
        : `Exercise! Yes! 💪 So glad to hear that!\n\n🤔 So I can prepare the best program for you:\n\n1️⃣ **Are you currently exercising?**\n   • Not at all (just starting)\n   • Sometimes\n   • Regularly\n\n2️⃣ **How many days per week can you exercise?**\n   (Be realistic! 😊)\n\n3️⃣ **What types of exercise do you enjoy?**\n   • Walking/Running 🏃\n   • Home workout 🏠\n   • Gym 🏋️\n   • Yoga/Pilates 🧘\n   • Other? (tell me!)\n\n4️⃣ **What's your goal?**\n   • Lose weight\n   • Stay in shape\n   • Build muscle\n\nTell me, let me prepare a custom program for you! 🎯`;
    }

    // 8. DEFAULT - Curious, helpful, engaging
    return isTurkish
      ? `Hmm, seni tam olarak anlayamadım ama yardımcı olmak istiyorum! 🤗\n\n🤔 Belki şöyle başlayalım:\n\n**Bugün sana nasıl yardımcı olabilirim?**\n\n💬 Benimle rahatça konuşabilirsin. Örneğin:\n• "Bugün 1500 kalori aldım, ne yapmalıyım?"\n• "Canım köfte çekti!"\n• "5 kilo vermek istiyorum"\n• "Egzersiz programı lazım"\n• "Motivasyona ihtiyacım var"\n\nYa da başka bir şey... Ne istersen! 😊\n\nSöyle bana, seni dinliyorum! 👂`
      : `Hmm, I didn't quite understand you but I want to help! 🤗\n\n🤔 Maybe let's start like this:\n\n**How can I help you today?**\n\n💬 You can talk to me comfortably. For example:\n• "I had 1500 calories today, what should I do?"\n• "I'm craving meatballs!"\n• "I want to lose 10 pounds"\n• "I need an exercise program"\n• "I need motivation"\n\nOr something else... Whatever you want! 😊\n\nTell me, I'm listening! 👂`;
  }
}

// ============================================================================
// SERVER-SIDE API CALLER (NO CORS!)
// ============================================================================

async function callServerSideAICoach(
  messages: Array<{ role: string; content: string }>,
  language: 'tr' | 'en'
): Promise<string> {
  try {
    console.log('[AI Coach] 🚀 Calling server-side /api/ai-coach endpoint...');
    
    // Get last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      throw new Error('No user message found');
    }

    // Call our server-side API route (NO CORS!)
    const response = await fetch('/api/ai-coach', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: lastUserMessage.content,
        context: {
          language,
          conversationHistory: messages.slice(-3).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      })
    });

    console.log('[AI Coach] Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('[AI Coach] ✅ Success! Received response from server');
      return data.response || '';
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AI Coach] ❌ Server returned error:', response.status, errorData);
      throw new Error(`Server error: ${response.status}`);
    }
  } catch (error: unknown) {
    console.error('[AI Coach] ❌ Failed to call /api/ai-coach:', error);
    throw error;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AICoachOrchestrator({ userId }: AICoachOrchestratorProps) {
  const { language } = useLanguage();
  const aiAccess = useAIAccess({ requiresSubscription: true });
  
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasShownInitialPopup, setHasShownInitialPopup] = useState<boolean>(false);
  const [useAdvancedMock, setUseAdvancedMock] = useState<boolean>(false);
  
  const conversationalAIRef = useRef<ConversationalAICoach | null>(null);

  // Initialize conversational AI
  useEffect(() => {
    conversationalAIRef.current = new ConversationalAICoach(language);
  }, [language]);

  // Auto-open popup on first visit if user is not premium
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const dismissed = localStorage.getItem('fitto_ai_dismissed');
    const shown = localStorage.getItem('fitto_ai_shown');
    
    if (!dismissed && !shown && aiAccess.accessStatus === 'no_access') {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShownInitialPopup(true);
        localStorage.setItem('fitto_ai_shown', 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [aiAccess.accessStatus]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (hasShownInitialPopup && typeof window !== 'undefined') {
      localStorage.setItem('fitto_ai_dismissed', 'true');
    }
  }, [hasShownInitialPopup]);

  const handleStartTrial = useCallback(async () => {
    if (!userId) return;
    
    try {
      await aiAccess.startTrial();
      toast.success('🎉 3 günlük deneme başladı!');
      // State automatically updates via calculateAccess() - no reload needed!
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error('Deneme başlatılamadı');
    }
  }, [userId, aiAccess]);

  const handleWatchAd = useCallback(async () => {
    if (!userId) return;
    
    toast.info('🎬 Reklam yükleniyor...');
    
    setTimeout(async () => {
      try {
        await aiAccess.addAdCredits(3);
        toast.success('✅ 3 mesaj hakkı kazandınız!');
        // State automatically updates via calculateAccess() - no reload needed!
      } catch (error) {
        console.error('Error adding ad credits:', error);
        toast.error('Reklam kredisi eklenemedi');
      }
    }, 3000);
  }, [userId, aiAccess]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!userId || isLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let reply = '';

      // Build conversation history
      const conversationHistory = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: messageText }
      ];

      // Try server-side API first (if not already using mock)
      if (!useAdvancedMock) {
        try {
          reply = await callServerSideAICoach(conversationHistory, language);
          console.log('[AI Coach] ✅ Server-side API call successful!');
        } catch (apiError) {
          console.log('[AI Coach] ⚠️ GLM API failed, using Advanced Conversational Mock');
          setUseAdvancedMock(true);
          
          // Fallback to advanced conversational AI
          if (conversationalAIRef.current) {
            reply = await conversationalAIRef.current.generateResponse(messageText);
          }
        }
      } else {
        // Already using advanced mock
        console.log('[AI Coach] 🎭 Using Advanced Conversational AI Mock');
        if (conversationalAIRef.current) {
          reply = await conversationalAIRef.current.generateResponse(messageText);
        }
      }

      // Realistic delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Consume credit
      try {
        await aiAccess.consumeCredit();
      } catch (creditError) {
        console.error('[AI Coach] Failed to consume credit:', creditError);
      }
      
    } catch (error) {
      console.error('[AI Coach] Error:', error);
      
      const errorMessageContent = language === 'tr' 
        ? 'Üzgünüm, şu anda bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
        : 'Sorry, an error occurred. Please try again later.';
      
      toast.error(errorMessageContent);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorMessageContent,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, language, isLoading, aiAccess, messages, useAdvancedMock]);

  const handleQuickQuestion = useCallback((question: string) => {
    handleSendMessage(question);
  }, [handleSendMessage]);

  if (!userId) return null;

  const { accessStatus, isPremium, trialStatus, adCredits } = aiAccess;
  const hasAccess = accessStatus === 'premium' || accessStatus === 'trial' || accessStatus === 'ad_credits';
  const showUpsell = accessStatus === 'no_access';

  return (
    <>
      <AIFloatingButton
        onClick={() => setIsOpen(true)}
        isPremium={isPremium}
        hasActiveTrial={accessStatus === 'trial'}
        showPulse={!hasShownInitialPopup && accessStatus === 'no_access'}
      />

      <AIPopupContainer isOpen={isOpen} onClose={handleClose}>
        {showUpsell ? (
          <AISubscriptionUpsell
            onStartTrial={handleStartTrial}
            onWatchAd={handleWatchAd}
            onClose={handleClose}
          />
        ) : (
          <div className="h-full flex flex-col">
            {accessStatus === 'trial' && trialStatus && (
              <AITrialBanner
                daysLeft={trialStatus.daysLeft}
                messagesLeft={trialStatus.messagesLeft}
                dailyLimit={trialStatus.dailyLimit}
                adCredits={adCredits}
              />
            )}

            {isPremium && (
              <div className="border-b border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 text-center">
                <p className="text-sm font-semibold text-yellow-700">
                  👑 Premium Member - Sınırsız Erişim
                </p>
              </div>
            )}

            {accessStatus === 'ad_credits' && (
              <div className="border-b border-teal-200 bg-teal-50 p-3 text-center">
                <p className="text-sm text-teal-700">
                  ⚡ <span className="font-bold">{adCredits}</span> mesaj hakkınız var
                </p>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              <AIChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled={!hasAccess}
              />
            </div>

            <AIQuickActions
              onQuestionClick={handleQuickQuestion}
              disabled={isLoading || !hasAccess}
            />
          </div>
        )}
      </AIPopupContainer>
    </>
  );
}
