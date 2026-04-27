'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Gizlilik Politikası / Privacy Policy</h1>
        </div>

        {/* Turkish Version */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🇹🇷 Gizlilik Politikası</CardTitle>
            <p className="text-sm text-gray-500">Son Güncellenme: {new Date().toLocaleDateString('tr-TR')}</p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="font-bold text-lg">1. Giriş</h3>
              <p>
                Fitto ("biz", "bizim" veya "uygulama") olarak, gizliliğinize saygı duyuyoruz ve kişisel verilerinizi korumayı taahhüt ediyoruz. 
                Bu Gizlilik Politikası, mobil uygulamamızı kullandığınızda hangi bilgileri topladığımızı, bu bilgileri nasıl kullandığımızı 
                ve haklarınızı açıklar.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">2. Topladığımız Bilgiler</h3>
              <h4 className="font-semibold">2.1 Kişisel Bilgiler</h4>
              <ul>
                <li>Kullanıcı adı</li>
                <li>Yaş, kilo, boy gibi sağlık bilgileri</li>
                <li>Günlük yemek ve egzersiz kayıtları</li>
                <li>Hedef ve tercihler</li>
              </ul>

              <h4 className="font-semibold mt-4">2.2 Otomatik Toplanan Bilgiler</h4>
              <ul>
                <li>Cihaz bilgileri (model, işletim sistemi)</li>
                <li>Uygulama kullanım istatistikleri</li>
                <li>Hata günlükleri</li>
              </ul>

              <h4 className="font-semibold mt-4">2.3 Fotoğraflar</h4>
              <p>
                Yemek fotoğraflarını yüklemek için kamera ve galeri izni isteyebiliriz. Bu fotoğraflar yalnızca size sunulan 
                hizmeti sağlamak için kullanılır ve üçüncü taraflarla paylaşılmaz.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">3. Bilgilerin Kullanımı</h3>
              <p>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
              <ul>
                <li>Kalori ve beslenme takibi hizmeti sağlamak</li>
                <li>Kişiselleştirilmiş öneriler sunmak</li>
                <li>Uygulama performansını iyileştirmek</li>
                <li>Teknik destek sağlamak</li>
                <li>Yasal yükümlülükleri yerine getirmek</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">4. Veri Güvenliği</h3>
              <p>
                Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanıyoruz:
              </p>
              <ul>
                <li>HTTPS ile şifrelenmiş veri iletimi</li>
                <li>Güvenli veritabanı depolama</li>
                <li>Düzenli güvenlik denetimleri</li>
                <li>Erişim kontrolü ve kimlik doğrulama</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">5. Üçüncü Taraf Hizmetler</h3>
              <p>
                Uygulamamız aşağıdaki üçüncü taraf hizmetlerini kullanabilir:
              </p>
              <ul>
                <li>Supabase (veritabanı ve kimlik doğrulama)</li>
                <li>OpenAI (AI özellikler için)</li>
                <li>TheMealDB (tarif veritabanı)</li>
              </ul>
              <p>
                Bu hizmetlerin kendi gizlilik politikaları vardır ve verilerinizi bu politikalara uygun olarak işlerler.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">6. Çocukların Gizliliği</h3>
              <p>
                Uygulamamız 13 yaşın altındaki çocuklara yönelik değildir. 13 yaşın altındaki çocuklardan bilerek 
                kişisel bilgi toplamıyoruz. Eğer bir ebeveyn veya vasiyseniz ve çocuğunuzun bize kişisel bilgi verdiğini 
                fark ederseniz, lütfen bizimle iletişime geçin.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">7. Haklarınız</h3>
              <p>Sizin haklarınız:</p>
              <ul>
                <li>Kişisel verilerinize erişim hakkı</li>
                <li>Verilerin düzeltilmesini talep etme hakkı</li>
                <li>Verilerin silinmesini talep etme hakkı</li>
                <li>Veri taşınabilirliği hakkı</li>
                <li>İtiraz etme hakkı</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">8. Veri Saklama</h3>
              <p>
                Kişisel verilerinizi yalnızca bu politikada belirtilen amaçlar için gerekli olduğu sürece saklarız. 
                Hesabınızı sildiğinizde, verileriniz 30 gün içinde sistemlerimizden kalıcı olarak silinir.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">9. Değişiklikler</h3>
              <p>
                Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda sizi 
                uygulama içi bildirim ile bilgilendireceğiz.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">10. İletişim</h3>
              <p>
                Gizlilik politikamız hakkında sorularınız varsa, lütfen bizimle iletişime geçin:
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
            <CardTitle className="text-2xl">🇬🇧 Privacy Policy</CardTitle>
            <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString('en-US')}</p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
            <section>
              <h3 className="font-bold text-lg">1. Introduction</h3>
              <p>
                Fitto ("we", "our" or "app") respects your privacy and is committed to protecting your personal data. 
                This Privacy Policy explains what information we collect when you use our mobile application, how we use 
                that information, and your rights.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">2. Information We Collect</h3>
              <h4 className="font-semibold">2.1 Personal Information</h4>
              <ul>
                <li>Username</li>
                <li>Health information such as age, weight, height</li>
                <li>Daily meal and exercise logs</li>
                <li>Goals and preferences</li>
              </ul>

              <h4 className="font-semibold mt-4">2.2 Automatically Collected Information</h4>
              <ul>
                <li>Device information (model, operating system)</li>
                <li>App usage statistics</li>
                <li>Error logs</li>
              </ul>

              <h4 className="font-semibold mt-4">2.3 Photos</h4>
              <p>
                We may request camera and gallery permissions to upload meal photos. These photos are used solely to 
                provide you with the service and are not shared with third parties.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">3. How We Use Information</h3>
              <p>We use the collected information for:</p>
              <ul>
                <li>Providing calorie and nutrition tracking services</li>
                <li>Offering personalized recommendations</li>
                <li>Improving app performance</li>
                <li>Providing technical support</li>
                <li>Fulfilling legal obligations</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">4. Data Security</h3>
              <p>
                We use industry-standard security measures to protect your data:
              </p>
              <ul>
                <li>HTTPS encrypted data transmission</li>
                <li>Secure database storage</li>
                <li>Regular security audits</li>
                <li>Access control and authentication</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">5. Third-Party Services</h3>
              <p>
                Our app may use the following third-party services:
              </p>
              <ul>
                <li>Supabase (database and authentication)</li>
                <li>OpenAI (for AI features)</li>
                <li>TheMealDB (recipe database)</li>
              </ul>
              <p>
                These services have their own privacy policies and process your data according to those policies.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">6. Children's Privacy</h3>
              <p>
                Our app is not intended for children under 13. We do not knowingly collect personal information from 
                children under 13. If you are a parent or guardian and believe your child has provided us with personal 
                information, please contact us.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">7. Your Rights</h3>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Request correction of your data</li>
                <li>Request deletion of your data</li>
                <li>Data portability</li>
                <li>Object to processing</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg">8. Data Retention</h3>
              <p>
                We retain your personal data only as long as necessary for the purposes stated in this policy. 
                When you delete your account, your data will be permanently deleted from our systems within 30 days.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">9. Changes</h3>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes through 
                in-app notifications.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg">10. Contact</h3>
              <p>
                If you have questions about our privacy policy, please contact us:
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
