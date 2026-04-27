/**
 * 🌍 Merkezi Yemek Çeviri Sistemi
 * 
 * Türkçe yemek isimlerini İngilizce karşılıklarına çevirir.
 * Her kelime için birden fazla alternatif arama terimi sağlar.
 */

export interface TranslationResult {
  original: string;
  primaryTranslation: string;
  alternativeTerms: string[];
  allTerms: string[]; // primary + alternatives
}

/**
 * Türkçe → İngilizce Yemek Çeviri Sözlüğü
 * Her kelime için birincil çeviri + alternatif arama terimleri
 */
const FOOD_TRANSLATIONS: Record<string, { primary: string; alternatives: string[] }> = {
  // Et ve Tavuk
  'tavuk': { primary: 'chicken', alternatives: ['poultry', 'chicken breast', 'grilled chicken', 'roasted chicken'] },
  'tavuk göğsü': { primary: 'chicken breast', alternatives: ['chicken', 'grilled chicken', 'chicken fillet'] },
  'tavuk but': { primary: 'chicken thigh', alternatives: ['chicken leg', 'chicken drumstick'] },
  'köfte': { primary: 'meatball', alternatives: ['ground beef', 'minced meat', 'kofta', 'beef meatball'] },
  'et': { primary: 'meat', alternatives: ['beef', 'red meat', 'ground beef'] },
  'dana eti': { primary: 'beef', alternatives: ['veal', 'red meat', 'beef steak'] },
  'kuzu eti': { primary: 'lamb', alternatives: ['lamb meat', 'mutton'] },
  'kıyma': { primary: 'ground beef', alternatives: ['minced meat', 'ground meat', 'mince'] },
  'biftek': { primary: 'steak', alternatives: ['beef steak', 'sirloin', 'ribeye'] },
  'sucuk': { primary: 'sausage', alternatives: ['turkish sausage', 'spicy sausage', 'dried sausage'] },
  'sosis': { primary: 'hot dog', alternatives: ['sausage', 'frankfurter', 'wiener'] },
  'jambon': { primary: 'ham', alternatives: ['deli ham', 'cooked ham'] },
  'kavurma': { primary: 'roasted meat', alternatives: ['fried meat', 'braised meat'] },
  'şiş kebap': { primary: 'kebab', alternatives: ['shish kebab', 'grilled meat', 'meat skewer'] },
  'döner': { primary: 'doner kebab', alternatives: ['gyro', 'shawarma', 'rotisserie meat'] },
  'hindi': { primary: 'turkey', alternatives: ['turkey meat', 'turkey breast'] },

  // Balık ve Deniz Ürünleri
  'balık': { primary: 'fish', alternatives: ['seafood', 'fish fillet', 'grilled fish', 'baked fish'] },
  'hamsi': { primary: 'anchovies', alternatives: ['anchovy', 'small fish'] },
  'somon': { primary: 'salmon', alternatives: ['salmon fillet', 'grilled salmon'] },
  'levrek': { primary: 'sea bass', alternatives: ['bass', 'white fish'] },
  'çipura': { primary: 'sea bream', alternatives: ['bream', 'white fish'] },
  'ton balığı': { primary: 'tuna', alternatives: ['tuna fish', 'canned tuna'] },
  'karides': { primary: 'shrimp', alternatives: ['prawns', 'seafood'] },
  'midye': { primary: 'mussels', alternatives: ['shellfish', 'seafood'] },
  'ahtapot': { primary: 'octopus', alternatives: ['seafood'] },
  'kalamar': { primary: 'squid', alternatives: ['calamari', 'seafood'] },

  // Süt Ürünleri
  'süt': { primary: 'milk', alternatives: ['whole milk', 'dairy'] },
  'yoğurt': { primary: 'yogurt', alternatives: ['yoghurt', 'plain yogurt', 'greek yogurt'] },
  'ayran': { primary: 'yogurt drink', alternatives: ['buttermilk', 'yogurt beverage'] },
  'peynir': { primary: 'cheese', alternatives: ['white cheese', 'feta', 'dairy'] },
  'beyaz peynir': { primary: 'white cheese', alternatives: ['feta', 'feta cheese', 'fresh cheese'] },
  'kaşar': { primary: 'cheddar', alternatives: ['yellow cheese', 'kashkaval', 'hard cheese'] },
  'tereyağı': { primary: 'butter', alternatives: ['dairy butter', 'unsalted butter'] },
  'krema': { primary: 'cream', alternatives: ['heavy cream', 'whipping cream'] },
  'kaymak': { primary: 'clotted cream', alternatives: ['cream', 'dairy cream'] },

  // Tahıllar ve Ekmek
  'ekmek': { primary: 'bread', alternatives: ['white bread', 'loaf', 'baked bread'] },
  'pilav': { primary: 'rice', alternatives: ['cooked rice', 'white rice', 'pilaf'] },
  'pirinç': { primary: 'rice', alternatives: ['white rice', 'uncooked rice'] },
  'bulgur': { primary: 'bulgur', alternatives: ['cracked wheat', 'wheat'] },
  'makarna': { primary: 'pasta', alternatives: ['noodles', 'spaghetti', 'macaroni'] },
  'erişte': { primary: 'noodles', alternatives: ['egg noodles', 'pasta'] },
  'un': { primary: 'flour', alternatives: ['wheat flour', 'all purpose flour'] },
  'yulaf': { primary: 'oats', alternatives: ['oatmeal', 'rolled oats'] },

  // Sebzeler
  'domates': { primary: 'tomato', alternatives: ['tomatoes', 'fresh tomato', 'red tomato'] },
  'salatalık': { primary: 'cucumber', alternatives: ['cucumbers', 'fresh cucumber'] },
  'biber': { primary: 'pepper', alternatives: ['bell pepper', 'sweet pepper'] },
  'sivri biber': { primary: 'green pepper', alternatives: ['hot pepper', 'chili pepper'] },
  'patlıcan': { primary: 'eggplant', alternatives: ['aubergine', 'purple vegetable'] },
  'kabak': { primary: 'zucchini', alternatives: ['courgette', 'squash'] },
  'havuç': { primary: 'carrot', alternatives: ['carrots', 'orange vegetable'] },
  'patates': { primary: 'potato', alternatives: ['potatoes', 'baked potato', 'mashed potato'] },
  'soğan': { primary: 'onion', alternatives: ['onions', 'yellow onion'] },
  'sarımsak': { primary: 'garlic', alternatives: ['garlic clove'] },
  'marul': { primary: 'lettuce', alternatives: ['salad greens', 'green lettuce'] },
  'ıspanak': { primary: 'spinach', alternatives: ['fresh spinach', 'leafy greens'] },
  'karnabahar': { primary: 'cauliflower', alternatives: ['white vegetable'] },
  'brokoli': { primary: 'broccoli', alternatives: ['green vegetable'] },
  'fasulye': { primary: 'beans', alternatives: ['green beans', 'white beans'] },
  'nohut': { primary: 'chickpeas', alternatives: ['garbanzo beans', 'legumes'] },
  'mercimek': { primary: 'lentils', alternatives: ['red lentils', 'green lentils'] },
  'bezelye': { primary: 'peas', alternatives: ['green peas', 'sweet peas'] },
  'mısır': { primary: 'corn', alternatives: ['sweet corn', 'maize'] },
  'mantar': { primary: 'mushroom', alternatives: ['mushrooms', 'button mushroom'] },
  'roka': { primary: 'arugula', alternatives: ['rocket', 'salad greens'] },
  'maydanoz': { primary: 'parsley', alternatives: ['fresh parsley', 'herbs'] },
  'dereotu': { primary: 'dill', alternatives: ['fresh dill', 'herbs'] },

  // Meyveler
  'elma': { primary: 'apple', alternatives: ['apples', 'red apple', 'green apple'] },
  'muz': { primary: 'banana', alternatives: ['bananas', 'fresh banana'] },
  'portakal': { primary: 'orange', alternatives: ['oranges', 'fresh orange'] },
  'mandalina': { primary: 'mandarin', alternatives: ['tangerine', 'clementine'] },
  'limon': { primary: 'lemon', alternatives: ['lemons', 'fresh lemon'] },
  'üzüm': { primary: 'grapes', alternatives: ['grape', 'green grapes', 'red grapes'] },
  'çilek': { primary: 'strawberry', alternatives: ['strawberries', 'fresh strawberry'] },
  'kiraz': { primary: 'cherry', alternatives: ['cherries', 'sweet cherry'] },
  'vişne': { primary: 'sour cherry', alternatives: ['tart cherry', 'cherry'] },
  'şeftali': { primary: 'peach', alternatives: ['peaches', 'fresh peach'] },
  'kayısı': { primary: 'apricot', alternatives: ['apricots', 'dried apricot'] },
  'erik': { primary: 'plum', alternatives: ['plums', 'fresh plum'] },
  'armut': { primary: 'pear', alternatives: ['pears', 'fresh pear'] },
  'karpuz': { primary: 'watermelon', alternatives: ['melon', 'fresh watermelon'] },
  'kavun': { primary: 'melon', alternatives: ['cantaloupe', 'honeydew'] },
  'kivi': { primary: 'kiwi', alternatives: ['kiwi fruit', 'fresh kiwi'] },
  'ananas': { primary: 'pineapple', alternatives: ['fresh pineapple', 'tropical fruit'] },
  'nar': { primary: 'pomegranate', alternatives: ['pomegranate seeds'] },
  'incir': { primary: 'fig', alternatives: ['figs', 'fresh fig', 'dried fig'] },

  // Yumurta
  'yumurta': { primary: 'egg', alternatives: ['eggs', 'chicken egg', 'whole egg'] },
  'haşlanmış yumurta': { primary: 'boiled egg', alternatives: ['hard boiled egg', 'egg'] },
  'omlet': { primary: 'omelet', alternatives: ['omelette', 'scrambled eggs'] },

  // Baklagiller ve Kuruyemişler
  'badem': { primary: 'almond', alternatives: ['almonds', 'nut'] },
  'fındık': { primary: 'hazelnut', alternatives: ['hazelnuts', 'nut'] },
  'ceviz': { primary: 'walnut', alternatives: ['walnuts', 'nut'] },
  'fıstık': { primary: 'peanut', alternatives: ['peanuts', 'groundnut'] },
  'antep fıstığı': { primary: 'pistachio', alternatives: ['pistachios', 'nut'] },
  'kaju': { primary: 'cashew', alternatives: ['cashews', 'cashew nut'] },

  // İçecekler
  'su': { primary: 'water', alternatives: ['drinking water', 'mineral water'] },
  'çay': { primary: 'tea', alternatives: ['black tea', 'hot tea'] },
  'kahve': { primary: 'coffee', alternatives: ['black coffee', 'hot coffee'] },
  'türk kahvesi': { primary: 'turkish coffee', alternatives: ['coffee', 'espresso'] },
  'meyve suyu': { primary: 'fruit juice', alternatives: ['juice', 'fresh juice'] },
  'portakal suyu': { primary: 'orange juice', alternatives: ['juice', 'fresh orange juice'] },
  'gazoz': { primary: 'soda', alternatives: ['soft drink', 'carbonated drink'] },
  'kola': { primary: 'cola', alternatives: ['coke', 'soft drink'] },

  // Tatlılar ve Şekerli Yiyecekler
  'baklava': { primary: 'baklava', alternatives: ['turkish dessert', 'pastry', 'sweet'] },
  'künefe': { primary: 'kunefe', alternatives: ['turkish dessert', 'cheese pastry'] },
  'lokum': { primary: 'turkish delight', alternatives: ['candy', 'sweet'] },
  'helva': { primary: 'halva', alternatives: ['turkish dessert', 'sweet'] },
  'şeker': { primary: 'sugar', alternatives: ['white sugar', 'sweetener'] },
  'bal': { primary: 'honey', alternatives: ['natural honey', 'bee honey'] },
  'reçel': { primary: 'jam', alternatives: ['fruit jam', 'preserve'] },
  'çikolata': { primary: 'chocolate', alternatives: ['dark chocolate', 'milk chocolate'] },
  'dondurma': { primary: 'ice cream', alternatives: ['frozen dessert', 'gelato'] },
  'kek': { primary: 'cake', alternatives: ['sponge cake', 'dessert'] },
  'kurabiye': { primary: 'cookie', alternatives: ['cookies', 'biscuit'] },

  // Yağlar ve Soslar
  'zeytinyağı': { primary: 'olive oil', alternatives: ['extra virgin olive oil', 'oil'] },
  'ayçiçek yağı': { primary: 'sunflower oil', alternatives: ['vegetable oil', 'cooking oil'] },
  'salça': { primary: 'tomato paste', alternatives: ['paste', 'sauce'] },
  'mayonez': { primary: 'mayonnaise', alternatives: ['mayo', 'dressing'] },
  'ketçap': { primary: 'ketchup', alternatives: ['tomato ketchup', 'sauce'] },
  'hardal': { primary: 'mustard', alternatives: ['mustard sauce', 'condiment'] },
  'sirke': { primary: 'vinegar', alternatives: ['white vinegar', 'apple cider vinegar'] },

  // Baharatlar
  'tuz': { primary: 'salt', alternatives: ['table salt', 'sea salt'] },
  'karabiber': { primary: 'black pepper', alternatives: ['pepper', 'ground pepper'] },
  'kimyon': { primary: 'cumin', alternatives: ['ground cumin', 'spice'] },
  'kırmızıbiber': { primary: 'red pepper', alternatives: ['paprika', 'chili powder'] },
  'pul biber': { primary: 'red pepper flakes', alternatives: ['chili flakes', 'crushed pepper'] },
  'nane': { primary: 'mint', alternatives: ['dried mint', 'herb'] },
  'kekik': { primary: 'thyme', alternatives: ['dried thyme', 'herb'] },
  'fesleğen': { primary: 'basil', alternatives: ['fresh basil', 'herb'] },
};

/**
 * Türkçe kelimeyi İngilizceye çevirir
 * Birincil çeviri + alternatif arama terimlerini döndürür
 */
export function translateFood(turkishWord: string): TranslationResult | null {
  const normalized = turkishWord.toLowerCase().trim();
  
  // Direkt eşleşme var mı?
  if (FOOD_TRANSLATIONS[normalized]) {
    const translation = FOOD_TRANSLATIONS[normalized];
    return {
      original: turkishWord,
      primaryTranslation: translation.primary,
      alternativeTerms: translation.alternatives,
      allTerms: [translation.primary, ...translation.alternatives],
    };
  }

  // Kısmi eşleşme ara (örn: "tavuk göğüs" → "tavuk göğsü")
  for (const [key, value] of Object.entries(FOOD_TRANSLATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        original: turkishWord,
        primaryTranslation: value.primary,
        alternativeTerms: value.alternatives,
        allTerms: [value.primary, ...value.alternatives],
      };
    }
  }

  return null;
}

/**
 * Birden fazla kelime içeren sorgu için akıllı çeviri
 * "ızgara tavuk" → ["grilled chicken", "chicken", "grilled"]
 */
export function translateFoodQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  const words = normalized.split(/\s+/);
  const translations = new Set<string>();

  // Tam sorguyu çevir
  const fullTranslation = translateFood(normalized);
  if (fullTranslation) {
    fullTranslation.allTerms.forEach(term => translations.add(term));
    return Array.from(translations);
  }

  // Her kelimeyi ayrı ayrı çevir
  words.forEach(word => {
    const translation = translateFood(word);
    if (translation) {
      translation.allTerms.forEach(term => translations.add(term));
    } else {
      // Türkçe olmayan kelimeler olduğu gibi eklensin (örn: "pizza")
      translations.add(word);
    }
  });

  // Eğer hiç çeviri bulunamadıysa orijinal sorguyu döndür
  if (translations.size === 0) {
    translations.add(normalized);
  }

  return Array.from(translations);
}

/**
 * Çeviri veritabanında kaç kelime var?
 */
export function getTranslationCount(): number {
  return Object.keys(FOOD_TRANSLATIONS).length;
}

/**
 * Tüm çevirileri listele (debug için)
 */
export function getAllTranslations(): typeof FOOD_TRANSLATIONS {
  return FOOD_TRANSLATIONS;
}
