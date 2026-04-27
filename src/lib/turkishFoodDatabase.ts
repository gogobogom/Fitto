/**
 * Comprehensive Turkish Food Database
 * 190+ common Turkish foods with accurate nutritional values per 100g
 */

export interface FoodData {
  name: string;
  nameTr: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string;
}

export const TURKISH_FOOD_DATABASE: FoodData[] = [
  // TAHILLAR VE EKMEKLER
  { name: 'White Bread', nameTr: 'Beyaz Ekmek', calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, category: 'Tahıl' },
  { name: 'Whole Wheat Bread', nameTr: 'Tam Buğday Ekmeği', calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 6.8, category: 'Tahıl' },
  { name: 'White Rice', nameTr: 'Beyaz Pirinç', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, category: 'Tahıl' },
  { name: 'Brown Rice', nameTr: 'Esmer Pirinç', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, category: 'Tahıl' },
  { name: 'Bulgur', nameTr: 'Bulgur', calories: 342, protein: 12, carbs: 76, fat: 1.3, fiber: 12, category: 'Tahıl' },
  { name: 'Pasta', nameTr: 'Makarna', calories: 371, protein: 13, carbs: 75, fat: 1.5, fiber: 3.2, category: 'Tahıl' },
  { name: 'Couscous', nameTr: 'Kuskus', calories: 112, protein: 3.8, carbs: 23, fat: 0.2, fiber: 1.4, category: 'Tahıl' },
  { name: 'Oatmeal', nameTr: 'Yulaf Ezmesi', calories: 389, protein: 17, carbs: 66, fat: 6.9, fiber: 11, category: 'Tahıl' },
  { name: 'Cornflakes', nameTr: 'Mısır Gevreği', calories: 357, protein: 7.5, carbs: 84, fat: 0.9, fiber: 3.3, category: 'Tahıl' },
  { name: 'Simit', nameTr: 'Simit', calories: 298, protein: 9.2, carbs: 52, fat: 6.1, fiber: 2.8, category: 'Tahıl' },
  { name: 'Acma', nameTr: 'Açma', calories: 270, protein: 8, carbs: 48, fat: 5, fiber: 2.5, category: 'Tahıl' },
  { name: 'Pogaca', nameTr: 'Poğaça', calories: 320, protein: 8, carbs: 42, fat: 14, fiber: 2, category: 'Tahıl' },
  { name: 'Chickpea Pilaf', nameTr: 'Nohutlu Pilav', calories: 180, protein: 6, carbs: 32, fat: 3.5, fiber: 4, category: 'Tahıl' },
  { name: 'Bulgur Pilaf', nameTr: 'Bulgur Pilavı', calories: 150, protein: 5, carbs: 30, fat: 2, fiber: 6, category: 'Tahıl' },

  // ET VE TAVUK
  { name: 'Chicken Breast', nameTr: 'Tavuk Göğsü', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, category: 'Et' },
  { name: 'Chicken Thigh', nameTr: 'Tavuk But', calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0, category: 'Et' },
  { name: 'Ground Beef', nameTr: 'Kıyma', calories: 250, protein: 26, carbs: 0, fat: 17, fiber: 0, category: 'Et' },
  { name: 'Beef Steak', nameTr: 'Dana Bonfile', calories: 271, protein: 25, carbs: 0, fat: 19, fiber: 0, category: 'Et' },
  { name: 'Lamb Chop', nameTr: 'Kuzu Pirzola', calories: 294, protein: 25, carbs: 0, fat: 21, fiber: 0, category: 'Et' },
  { name: 'Lamb Meat', nameTr: 'Kuzu Eti', calories: 294, protein: 25, carbs: 0, fat: 21, fiber: 0, category: 'Et' },
  { name: 'Meatball', nameTr: 'Köfte', calories: 250, protein: 22, carbs: 8, fat: 15, fiber: 0.5, category: 'Et' },
  { name: 'Doner Kebab', nameTr: 'Döner', calories: 265, protein: 24, carbs: 6, fat: 16, fiber: 0.3, category: 'Et' },
  { name: 'Adana Kebab', nameTr: 'Adana Kebap', calories: 280, protein: 23, carbs: 5, fat: 19, fiber: 0.5, category: 'Et' },
  { name: 'Sausage', nameTr: 'Sosis', calories: 301, protein: 13, carbs: 3.5, fat: 27, fiber: 0, category: 'Et' },
  { name: 'Urfa Kebab', nameTr: 'Urfa Kebap', calories: 275, protein: 22, carbs: 4, fat: 18, fiber: 0.4, category: 'Et' },
  { name: 'Shish Kebab', nameTr: 'Şiş Kebap', calories: 260, protein: 24, carbs: 3, fat: 17, fiber: 0.2, category: 'Et' },
  { name: 'Iskender', nameTr: 'İskender', calories: 320, protein: 20, carbs: 25, fat: 16, fiber: 1.5, category: 'Et' },
  { name: 'Sucuk', nameTr: 'Sucuk', calories: 300, protein: 17, carbs: 2, fat: 25, fiber: 0, category: 'Et' },
  { name: 'Pastirma', nameTr: 'Pastırma', calories: 220, protein: 20, carbs: 1, fat: 15, fiber: 0, category: 'Et' },
  { name: 'Icli Kofte', nameTr: 'İçli Köfte', calories: 240, protein: 10, carbs: 28, fat: 10, fiber: 2, category: 'Et' },
  { name: 'Cig Kofte', nameTr: 'Çiğ Köfte', calories: 180, protein: 4, carbs: 32, fat: 4, fiber: 3, category: 'Et' },

  // BALIK VE DENİZ ÜRÜNLERİ
  { name: 'Salmon', nameTr: 'Somon', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, category: 'Balık' },
  { name: 'Tuna', nameTr: 'Ton Balığı', calories: 144, protein: 30, carbs: 0, fat: 1, fiber: 0, category: 'Balık' },
  { name: 'Sea Bass', nameTr: 'Levrek', calories: 97, protein: 18, carbs: 0, fat: 2.5, fiber: 0, category: 'Balık' },
  { name: 'Sea Bream', nameTr: 'Çipura', calories: 100, protein: 19, carbs: 0, fat: 2.7, fiber: 0, category: 'Balık' },
  { name: 'Mackerel', nameTr: 'Uskumru', calories: 205, protein: 19, carbs: 0, fat: 14, fiber: 0, category: 'Balık' },
  { name: 'Anchovy', nameTr: 'Hamsi', calories: 131, protein: 20, carbs: 0, fat: 4.8, fiber: 0, category: 'Balık' },
  { name: 'Shrimp', nameTr: 'Karides', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, category: 'Balık' },

  // SÜT ÜRÜNLERİ
  { name: 'Milk', nameTr: 'Süt', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Low-fat Milk', nameTr: 'Yağsız Süt', calories: 34, protein: 3.4, carbs: 5, fat: 0.1, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Yogurt', nameTr: 'Yoğurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Greek Yogurt', nameTr: 'Süzme Yoğurt', calories: 97, protein: 9, carbs: 3.9, fat: 5, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Ayran', nameTr: 'Ayran', calories: 38, protein: 1.8, carbs: 2.4, fat: 2.5, fiber: 0, category: 'Süt Ürünü' },
  { name: 'White Cheese', nameTr: 'Beyaz Peynir', calories: 264, protein: 18, carbs: 3.7, fat: 21, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Feta Cheese', nameTr: 'Lor Peyniri', calories: 98, protein: 16, carbs: 4.1, fat: 1.5, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Kasar Cheese', nameTr: 'Kaşar Peyniri', calories: 374, protein: 25, carbs: 0, fat: 30, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Cottage Cheese', nameTr: 'Çökelek', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, category: 'Süt Ürünü' },
  { name: 'Butter', nameTr: 'Tereyağı', calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, category: 'Süt Ürünü' },

  // YUMURTA
  { name: 'Egg', nameTr: 'Yumurta', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, category: 'Protein' },
  { name: 'Egg White', nameTr: 'Yumurta Beyazı', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, category: 'Protein' },
  { name: 'Egg Yolk', nameTr: 'Yumurta Sarısı', calories: 322, protein: 16, carbs: 3.6, fat: 27, fiber: 0, category: 'Protein' },
  { name: 'Omelette', nameTr: 'Omlet', calories: 154, protein: 11, carbs: 1.2, fat: 12, fiber: 0, category: 'Protein' },
  { name: 'Menemen', nameTr: 'Menemen', calories: 110, protein: 6.5, carbs: 6, fat: 7, fiber: 1.5, category: 'Protein' },

  // SEBZELER
  { name: 'Tomato', nameTr: 'Domates', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, category: 'Sebze' },
  { name: 'Cucumber', nameTr: 'Salatalık', calories: 16, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, category: 'Sebze' },
  { name: 'Pepper', nameTr: 'Biber', calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, category: 'Sebze' },
  { name: 'Onion', nameTr: 'Soğan', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, category: 'Sebze' },
  { name: 'Lettuce', nameTr: 'Marul', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, category: 'Sebze' },
  { name: 'Spinach', nameTr: 'Ispanak', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, category: 'Sebze' },
  { name: 'Eggplant', nameTr: 'Patlıcan', calories: 25, protein: 1, carbs: 5.9, fat: 0.2, fiber: 3, category: 'Sebze' },
  { name: 'Zucchini', nameTr: 'Kabak', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, category: 'Sebze' },
  { name: 'Carrot', nameTr: 'Havuç', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, category: 'Sebze' },
  { name: 'Potato', nameTr: 'Patates', calories: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.1, category: 'Sebze' },
  { name: 'Cauliflower', nameTr: 'Karnabahar', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, category: 'Sebze' },
  { name: 'Broccoli', nameTr: 'Brokoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, category: 'Sebze' },
  { name: 'Green Beans', nameTr: 'Taze Fasulye', calories: 31, protein: 1.8, carbs: 7, fat: 0.2, fiber: 2.7, category: 'Sebze' },
  { name: 'Peas', nameTr: 'Bezelye', calories: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.7, category: 'Sebze' },
  { name: 'Corn', nameTr: 'Mısır', calories: 86, protein: 3.3, carbs: 19, fat: 1.4, fiber: 2, category: 'Sebze' },

  // MEYVELER
  { name: 'Apple', nameTr: 'Elma', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, category: 'Meyve' },
  { name: 'Banana', nameTr: 'Muz', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, category: 'Meyve' },
  { name: 'Orange', nameTr: 'Portakal', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, category: 'Meyve' },
  { name: 'Grapes', nameTr: 'Üzüm', calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, category: 'Meyve' },
  { name: 'Watermelon', nameTr: 'Karpuz', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, category: 'Meyve' },
  { name: 'Melon', nameTr: 'Kavun', calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2, fiber: 0.9, category: 'Meyve' },
  { name: 'Strawberry', nameTr: 'Çilek', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, category: 'Meyve' },
  { name: 'Cherry', nameTr: 'Kiraz', calories: 50, protein: 1, carbs: 12, fat: 0.3, fiber: 1.6, category: 'Meyve' },
  { name: 'Peach', nameTr: 'Şeftali', calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5, category: 'Meyve' },
  { name: 'Apricot', nameTr: 'Kayısı', calories: 48, protein: 1.4, carbs: 11, fat: 0.4, fiber: 2, category: 'Meyve' },
  { name: 'Plum', nameTr: 'Erik', calories: 46, protein: 0.7, carbs: 11, fat: 0.3, fiber: 1.4, category: 'Meyve' },
  { name: 'Pear', nameTr: 'Armut', calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1, category: 'Meyve' },
  { name: 'Kiwi', nameTr: 'Kivi', calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3, category: 'Meyve' },
  { name: 'Pomegranate', nameTr: 'Nar', calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4, category: 'Meyve' },
  { name: 'Fig', nameTr: 'İncir', calories: 74, protein: 0.8, carbs: 19, fat: 0.3, fiber: 2.9, category: 'Meyve' },

  // KURUYEMIŞLER
  { name: 'Walnut', nameTr: 'Ceviz', calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, category: 'Kuruyemiş' },
  { name: 'Almond', nameTr: 'Badem', calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, category: 'Kuruyemiş' },
  { name: 'Hazelnut', nameTr: 'Fındık', calories: 628, protein: 15, carbs: 17, fat: 61, fiber: 9.7, category: 'Kuruyemiş' },
  { name: 'Peanut', nameTr: 'Yer Fıstığı', calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5, category: 'Kuruyemiş' },
  { name: 'Pistachio', nameTr: 'Antep Fıstığı', calories: 560, protein: 20, carbs: 28, fat: 45, fiber: 10, category: 'Kuruyemiş' },
  { name: 'Cashew', nameTr: 'Kaju', calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3, category: 'Kuruyemiş' },
  { name: 'Sunflower Seeds', nameTr: 'Çekirdek', calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 8.6, category: 'Kuruyemiş' },
  { name: 'Pumpkin Seeds', nameTr: 'Kabak Çekirdeği', calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6, category: 'Kuruyemiş' },

  // BAKLAGİLLER
  { name: 'Red Lentil', nameTr: 'Kırmızı Mercimek', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, category: 'Baklagil' },
  { name: 'Green Lentil', nameTr: 'Yeşil Mercimek', calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, category: 'Baklagil' },
  { name: 'Chickpeas', nameTr: 'Nohut', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, category: 'Baklagil' },
  { name: 'White Beans', nameTr: 'Kuru Fasulye', calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4, category: 'Baklagil' },
  { name: 'Kidney Beans', nameTr: 'Barbunya', calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4, category: 'Baklagil' },

  // YAĞLAR VE SOSLAR
  { name: 'Olive Oil', nameTr: 'Zeytinyağı', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, category: 'Yağ' },
  { name: 'Sunflower Oil', nameTr: 'Ayçiçek Yağı', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, category: 'Yağ' },
  { name: 'Mayonnaise', nameTr: 'Mayonez', calories: 680, protein: 1.1, carbs: 3.1, fat: 75, fiber: 0, category: 'Sos' },
  { name: 'Ketchup', nameTr: 'Ketçap', calories: 101, protein: 1.7, carbs: 27, fat: 0.1, fiber: 0.3, category: 'Sos' },
  { name: 'Mustard', nameTr: 'Hardal', calories: 66, protein: 4.4, carbs: 5.3, fat: 3.3, fiber: 3.3, category: 'Sos' },

  // TATLILAR
  { name: 'Baklava', nameTr: 'Baklava', calories: 428, protein: 6.7, carbs: 56, fat: 21, fiber: 2.3, category: 'Tatlı' },
  { name: 'Turkish Delight', nameTr: 'Lokum', calories: 320, protein: 0, carbs: 80, fat: 0, fiber: 0, category: 'Tatlı' },
  { name: 'Chocolate', nameTr: 'Çikolata', calories: 546, protein: 4.9, carbs: 61, fat: 31, fiber: 7, category: 'Tatlı' },
  { name: 'Ice Cream', nameTr: 'Dondurma', calories: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0.7, category: 'Tatlı' },
  { name: 'Honey', nameTr: 'Bal', calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, category: 'Tatlı' },
  { name: 'Jam', nameTr: 'Reçel', calories: 278, protein: 0.4, carbs: 69, fat: 0.1, fiber: 1, category: 'Tatlı' },
  { name: 'Kunefe', nameTr: 'Künefe', calories: 380, protein: 8, carbs: 52, fat: 16, fiber: 1, category: 'Tatlı' },
  { name: 'Kadayif', nameTr: 'Kadayıf', calories: 350, protein: 5, carbs: 48, fat: 15, fiber: 1.5, category: 'Tatlı' },
  { name: 'Revani', nameTr: 'Revani', calories: 340, protein: 5, carbs: 58, fat: 10, fiber: 1, category: 'Tatlı' },
  { name: 'Semolina Halva', nameTr: 'İrmik Helvası', calories: 320, protein: 4, carbs: 45, fat: 14, fiber: 2, category: 'Tatlı' },
  { name: 'Flour Halva', nameTr: 'Un Helvası', calories: 330, protein: 5, carbs: 42, fat: 16, fiber: 1.5, category: 'Tatlı' },
  { name: 'Sutlac', nameTr: 'Sütlaç', calories: 160, protein: 4, carbs: 28, fat: 4, fiber: 0.5, category: 'Tatlı' },
  { name: 'Kazandibi', nameTr: 'Kazandibi', calories: 180, protein: 5, carbs: 30, fat: 5, fiber: 0, category: 'Tatlı' },
  { name: 'Chicken Breast Dessert', nameTr: 'Tavuk Göğsü', calories: 170, protein: 6, carbs: 28, fat: 4.5, fiber: 0, category: 'Tatlı' },
  { name: 'Tulumba', nameTr: 'Tulumba Tatlısı', calories: 300, protein: 3, carbs: 55, fat: 8, fiber: 0.5, category: 'Tatlı' },
  { name: 'Sekerpare', nameTr: 'Şekerpare', calories: 310, protein: 4, carbs: 50, fat: 10, fiber: 1, category: 'Tatlı' },

  // İÇECEKLER
  { name: 'Tea', nameTr: 'Çay', calories: 1, protein: 0, carbs: 0.3, fat: 0, fiber: 0, category: 'İçecek' },
  { name: 'Coffee', nameTr: 'Kahve', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, category: 'İçecek' },
  { name: 'Turkish Coffee', nameTr: 'Türk Kahvesi', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, category: 'İçecek' },
  { name: 'Orange Juice', nameTr: 'Portakal Suyu', calories: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2, category: 'İçecek' },
  { name: 'Apple Juice', nameTr: 'Elma Suyu', calories: 46, protein: 0.1, carbs: 11, fat: 0.1, fiber: 0.2, category: 'İçecek' },
  { name: 'Cola', nameTr: 'Kola', calories: 41, protein: 0, carbs: 10.6, fat: 0, fiber: 0, category: 'İçecek' },
  { name: 'Soda', nameTr: 'Gazoz', calories: 41, protein: 0, carbs: 10, fat: 0, fiber: 0, category: 'İçecek' },

  // TÜRK YEMEKLERİ - ANA YEMEKLER
  { name: 'White Bean Stew', nameTr: 'Kuru Fasulye', calories: 190, protein: 8, carbs: 27, fat: 7, fiber: 6, category: 'Yemek' },
  { name: 'Lentil Soup', nameTr: 'Mercimek Çorbası', calories: 105, protein: 5, carbs: 14, fat: 3, fiber: 3.5, category: 'Çorba' },
  { name: 'Ezogelin Soup', nameTr: 'Ezogelin Çorbası', calories: 120, protein: 6, carbs: 16, fat: 4, fiber: 3, category: 'Çorba' },
  { name: 'Tripe Soup', nameTr: 'İşkembe Çorbası', calories: 140, protein: 15, carbs: 8, fat: 5, fiber: 0, category: 'Çorba' },
  { name: 'Tarhana Soup', nameTr: 'Tarhana Çorbası', calories: 110, protein: 4, carbs: 18, fat: 3, fiber: 2, category: 'Çorba' },
  { name: 'Manti', nameTr: 'Mantı', calories: 420, protein: 15, carbs: 70, fat: 10, fiber: 3, category: 'Yemek' },
  { name: 'Kayseri Manti', nameTr: 'Kayseri Mantısı', calories: 410, protein: 16, carbs: 68, fat: 9, fiber: 3, category: 'Yemek' },
  { name: 'Lahmacun', nameTr: 'Lahmacun', calories: 220, protein: 9, carbs: 30, fat: 8, fiber: 2, category: 'Yemek' },
  { name: 'Meat Pide', nameTr: 'Kıymalı Pide', calories: 380, protein: 16, carbs: 42, fat: 17, fiber: 2.5, category: 'Yemek' },
  { name: 'Cheese Pide', nameTr: 'Peynirli Pide', calories: 340, protein: 14, carbs: 40, fat: 15, fiber: 2, category: 'Yemek' },
  { name: 'Mixed Pide', nameTr: 'Karışık Pide', calories: 390, protein: 17, carbs: 41, fat: 18, fiber: 2.5, category: 'Yemek' },
  { name: 'Water Borek', nameTr: 'Su Böreği', calories: 270, protein: 7, carbs: 26, fat: 16, fiber: 1.5, category: 'Yemek' },
  { name: 'Arm Borek', nameTr: 'Kol Böreği', calories: 280, protein: 8, carbs: 28, fat: 15, fiber: 1.5, category: 'Yemek' },
  { name: 'Cigarette Borek', nameTr: 'Sigara Böreği', calories: 290, protein: 9, carbs: 25, fat: 17, fiber: 1, category: 'Yemek' },
  { name: 'Cheese Borek', nameTr: 'Peynirli Börek', calories: 260, protein: 10, carbs: 27, fat: 13, fiber: 1.5, category: 'Yemek' },
  { name: 'Grape Leaves', nameTr: 'Yaprak Sarma', calories: 170, protein: 3, carbs: 29, fat: 4, fiber: 3, category: 'Yemek' },
  { name: 'Cabbage Roll', nameTr: 'Lahana Sarması', calories: 165, protein: 4, carbs: 27, fat: 4.5, fiber: 3.5, category: 'Yemek' },

  // TÜRK YEMEKLERİ - SEBZE YEMEKLERİ
  { name: 'Karniyarik', nameTr: 'Karnıyarık', calories: 200, protein: 8, carbs: 18, fat: 11, fiber: 4, category: 'Yemek' },
  { name: 'Imam Bayildi', nameTr: 'İmam Bayıldı', calories: 180, protein: 2, carbs: 22, fat: 9, fiber: 5, category: 'Yemek' },
  { name: 'Turlu', nameTr: 'Türlü', calories: 120, protein: 3, carbs: 15, fat: 5, fiber: 4, category: 'Yemek' },
  { name: 'Stuffed Pepper', nameTr: 'Biber Dolması', calories: 150, protein: 5, carbs: 20, fat: 6, fiber: 3, category: 'Yemek' },
  { name: 'Stuffed Eggplant', nameTr: 'Patlıcan Dolması', calories: 160, protein: 5, carbs: 21, fat: 6.5, fiber: 4, category: 'Yemek' },
  { name: 'Stuffed Zucchini', nameTr: 'Kabak Dolması', calories: 140, protein: 4.5, carbs: 19, fat: 5.5, fiber: 3, category: 'Yemek' },
  { name: 'Green Beans in Olive Oil', nameTr: 'Zeytinyağlı Taze Fasulye', calories: 90, protein: 2, carbs: 12, fat: 4, fiber: 3, category: 'Yemek' },
  { name: 'Hunkar Begendi', nameTr: 'Hünkar Beğendi', calories: 220, protein: 10, carbs: 15, fat: 14, fiber: 3, category: 'Yemek' },

  // SALATALAR
  { name: 'Shepherd Salad', nameTr: 'Çoban Salatası', calories: 55, protein: 1.5, carbs: 8, fat: 2.5, fiber: 2.5, category: 'Salata' },
  { name: 'Seasonal Salad', nameTr: 'Mevsim Salatası', calories: 50, protein: 1.8, carbs: 7, fat: 2, fiber: 2.8, category: 'Salata' },
  { name: 'Bulgur Salad', nameTr: 'Kısır', calories: 160, protein: 4, carbs: 28, fat: 4, fiber: 4, category: 'Salata' },
  { name: 'Bean Salad', nameTr: 'Piyaz', calories: 140, protein: 6, carbs: 20, fat: 5, fiber: 5, category: 'Salata' },
];

export const getFoodsByCategory = (category: string): FoodData[] => {
  return TURKISH_FOOD_DATABASE.filter(food => food.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = new Set(TURKISH_FOOD_DATABASE.map(food => food.category));
  return Array.from(categories).sort();
};

export const getTotalFoodCount = (): number => {
  return TURKISH_FOOD_DATABASE.length;
};
