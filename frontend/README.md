# Woodenart Frontend

Woodenart mağaza arayüzü Vue 3, Vue Router, Bootstrap 5 ve Vite kullanır. Bu belge frontend'in yerel geliştirme adımlarını, ekran yapısını, API ile ilişkisini ve kullanıcı senaryolarını açıklar.

## İçindekiler

- [Gereksinimler ve kurulum](#gereksinimler-ve-kurulum)
- [Geliştirme komutları](#geliştirme-komutları)
- [Dizin yapısı](#dizin-yapısı)
- [Sayfalar ve gezinme](#sayfalar-ve-gezinme)
- [Uygulama durumu ve API](#uygulama-durumu-ve-api)
- [Kullanıcı senaryoları](#kullanıcı-senaryoları)
- [Kontrol senaryoları](#kontrol-senaryoları)
- [Sorun giderme](#sorun-giderme)

## Gereksinimler ve kurulum

- Node.js: `package.json` içindeki engines aralığı (`^22.18.0 || >=24.12.0`).
- Çalışan Woodenart backend ve MySQL veritabanı. Frontend, geliştirme sırasında varsayılan `http://localhost:3001` API adresini kullanır.

PowerShell:

```powershell
npm install
npm run dev
```

Vite geliştirme sunucusunun gösterdiği adresi (varsayılan `http://localhost:5173`) tarayıcıda açın. Backend'i ayrı bir terminalde `backend/` içinden `npm run dev` komutuyla başlatın.

## Geliştirme komutları

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

- `npm run dev`: HMR etkin geliştirme sunucusu.
- `npm run build`: Üretim çıktısını `dist/` dizinine oluşturur.
- `npm run preview`: Son üretim çıktısını yerel olarak sunar.
- `npm run lint`: Oxlint ve ESLint'i çalıştırır. Bu depodaki lint script'leri `--fix` kullandığından önce mevcut dosya değişikliklerini gözden geçirin.

Kontrol önerisi:

```powershell
npm run build
```

UI değişikliklerinden sonra aşağıdaki senaryolarda tarayıcıdaki gerçek etkileşimi de kontrol edin; derlemenin başarılı olması API/DB akışının çalıştığını tek başına kanıtlamaz.

## Dizin yapısı

```text
src/
  App.vue                 Uygulama kabuğu, navbar, giriş/kayıt modalları, sepet durumu
  main.js                 Vue uygulamasını ve router'ı başlatır
  router/index.js         Sayfalar ve oturum/yetki koruması
  validation.js           Kayıt, e-posta ve parola doğrulama yardımcıları
  utils/productSearch.js  Türkçe uyumlu ürün adı eşleştirme
  services/siteAlert.js   Ortak bildirim servisi
  components/             Sepet, site bildirimi ve yönetim ekranı bileşenleri
  views/                  Ana sayfa, kataloglar, iletişim, ödeme ve kullanıcı ekranları
```

`App.vue`, sepeti Vue reactivity ile oluşturup `provide('sepet', ...)` üzerinden ilgili sayfa ve bileşenlere verir. Sepet bileşenleri aynı reaktif diziyi paylaşır; kalıcı saklama ve kullanıcı anahtarı da uygulama kabuğunda yönetilir.

## Sayfalar ve gezinme

| Yol | Görünüm | İşlev |
|---|---|---|
| `/` | `Home.vue` | Ana sayfa |
| `/about` | `About.vue` | Hakkımızda |
| `/sss` | `SSS.vue` | Sık sorulan sorular |
| `/contact` | `Contact.vue` | İletişim formu ve harita |
| `/products` | `Product.vue` | Tamamlanan ürün kataloğu ve ürün galerisi |
| `/coming` | `Coming.vue` | Devam eden çalışmalar ve galeri |
| `/finished` | `Finished.vue` | Tamamlanan ürünler galerisi |
| `/tools` | `Tools.vue` | Araçlar kataloğu |
| `/user` | `User.vue` | Kullanıcı alanı; oturum ve kullanıcı rolü gerekir |
| `/admin` | `Admin.vue` | Yönetim paneli; admin rolü gerekir |
| `/checkout` | `Checkout.vue` | Sepet özeti ve sipariş oluşturma; oturum gerekir |

Router geçişlerinde `GET /api/auth/me` ile sunucu oturumu kontrol edilir. İstek `credentials: 'include'` ile HTTP-only oturum çerezini taşır. Korunan rotaya yetkisiz girişte router kullanıcıyı ana sayfaya yönlendirir.

## Uygulama durumu ve API

### API adresi

Sayfalar geliştirme ortamında backend için `http://localhost:3001` kullanır. Backend farklı bir adreste çalıştırılacaksa frontend kaynaklarında sabit URL kullanan çağrılar da birlikte güncellenmelidir. Backend CORS ayarında frontend origin'inin izinli olması ve oturum gereken isteklerde `credentials: 'include'` kullanılması gerekir.

### Oturum

- Giriş modalı `POST /api/login` çağırır.
- Kimlik doğrulamasının esas kaynağı backend'in HTTP-only oturum çerezidir; router her sayfa geçişinde `/api/auth/me` ile bunu doğrular.
- `sessionStorage` içindeki `userId`, sepet anahtarını seçmek ve arayüzde rol/kullanıcı bilgisini taşımak için kullanılır; backend yetkilendirmesinin yerine geçmez.
- Çıkış, sunucudaki oturumu kapatır ve frontend oturum önbelleğini temizler.

### Sepet

- Kullanıcı sepeti `localStorage` içinde `woodenart_cart_<u_id>`, oturumsuz ziyaretçi sepeti `woodenart_cart_guest` anahtarıyla kalıcı tutulur.
- Sayfa yenilemesinde aynı sepet yüklenir. Farklı kullanıcıya geçildiğinde o kullanıcıya ait sepet açılır; sepetler birbirine aktarılmaz.
- Eski `woodenart_cart` anahtarı ilk yüklemede etkin kullanıcı/ziyaretçi anahtarına taşınır.
- Sepet görünümü, ürün kartları ve ödeme ekranı aynı reaktif sepeti kullanır. Stok üst sınırı hem ürün ekleme hem miktar artırma sırasında kontrol edilir.

### Ürün katalogları ve arama

- `GET /api/productPage?type=1`: ürünler.
- `GET /api/productPage?type=2`: devam eden çalışmalar.
- `GET /api/productPage?type=3`: araçlar.

Navbar araması bu üç kataloğu tarar ve `productNameMatches` ile ürün adlarını eşleştirir. Karşılaştırma Türkçe harf/aksan farklılıklarını normalize eder; birden çok kelimede bütün terimler ürün adında aranır. Sonuç seçildiğinde katalog sayfası `search` query parametresiyle açılır ve eşleşen kartlar filtrelenir.

## Kullanıcı senaryoları

### Giriş modalı

1. Navbar hesap simgesine tıklayın.
2. E-posta ve parolayı girip **Giriş Yap** seçin.
3. Başarılı girişte backend oturum çerezi oluşturur, kullanıcı `u_id` ve rolü arayüzde güncellenir; admin `/admin`, kullanıcı ana sayfa/kullanıcı alanına yönlenir.
4. Hatalı giriş mesajı modal içinde görünür. Üç hatalı denemeden sonra parola sıfırlama görünümüne geçilir.

### Kayıt modalı ve girişe geçiş

1. Giriş modalındaki kayıt bağlantısını seçin.
2. Ad, soyad, e-posta, doğum tarihi, ülke/telefon, parola/tekrar ve onay alanlarını doldurun.
3. Parola ve alan doğrulamaları başarısızsa formda hata kalır; istek gönderilmez.
4. Başarılı `POST /api/register` yanıtından sonra başarı mesajı 3 saniye görünür.
5. Kayıt modalı kapanır; Bootstrap kapanma animasyonu tamamlanınca giriş modalı açılır.
6. Backend hata döndürürse kullanıcı kayıt formunda kalır ve hata mesajını görür.

### Üç hatalı girişten sonra parola yenileme

1. Giriş formunda art arda üç hatalı parola gönderin.
2. E-posta adresini girip **Doğrulama Kodu Gönder** seçin.
3. E-postaya gelen altı haneli kodu, yeni parolayı ve parola tekrarını girin.
4. **Parolayı Güncelle** seçilince kod backend'de doğrulanır; başarılı olursa giriş formuna dönülür.
5. Kod 10 dakika geçerlidir, tek kullanımlıdır ve beş hatalı kod denemesinde iptal edilir. Geçersiz kod, bekleme süresi ve gönderim hataları modalda gösterilir.

### Navbar'dan ürün arama

1. Ürün adının tümünü veya bir kısmını yazıp arama ikonuna basın ya da formu Enter ile gönderin.
2. Yükleniyor durumu ve sonuç listesi navbar arama alanının altında görünür.
3. Ürün adı; büyük/küçük harf, Türkçe karakter/aksan farklılığı ve kelime sırası değişse de eşleşebilir.
4. Sonuç yoksa açık bir boş sonuç mesajı gösterilir. API erişilemiyorsa hata mesajı gösterilir.
5. Bir sonucu seçince doğru katalog sayfası açılır ve aranan adla eşleşen ürünler kalır; katalog kartına basınca mevcut galeri modalı açılır.

Örnek kontrol: `Tavus Kuşu` ürün adı için `tavus kus` araması sonuç vermeli; ilgisiz bir kelime sonuç vermemelidir.
Arama düğmesi görsel olarak yalnızca ikon gösterir; ekran okuyucular için erişilebilir adı korunur.

### Sepet ve ödeme

1. Bir ürün kartından ürün galerisi/modalını açıp **Sepete Ekle** seçin. Stokta olmayan ve sipariş verilebilen ürünler için en fazla bir adet eklenir.
2. Sepet düğmesindeki adet ve sepet offcanvas görünümü güncellenmelidir.
3. Sayfayı yenileyin; ürünler kaybolmamalıdır.
4. Kullanıcı A ve B ile ayrı giriş yapıp sepetlerin birbirinden izole olduğunu kontrol edin. Çıkıştan sonra misafir sepeti yüklenmelidir.
5. Adet artırma stok sınırını geçmemeli; adet azaltma/silme toplam tutarı güncellemelidir.
6. Boş sepet ödeme adımına geçememelidir. Oturumlu kullanıcı sepetten checkout'a ilerleyebilir.
7. Checkout formu posta kodunda 5-6 rakam, kart numarasında 16 rakam, son kullanma tarihinde `AA/YYYY` (ay `01`-`12`), CVV'de 3 rakam bekler; geçersiz değerlerde sipariş gönderilmez.
8. Bu kontroller biçim doğrulamasıdır; gerçek kartı doğrulamaz ve ödeme işlemi gerçekleştirmez. Sipariş tutarı backend tarafından ürün fiyatlarından hesaplanır.

### Siparişler ve yönetim tabloları

- Kullanıcı siparişler alanında yalnızca kendi hesabına bağlı siparişleri görür; yönetici tüm siparişleri listeleyip yönetebilir.
- Sipariş tarihleri kısa tarih biçiminde, tutarlar Türkçe yerel biçimde (ör. `16.800,00 TL`) gösterilir.
- Yönetim tablolarındaki işlem düğmeleri dar laptop ekranlarında yer kazanmak için ikon kullanır; erişilebilir ad ve ipucu düğme üzerinde korunur.

### İletişim formu

1. Oturumsuz `/contact` ziyaretinde isim, soyisim, e-posta ve telefon alanları boş olmalı; ziyaretçi bunları doldurur.
2. Oturumlu kullanıcı sayfayı açtığında form `GET /api/auth/me` çağrısı yapar. Ad, soyad, e-posta ve telefon DB'deki oturum kullanıcısından (`u_id`) doldurulur.
3. Konu, mesaj ve onay seçilip **Gönder** tıklanır.
4. Frontend `POST /api/contact` gönderir. Telefon ülke kodu mevcut telefon bilgisiyle birleştirilerek `messages.m_tel` alanına yazılır.
5. Başarı veya backend doğrulama/kayıt hatası formda açıkça görünür. Misafirde iletişim bilgileri gönderimden sonra temizlenir; oturumlu kullanıcının profil bilgileri formda kalır.

### Admin mesajına e-posta ile yanıt

1. Admin hesabıyla `/admin` açıp **Mesajlar** bölümüne gidin.
2. Mesaj satırındaki **Yanıtla** uygulama içi reply modalını açmalıdır. Modal `body` elementine Teleport edildiğinden panel katmanları modal kontrollerini engellememelidir.
3. Alıcı adresini doğrulayıp yanıtı yazın; boş metin gönderilemez.
4. **E-postayı Gönder** `POST /api/messages/:id/reply` çağırır ve oturum çerezi taşır.
5. Backend yalnız admin oturumuna izin verir, alıcı adresini DB'deki mesajdan alır, e-postayı Gmail SMTP ile gönderir ve ancak gönderim başarılıysa mesaj durumunu yanıtlandı yapar.
6. SMTP veya API hatasında modal içinde hata gösterilir ve mesaj durumu değişmemelidir.

## Kontrol senaryoları

### Her değişiklikten sonra

- [ ] `npm run build` başarılı.
- [ ] Değiştirilen Vue dosyalarında VS Code Problems/derleyici hatası yok.
- [ ] Navbar ve route geçişleri çalışıyor.
- [ ] Mobil ve masaüstü görünümde modal/backdrop klavye ve fareyle kullanılabiliyor.
- [ ] API hataları başarı gibi gösterilmiyor; yükleniyor ve boş sonuç durumları doğru.

### Kritik regresyon kontrolleri

- [ ] Kayıt API hatasında login modalına otomatik geçiş olmaz.
- [ ] Parola yenilemede doğrulama kodu olmadan parola değişmez.
- [ ] Aynı tarayıcıda farklı `u_id` kullanıcıları birbirlerinin sepetini görmez.
- [ ] Arama üç ürün türünü tarar; seçilen ürünün katalog rotası doğru olur.
- [ ] Oturumlu contact form alanları API'den gelir; misafir alanları boş ve elle doldurulabilir kalır.
- [ ] Mesaj gönderiminde ülke kodu + telefon tek `m_tel` değeridir; admin panelinde yeni kayıt görünür.
- [ ] Admin reply modalı kapanıp tekrar açılabilir; başarısız gönderimden sonra yanıt metni korunur.

Backend/DB test komutları ve veritabanı migration bilgisi için kök [README](../README.md) ve [`../backend/README.md`](../backend/README.md) dosyalarına bakın.

## Sorun giderme

- **Katalog/iletişim API'si erişilemiyor:** `backend/` içinden `npm run dev` çalıştığını ve `http://localhost:3001/api/health` yanıtını kontrol edin.
- **Oturumlu kullanıcı alanları dolmuyor:** Tarayıcıda `woodenart_session` çerezinin gönderildiğini, `/api/auth/me` yanıtını ve CORS `credentials` ayarını kontrol edin. `userId` tek başına backend profili için yetkilendirme sağlamaz.
- **Mesaj kaydolmuyor:** DevTools Network'te `POST /api/contact` durum kodu/yanıtını ve backend DB bağlantısını kontrol edin. DB şeması `backend/migrations/20261007_expand_contact_message_fields.sql` ile uyumlu olmalıdır.
- **E-posta ile yanıt gitmiyor:** SMTP doğrulaması backend ortamında yapılır. `SMTP_USER`, Google Uygulama Şifresi `SMTP_APP_PASSWORD` ve backend'in en son `.env` ile yeniden başlatıldığını kontrol edin. Normal Gmail parolası kullanmayın.
- **Modal arka planı tıklamaları engelliyor:** Route değişiminden sonra sayfayı yenileyin; modal/backdrop temizliğini ve tarayıcı konsolundaki Bootstrap olaylarını kontrol edin.
- **Lint beklenmedik dosyaları değiştiriyor:** Lint script'leri otomatik düzeltme kullandığından çalışma ağacını önce kontrol edin; yalnız frontend'de hedefli doğrulama için `npx eslint src/views/Contact.vue` veya `npx oxlint src/App.vue` kullanın.
