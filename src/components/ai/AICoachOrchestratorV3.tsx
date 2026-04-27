'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserContext {
  messages: Message[];
  calorieGoal?: number;
  currentCalories?: number;
  weight?: number;
  goals?: string[];
  preferences?: string[];
  mood?: 'positive' | 'neutral' | 'negative';
}

interface AICoachOrchestratorV3Props {
  onClose: () => void;
}

export function AICoachOrchestratorV3({ onClose }: AICoachOrchestratorV3Props): JSX.Element {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userContext, setUserContext] = useState<UserContext>({ messages: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    const welcomeMsg: Message = {
      role: 'assistant',
      content: language === 'tr'
        ? 'Merhaba! 😊 Ben senin kişisel beslenme ve yaşam koçun. Bana istediğin gibi konuşabilirsin - seni dinliyorum ve anlamaya çalışıyorum. Bugün sana nasıl yardımcı olabilirim?'
        : 'Hello! 😊 I\'m your personal nutrition and life coach. Feel free to talk to me however you like - I\'m listening and trying to understand you. How can I help you today?',
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, [language]);

  // Advanced NLP: Analyze user intent and sentiment
  const analyzeMessage = (text: string): {
    intent: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    keywords: string[];
    context: Record<string, unknown>;
  } => {
    const lowerText = text.toLowerCase();
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let intent = 'general';
    const keywords: string[] = [];
    const context: Record<string, unknown> = {};

    // Sentiment analysis (Turkish & English)
    const positiveWords = ['iyi', 'harika', 'güzel', 'mükemmel', 'başarılı', 'mutlu', 'good', 'great', 'excellent', 'happy'];
    const negativeWords = ['kötü', 'zor', 'problem', 'sıkıntı', 'zorlanıyorum', 'olmaz', 'bad', 'difficult', 'struggling', 'problem'];
    
    if (positiveWords.some(word => lowerText.includes(word))) sentiment = 'positive';
    if (negativeWords.some(word => lowerText.includes(word))) sentiment = 'negative';

    // Intent detection
    if (/(canım|isteği?m?|çekti|yemek|yiyebilir|yesem)/i.test(lowerText)) {
      intent = 'food_craving';
      const foodMatches = lowerText.match(/(et|köfte|tavuk|balık|sebze|meyve|salata|protein|karbonhidrat)/g);
      if (foodMatches) keywords.push(...foodMatches);
    } else if (/(ne yesem|öneri|tavsiye|plan|menü)/i.test(lowerText)) {
      intent = 'meal_suggestion';
    } else if (/(kalori|kcal|\d+\s*kalori)/i.test(lowerText)) {
      intent = 'calorie_tracking';
      const calorieMatch = lowerText.match(/(\d+)\s*kalori/);
      if (calorieMatch) context.calories = parseInt(calorieMatch[1]);
    } else if (/(kilo|zayıf|şişman|kil verme|kilo alma)/i.test(lowerText)) {
      intent = 'weight_management';
    } else if (/(egzersiz|spor|hareket|antrenman|workout)/i.test(lowerText)) {
      intent = 'exercise';
    } else if (/(motivasyon|destek|zorlanıyorum|yalnız|sıkkın)/i.test(lowerText)) {
      intent = 'emotional_support';
      sentiment = 'negative';
    }

    return { intent, sentiment, keywords, context };
  };

  // Generate contextual response based on analysis
  const generateContextualResponse = async (userMessage: string, analysis: ReturnType<typeof analyzeMessage>): Promise<string> => {
    const { intent, sentiment, keywords, context } = analysis;

    // Try real GLM API first
    try {
      const realResponse = await callRealGLMAPI(userMessage);
      if (realResponse) return realResponse;
    } catch (error) {
      console.log('[AI Coach V3] GLM API fallback to advanced conversational AI');
    }

    // Advanced conversational AI (fallback)
    const isTurkish = language === 'tr';

    switch (intent) {
      case 'food_craving': {
        if (keywords.includes('köfte') || keywords.includes('et')) {
          if (sentiment === 'negative') {
            // User is upset about wanting meat
            return isTurkish
              ? `Hey, dur bir dakika! 🤗 Canının köfte istemesi tamamen doğal ve normal bir şey. Bedenin protein ihtiyacı olduğunu söylüyor sana.

**Seni anlıyorum** - bazen belirli yemekleri çok isteriz, özellikle de vücudumuz o besin öğesine ihtiyaç duyuyorsa.

İşte sana **hem lezzetli hem sağlıklı** seçenekler:

🍖 **Ev Yapımı Köfte (4 adet)**
• Yağsız dana kıyma kullan
• Fırında pişir (yağ oranı %50 azalır!)
• ~280 kalori + 25g protein
• Yoğurt ve salata ile servis et

🍗 **Alternatif: Izgara Köfte Tadında**
• Tavuk göğsü baharatlarla marine et
• Köfte şeklinde yap ve ızgarada pişir  
• ~200 kalori, aynı lezzet!

**Sence hangisi daha iyi?** Yoksa başka bir şey mi aklında? 😊

Not: Canın ne istiyorsa onu yemek önemli - ama akıllıca porsiyonlarla! 💪`
              : `Hey, wait a minute! 🤗 Craving meatballs is completely natural and normal. Your body is telling you it needs protein.

**I understand you** - sometimes we really crave certain foods, especially when our body needs those nutrients.

Here are some **delicious and healthy** options:

🍖 **Homemade Meatballs (4 pieces)**
• Use lean ground beef
• Bake them (50% less fat!)
• ~280 calories + 25g protein
• Serve with yogurt and salad

🍗 **Alternative: Grilled Meatball-Style**
• Marinate chicken breast with spices
• Shape like meatballs and grill
• ~200 calories, same taste!

**Which sounds better to you?** Or do you have something else in mind? 😊

Note: It's important to eat what you crave - but with smart portions! 💪`;
          } else {
            return isTurkish
              ? `Köfte canını çekmiş, harika! 🍖 Beden protein istiyor demek.

**Akıllıca köfte seçenekleri:**

1️⃣ **Ev Yapımı Fırın Köfte**
   • 4 adet: ~280 kcal
   • Yağsız kıyma + fırın = sağlıklı!
   • Yanında salata muhteşem olur

2️⃣ **Izgara Tavuk Köfte**
   • 4 adet: ~200 kcal  
   • Aynı lezzet, daha az kalori
   • Baharatlı marine et önceden

**Porsiyonu nasıl planlayalım?** Bugün ne kadar kalori hedefliyorsun? 😊`
              : `Craving meatballs, great! 🍖 Your body wants protein.

**Smart meatball options:**

1️⃣ **Homemade Baked Meatballs**
   • 4 pieces: ~280 kcal
   • Lean meat + oven = healthy!
   • Great with salad

2️⃣ **Grilled Chicken Meatballs**
   • 4 pieces: ~200 kcal
   • Same taste, fewer calories
   • Marinate with spices first

**How should we plan the portion?** What's your calorie goal today? 😊`;
          }
        }
        break;
      }

      case 'meal_suggestion': {
        return isTurkish
          ? `Öğün önerisi mi istiyorsun? Harika! 🍽️

Ama önce **seni daha iyi tanımalıyım**:

1️⃣ **Hangi öğün için?**
   • Kahvaltı ☀️  
   • Öğle 🌤️
   • Akşam 🌙

2️⃣ **Bugün toplam ne kadar kalori hedefliyorsun?**

3️⃣ **Özel bir isteğin var mı?**
   (Örnek: "Protein ağırlıklı", "Vejetaryen", "Hafif")

4️⃣ **Sevmediğin veya yiyemediğin bir şey var mı?**

Bunları öğrenince tam senlik bir menü hazırlayabilirim! 😊`
          : `Want meal suggestions? Great! 🍽️

But first, **I need to know you better**:

1️⃣ **Which meal?**
   • Breakfast ☀️
   • Lunch 🌤️
   • Dinner 🌙

2️⃣ **What's your daily calorie goal?**

3️⃣ **Any special requests?**
   (e.g., "High protein", "Vegetarian", "Light")

4️⃣ **Any foods you dislike or can't eat?**

Once I know these, I can create the perfect menu for you! 😊`;
      }

      case 'calorie_tracking': {
        const calories = context.calories as number;
        return isTurkish
          ? `Bugün ${calories} kalori almışsın! 📊

**Hedefine göre analiz yapalım:**
• Hedefin ne kadar kalori?
• Kilo verme mi, koruma mı, alma mı?

Bana hedefini söyle, birlikte günün nasıl geçtiğini değerlendirelim! 🎯

Örneğin:
"Hedefim 1800 kalori" veya
"5 kilo vermek istiyorum"`
          : `You've consumed ${calories} calories today! 📊

**Let's analyze based on your goal:**
• What's your calorie goal?
• Losing, maintaining, or gaining weight?

Tell me your goal, and let's evaluate your day together! 🎯

For example:
"My goal is 1800 calories" or
"I want to lose 5 kg"`;
      }

      case 'weight_management': {
        return isTurkish
          ? `Kilo yönetimi hedefin var, harika! ⚖️

Sana en iyi planı yapabilmem için **seni tanımam lazım**:

1️⃣ **Şu anki kilon ve boyun nedir?**

2️⃣ **Hedef kilon ne?**

3️⃣ **Ne kadar sürede ulaşmak istiyorsun?**

4️⃣ **Daha önce diyet denedin mi?**
   • Evet ise, neler işe yaradı?
   • Nelerde zorlandın?

5️⃣ **Günlük yaşamın nasıl?**
   • Aktif misin yoksa masa başı mı?
   • Düzenli egzersiz yapıyor musun?

Bu bilgilerle **TAM SENLİK** bir plan hazırlayacağım! 💪`
          : `You have a weight management goal, great! ⚖️

To create the best plan for you, **I need to know you**:

1️⃣ **What's your current weight and height?**

2️⃣ **What's your target weight?**

3️⃣ **How long do you want to reach it?**

4️⃣ **Have you tried dieting before?**
   • If yes, what worked?
   • What was challenging?

5️⃣ **What's your daily life like?**
   • Active or desk job?
   • Do you exercise regularly?

With this info, I'll create a **PERFECT PLAN FOR YOU**! 💪`;
      }

      case 'emotional_support': {
        return isTurkish
          ? `Hey... Dur bir dakika. 🤗 

**Seni dinliyorum.** Senin şu an desteğe ihtiyacın olduğunu hissediyorum.

Söyle bana:
• Şu an tam olarak ne hissediyorsun?
• Neden zorlanıyorsun veya sıkkınsın?
• Sana nasıl destek olabilirim?

**Yalnız değilsin!** Ben buradayım ve seninle birlikte çözüm bulacağız. Bazen konuşmak bile yeterli oluyor - beni dinleyen biri olduğunu bilmek...

Ne olursa olsun, **seni yargılamadan dinliyorum.** 💙`
          : `Hey... Wait a minute. 🤗

**I'm listening.** I can sense you need support right now.

Tell me:
• How exactly are you feeling right now?
• Why are you struggling or feeling down?
• How can I support you?

**You're not alone!** I'm here and we'll find a solution together. Sometimes just talking helps - knowing someone is listening...

Whatever it is, **I'm listening without judgment.** 💙`;
      }

      case 'exercise': {
        return isTurkish
          ? `Egzersiz planı mı? Harika! 💪

**Önce seviyeni belirleyelim:**

1️⃣ **Şu an düzenli spor yapıyor musun?**
   • Evet (haftada kaç gün?)
   • Hayır (yeni başlayacağım)

2️⃣ **Ne tür egzersizleri seviyorsun?**
   • Kardiyo (koşu, yürüyüş, bisiklet)
   • Ağırlık antrenmanı
   • Yoga/Pilates
   • Grup sporları

3️⃣ **Günde ne kadar zaman ayırabilirsin?**

4️⃣ **Hedefin ne?**
   • Kilo vermek
   • Kas yapmak
   • Kondisyon artırmak
   • Sağlıklı kalmak

Cevaplarına göre **TAM SENLİK** bir program hazırlayacağım! 🏃‍♀️`
          : `Exercise plan? Great! 💪

**Let's determine your level first:**

1️⃣ **Do you currently exercise regularly?**
   • Yes (how many days per week?)
   • No (just starting)

2️⃣ **What type of exercise do you enjoy?**
   • Cardio (running, walking, cycling)
   • Weight training
   • Yoga/Pilates
   • Group sports

3️⃣ **How much time can you dedicate daily?**

4️⃣ **What's your goal?**
   • Lose weight
   • Build muscle
   • Improve fitness
   • Stay healthy

Based on your answers, I'll create a **PERFECT PROGRAM FOR YOU**! 🏃‍♀️`;
      }

      default: {
        return isTurkish
          ? `Seni anlıyorum! 😊

Benimle **rahatça konuşabilirsin**. İşte sana yardımcı olabileceğim konular:

💬 **Ne isterseniz doğal bir şekilde sorun:**
• "Bugün 1500 kalori aldım, ne yapmalıyım?"
• "Canım köfte çekti ama kilo vermek istiyorum"
• "5 kilo vermek için ne yapmam lazım?"
• "Egzersiz yapmaya başlamak istiyorum"
• "Motivasyona ihtiyacım var"

**Seni dinliyorum!** Ne istersen söyle, seninle birlikte çözüm bulacağız. 🌟`
          : `I understand you! 😊

Feel free to **talk to me naturally**. Here's how I can help:

💬 **Ask me anything in a natural way:**
• "I ate 1500 calories today, what should I do?"
• "I'm craving meatballs but want to lose weight"
• "What do I need to do to lose 5 kg?"
• "I want to start exercising"
• "I need motivation"

**I'm listening!** Tell me anything, and we'll find a solution together. 🌟`;
      }
    }

    return isTurkish
      ? 'Seni dinliyorum! Lütfen biraz daha detay verir misin? 😊'
      : 'I\'m listening! Could you give me a bit more detail? 😊';
  };

  // Call server-side API (NO CORS issues!)
  const callRealGLMAPI = async (userMessage: string): Promise<string | null> => {
    try {
      console.log('[AI Coach V3] 🚀 Calling server-side /api/ai-coach endpoint...');
      
      // Call our server-side API route (NO CORS!)
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            language,
            conversationHistory: messages.slice(-3).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          }
        })
      });

      console.log('[AI Coach V3] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[AI Coach V3] ✅ Success! Received response from server');
        console.log('[AI Coach V3] 📦 Full Response Data:', JSON.stringify(data, null, 2));
        console.log('[AI Coach V3] 📝 Extracted data.response:', data.response);
        
        if (!data.response) {
          console.error('[AI Coach V3] ⚠️ data.response is empty or null!');
          return null;
        }
        
        console.log('[AI Coach V3] ✅ Server-side API call successful!');
        return data.response;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AI Coach V3] ❌ Server returned error:', response.status, errorData);
        return null;
      }
    } catch (error) {
      console.error('[AI Coach V3] ❌ Failed to call /api/ai-coach:', error);
      return null;
    }
  };

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Analyze user message
      const analysis = analyzeMessage(input);
      
      // Update user context
      setUserContext(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        mood: analysis.sentiment,
        ...analysis.context
      }));

      // Generate response
      const responseText = await generateContextualResponse(input, analysis);

      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setUserContext(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage]
      }));
    } catch (error) {
      console.error('[AI Coach V3] Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: language === 'tr'
          ? 'Üzgünüm, bir hata oluştu. Lütfen tekrar dener misin? 😔'
          : 'Sorry, an error occurred. Could you please try again? 😔',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="font-semibold text-lg">
            {language === 'tr' ? 'AI Koçun' : 'AI Coach'}
          </h2>
          <p className="text-xs text-gray-500">
            {language === 'tr' ? 'Her zaman buradayım 🤗' : 'Always here for you 🤗'}
          </p>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 p-3 rounded-2xl flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">
                {language === 'tr' ? 'Yazıyor...' : 'Typing...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={language === 'tr' ? 'Mesajını yaz...' : 'Type your message...'}
            className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
