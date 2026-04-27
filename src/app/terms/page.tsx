'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Kullanım Koşulları / Terms of Service</h1>
        </div>

        {/* Turkish Version */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🇹🇷 Kullanım Koşulları</CardTitle>
            <p className="text-sm text-gray-500">Son Güncellenme: {new Date().toLocaleDateString('tr-TR')}</p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="font-bold text-lg">1. Kabul ve Anlaşma</h3>
              <p>
                Fitto mobil uygulamasını ("Uygulama") kullanarak, bu Kullanım Koşullarını ("Koşullar") kabul etmiş olursunuz. 
                Bu Koşulları kabul etmiyorsanız, lütfen Uygulamayı kullanmayın.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">2. Hizmet Açıklaması</h3>
              <p>
                Fitto, kullanıcılara şu özellikleri sunan bir sağlık ve fitness takip uygulamasıdır:
              </p>
              <ul>
                <li>Kalori ve makro besin takibi</li>
                <li>Egzersiz kaydı ve takibi</li>
                <li>Yemek veritabanı ve tarif arama</li>
                <li>Kilo ve vücut ölçümü takibi</li>
                <li>AI destekli beslenme önerileri (premium)</li>
                <li>İlerleme raporları ve grafikler</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">3. Kullanıcı Hesabı</h3>
              <h4 className="font-semibold">3.1 Hesap Oluşturma</h4>
              <p>
                Uygulamayı kullanmak için bir hesap oluşturmanız gerekir. Doğru, güncel ve eksiksiz bilgi sağlamayı kabul edersiniz.
              </p>

              <h4 className="font-semibold mt-4">3.2 Hesap Güvenliği</h4>
              <p>
                Hesap bilgilerinizin güvenliğinden siz sorumlusunuz. Hesabınızda yetkisiz erişim olduğunu fark ederseniz 
                derhal bize bildirmelisiniz.
              </p>

              <h4 className="font-semibold mt-4">3.3 Yaş Sınırı</h4>
              <p>
                Uygulamayı kullanmak için en az 13 yaşında olmalısınız. 18 yaşın altındaysanız, ebeveyn veya vasinizin 
                izni ile kullanabilirsiniz.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">4. Kullanım Kuralları</h3>
              <p>Uygulamayı kullanırken şunları YAPAMAZSINIZ:</p>
              <ul>
                <li>Yasadışı faaliyetlerde bulunmak</li>
                <li>Diğer kullanıcıların haklarını ihlal etmek</li>
                <li>Zararlı yazılım veya virüs yüklemek</li>
                <li>Uygulama güvenliğini tehlikeye atmak</li>
                <li>Ters mühendislik yapmak veya kodu kopyalamak</li>
                <li>Spam veya istenmeyen içerik paylaşmak</li>
                <li>Başka kullanıcıların hesaplarını ele geçirmeye çalışmak</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">5. İçerik ve Fikri Mülkiyet</h3>
              <h4 className="font-semibold">5.1 Bizim İçeriğimiz</h4>
              <p>
                Uygulama içeriği, tasarımı, logoları ve diğer materyaller Fitto'nun mülkiyetindedir ve telif hakkı ile korunmaktadır.
              </p>

              <h4 className="font-semibold mt-4">5.2 Kullanıcı İçeriği</h4>
              <p>
                Yüklediğiniz içerikler (yemek fotoğrafları, notlar vb.) sizin mülkiyetinizde kalır. Ancak, size hizmet 
                sunabilmemiz için bu içerikleri kullanma hakkı vermiş olursunuz.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">6. Premium Abonelik</h3>
              <h4 className="font-semibold">6.1 Ücretler</h4>
              <p>
                Premium özelliklere erişim için aylık, üç aylık veya yıllık abonelik satın alabilirsiniz. Fiyatlar 
                uygulama içinde belirtilmiştir.
              </p>

              <h4 className="font-semibold mt-4">6.2 Otomatik Yenileme</h4>
              <p>
                Abonelikler otomatik olarak yenilenir. İptal etmek isterseniz, mevcut dönem bitmeden önce iptal etmelisiniz.
              </p>

              <h4 className="font-semibold mt-4">6.3 İade Politikası</h4>
              <p>
                Abonelik ücretleri Apple App Store veya Google Play Store politikalarına tabidir. İadeler için 
                ilgili mağazanın politikalarını inceleyiniz.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">7. Sorumluluk Reddi</h3>
              <p>
                <strong>ÖNEMLİ:</strong> Fitto bir sağlık ve fitness takip aracıdır, tıbbi tavsiye sağlamaz. 
                Herhangi bir diyet veya egzersiz programına başlamadan önce doktorunuza danışınız.
              </p>
              <p>
                Uygulama "olduğu gibi" sunulur. Hizmetin kesintisiz veya hatasız olacağını garanti etmiyoruz.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">8. Sorumluluk Sınırlaması</h3>
              <p>
                Yasaların izin verdiği ölçüde, Fitto şunlardan sorumlu tutulamaz:
              </p>
              <ul>
                <li>Uygulama kullanımından kaynaklanan dolaylı zararlar</li>
                <li>Veri kaybı</li>
                <li>İş kaybı veya kar kaybı</li>
                <li>Üçüncü taraf hizmetlerinden kaynaklanan sorunlar</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">9. Fesih</h3>
              <p>
                Bu Koşulları ihlal ederseniz, hesabınızı önceden bildirmeksizin askıya alabilir veya sonlandırabiliriz. 
                Siz de istediğiniz zaman hesabınızı kapatabilirsiniz.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">10. Değişiklikler</h3>
              <p>
                Bu Koşulları zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda sizi bilgilendireceğiz. 
                Değişikliklerden sonra Uygulamayı kullanmaya devam ederseniz, yeni Koşulları kabul etmiş sayılırsınız.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">11. Uygulanacak Hukuk</h3>
              <p>
                Bu Koşullar Türkiye Cumhuriyeti yasalarına tabidir. Anlaşmazlıklar Türkiye mahkemelerinde çözülecektir.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">12. İletişim</h3>
              <p>
                Bu Koşullar hakkında sorularınız varsa, lütfen bizimle iletişime geçin:
              </p>
              <ul>
                <li>Email: support@fitto.app</li>
                <li>Website: https://fitto.app</li>
              </ul>
            </section>
          </CardContent>
        </Card>

        {/* English Version */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🇬🇧 Terms of Service</CardTitle>
            <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString('en-US')}</p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="font-bold text-lg">1. Acceptance and Agreement</h3>
              <p>
                By using the Fitto mobile application ("App"), you agree to these Terms of Service ("Terms"). 
                If you do not agree to these Terms, please do not use the App.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">2. Service Description</h3>
              <p>
                Fitto is a health and fitness tracking app that provides users with:
              </p>
              <ul>
                <li>Calorie and macronutrient tracking</li>
                <li>Exercise logging and tracking</li>
                <li>Food database and recipe search</li>
                <li>Weight and body measurement tracking</li>
                <li>AI-powered nutrition recommendations (premium)</li>
                <li>Progress reports and charts</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">3. User Account</h3>
              <h4 className="font-semibold">3.1 Account Creation</h4>
              <p>
                You need to create an account to use the App. You agree to provide accurate, current, and complete information.
              </p>

              <h4 className="font-semibold mt-4">3.2 Account Security</h4>
              <p>
                You are responsible for the security of your account information. You must notify us immediately if you 
                become aware of unauthorized access to your account.
              </p>

              <h4 className="font-semibold mt-4">3.3 Age Restriction</h4>
              <p>
                You must be at least 13 years old to use the App. If you are under 18, you may use the App with the 
                permission of your parent or guardian.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">4. Usage Rules</h3>
              <p>When using the App, you MAY NOT:</p>
              <ul>
                <li>Engage in illegal activities</li>
                <li>Violate other users' rights</li>
                <li>Upload malware or viruses</li>
                <li>Compromise app security</li>
                <li>Reverse engineer or copy code</li>
                <li>Share spam or unwanted content</li>
                <li>Attempt to access other users' accounts</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">5. Content and Intellectual Property</h3>
              <h4 className="font-semibold">5.1 Our Content</h4>
              <p>
                The App content, design, logos, and other materials are owned by Fitto and protected by copyright.
              </p>

              <h4 className="font-semibold mt-4">5.2 User Content</h4>
              <p>
                Content you upload (meal photos, notes, etc.) remains your property. However, you grant us the right 
                to use this content to provide you with the service.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">6. Premium Subscription</h3>
              <h4 className="font-semibold">6.1 Fees</h4>
              <p>
                You can purchase monthly, quarterly, or annual subscriptions to access premium features. Prices are 
                indicated in the app.
              </p>

              <h4 className="font-semibold mt-4">6.2 Auto-Renewal</h4>
              <p>
                Subscriptions renew automatically. If you wish to cancel, you must do so before the current period ends.
              </p>

              <h4 className="font-semibold mt-4">6.3 Refund Policy</h4>
              <p>
                Subscription fees are subject to Apple App Store or Google Play Store policies. For refunds, please 
                review the relevant store's policies.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">7. Disclaimer</h3>
              <p>
                <strong>IMPORTANT:</strong> Fitto is a health and fitness tracking tool and does not provide medical advice. 
                Consult your doctor before starting any diet or exercise program.
              </p>
              <p>
                The App is provided "as is." We do not guarantee that the service will be uninterrupted or error-free.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">8. Limitation of Liability</h3>
              <p>
                To the extent permitted by law, Fitto is not liable for:
              </p>
              <ul>
                <li>Indirect damages resulting from app use</li>
                <li>Data loss</li>
                <li>Loss of business or profits</li>
                <li>Issues arising from third-party services</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">9. Termination</h3>
              <p>
                If you violate these Terms, we may suspend or terminate your account without notice. You may also close 
                your account at any time.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">10. Changes</h3>
              <p>
                We may update these Terms from time to time. We will notify you of significant changes. If you continue 
                to use the App after changes, you are deemed to have accepted the new Terms.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">11. Governing Law</h3>
              <p>
                These Terms are governed by the laws of the Republic of Turkey. Disputes will be resolved in Turkish courts.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">12. Contact</h3>
              <p>
                If you have questions about these Terms, please contact us:
              </p>
              <ul>
                <li>Email: support@fitto.app</li>
                <li>Website: https://fitto.app</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
