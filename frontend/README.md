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

Vite geliştirme sunucusunun gösterdiği adresi (varsayılan `http://localhost:5173`) tarayıcıda açın. Backend'i ayrı bir terminalde `backend/` içinden `node server.js` komutuyla başlatın.

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

### Hangi veri nerede saklanır?

| Veri | Saklama yeri | Yenileme/hesap değişimi |
|---|---|---|
| Kimlik doğrulama | Backend imzalı `woodenart_session` HTTP-only çerezi (7 gün) | JavaScript okuyamaz; uygulama açılışında/route geçişlerinde `/api/auth/me` ile doğrulanır. Eski `localStorage`/`sessionStorage` rol ve kullanıcı ID anahtarları kimlik kaynağı değildir ve temizlenir. |
| Kullanıcı profili | MySQL `users` | Yenileme ve yeni oturumda doğrulanmış kullanıcı ID'si üzerinden sunucudan alınır. |
| Sepet | Tarayıcı `localStorage` | `woodenart_cart_<u_id>` kullanıcıya, `woodenart_cart_guest` misafire aittir. Aynı profil ve cihazda yenileme/çıkış/giriş sonrasında ayrı sepetler açılır; hesaplar birbirine aktarılmaz. |
| Kayıtlı teslimat adresleri | MySQL `adresses`, `u_id` ile kullanıcıya bağlı | Oturum açılınca API'den tekrar yüklenir. Kullanıcı alanında eklenebilir, güncellenebilir ve silinebilir. Checkout'ta kayıtlı adres düzenlemesi açıkça işaretlenerek kaydedilir; kayıtlı olmayan başlıkta yeni adres oluşturulabilir. |
| Oluşturulmuş siparişler | MySQL `orders` | `u_id` olan siparişler hesabın sipariş listesinde görünür; liste yetkisi sunucuda uygulanır. |
| Checkout taslağı ve kart alanları | Kalıcı olarak saklanmaz | Yenilemede kaydedilmemiş form alanları kaybolabilir. Kart numarası, son kullanma tarihi ve CVV API'ye gönderilmez ve projede saklanmaz. |

`localStorage` yalnızca o tarayıcı profilinde/cihazda kullanılabilir; başka tarayıcı/cihazla eşitlenmez. Tarayıcı site verisinin veya ilgili sepet anahtarının elle temizlenmesi sepeti siler. Bu nedenle sepeti kullanıcı hesabına bağlı olarak sunucuda yedekleyen bir API mevcut değildir. Uygulamanın ilk sürümündeki ortak `woodenart_cart` anahtarı bir kez etkin sepet sahibinin anahtarına taşınır.

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

### Tarayıcı sekmesi markası

`index.html`, tarayıcı sekmesi başlığını `Woodenart` olarak tanımlar ve favicon olarak `src/assets/img/woodenart3.png` marka görselini kullanır. Başlık veya ikon değiştirilirken bu `<title>` ve `rel="icon"` tanımları güncellenmelidir. Vite başlangıç ikonu `src/assets/logo.svg` kullanılmaz.

## Uygulama durumu ve API

### API adresi

Sayfalar geliştirme ortamında backend için `http://localhost:3001` kullanır. Backend farklı bir adreste çalıştırılacaksa frontend kaynaklarında sabit URL kullanan çağrılar da birlikte güncellenmelidir. Backend CORS ayarında frontend origin'inin izinli olması ve oturum gereken isteklerde `credentials: 'include'` kullanılması gerekir.

### Oturum

- Giriş modalı `POST /api/login` çağırır.
- Başarıda sunucu yedi günlük HTTP-only `woodenart_session` çerezi verir. Uygulama açılışında ve route geçişlerinde router `/api/auth/me` ile oturumu doğrular; frontend kullanıcı ID'si/rolü yetki kararı olarak göndermez.
- Eski `sessionStorage`/`localStorage` içindeki rol, kullanıcı ID'si ve benzeri kimlik cache'leri uygulama başlarken temizlenir. Sepet sahipliği doğrulanmış `/api/auth/me` profilindeki `u_id` ile belirlenir.
- Çıkış sunucu oturum çerezini temizler, kullanıcı cache'ini sıfırlar ve ortak reaktif sepeti misafir sepetiyle değiştirir; önceki kullanıcının ayrı `localStorage` sepetini silmez.

### Sepet

- Uygulama `App.vue` içindeki tek reaktif sepeti `provide/inject` ile sepet, ürün kartı ve checkout'a verir; derin değişiklikler etkin sahibin `localStorage` anahtarına JSON olarak yazılır.
- Uygulama açılışında geçerli kullanıcı ilk route doğrulamasıyla belirlenir. Hesap/guest sahibi değişince mevcut sepet önce eski anahtara yazılır, sonra yeni sahibin sepeti yüklenir. Aynı tarayıcı profilinde sayfa yenileme veya hesaplar arasında geçiş sepetleri birleştirmez/silmez.
- Önceki ortak `woodenart_cart` anahtarı ilk okumada etkin sahibi için yeni anahtara taşınır; geçersiz JSON veya depolama verisi yüklenirken ilgili cart kaydı temizlenerek boş diziye dönülür.
- Katalogdaki stoklu ürün miktarı ve sepet artışı mevcut adetle birlikte `p_stock` değerini aşamaz. Stok değeri `0` veya altındaki sipariş verilebilir ürün sepete en fazla 1 adet eklenebilir. Bu UI sınırı sipariş sırasında backend'in kilitli DB kontrolünün yerini almaz.

### Ürün katalogları ve arama

- `GET /api/productPage?type=1`: ürünler.
- `GET /api/productPage?type=2`: devam eden çalışmalar.
- `GET /api/productPage?type=3`: araçlar.

Navbar araması bu üç kataloğu tarar ve `productNameMatches` ile ürün adlarını eşleştirir. Karşılaştırma Türkçe harf/aksan farklılıklarını normalize eder; birden çok kelimede bütün terimler ürün adında aranır. Sonuç seçildiğinde doğru katalog sayfası `search` ve seçilen kaydın `p_id` query parametreleriyle açılır. Hedef katalog `p_id` mevcutsa yalnızca o ürünü gösterir; `p_id` olmadan arama terimiyle açıldığında eşleşen ürünleri listelemeyi sürdürür. Seçim akışı ürünler (`/products`), devam eden çalışmalar (`/coming`) ve araçlar (`/tools`) kataloglarında ortaktır.

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
5. Bir sonucu seçince doğru katalog sayfası `search` ve seçilen ürünün `p_id` query değerleriyle açılır. Ürün, devam eden çalışma veya araç kataloğu yalnızca seçilen `p_id` değerine ait kartı gösterir; karta basınca mevcut galeri modalı açılır. Sayfa `p_id` olmadan yalnız arama metniyle açıldığında eşleşen bütün ürünler listelenmeye devam eder.

Örnek kontrol: `Tavus Kuşu` ürün adı için `tavus kus` araması sonuç vermeli; ilgisiz bir kelime sonuç vermemelidir.
Arama düğmesi görsel olarak yalnızca ikon gösterir; ekran okuyucular için erişilebilir adı korunur.

### Sepet ve ödeme

1. Bir ürün kartından ürün galerisi/modalını açıp **Sepete Ekle** seçin. Stokta olmayan ve sipariş verilebilen ürünler için en fazla bir adet eklenir.
2. Sepet düğmesindeki adet ve sepet offcanvas görünümü güncellenmelidir.
3. Sayfayı yenileyin; ürünler kaybolmamalıdır.
4. Kullanıcı A ve B ile ayrı giriş yapıp sepetlerin birbirinden izole olduğunu kontrol edin. Çıkıştan sonra misafir sepeti yüklenmelidir.
5. Adet artırma stok sınırını geçmemeli; adet azaltma/silme toplam tutarı güncellemelidir.
6. Kullanıcı A'nın sepetinde ürün varken çıkış yapıp kullanıcı B ile giriş yapın; B'nin sepeti ayrı yüklenmeli, A'nın sepeti A tekrar giriş yapınca geri gelmelidir. Misafir sepeti de kullanıcı sepetleriyle karışmamalıdır.
7. Sayfayı yenileyin: etkin sahibin sepeti korunmalı; DB'de kaydedilmiş kullanıcı profili, adresleri ve siparişleri backend'den tekrar yüklenmelidir.
8. Boş sepet ödeme adımına geçememeli; `/checkout` oturum gerektirmelidir. Checkout sayfasındaki henüz kaydedilmemiş adres/form taslağının yenilemede korunmadığını doğrulayın.
9. Checkout alanlarında tarayıcı zorunlu alan kontrollerine ek olarak posta kodu 5-6 rakam, kart numarası 16 rakam, son kullanma tarihi `AA/YYYY` (ay `01`-`12`, yıl geçerli takvim yılından küçük olamaz) ve CVV 3 rakam biçimiyle sınanmalıdır.
10. Kart verisinin `POST /api/orders` gövdesinde bulunmadığını doğrulayın. Gerçek kart doğrulaması/ödeme sağlayıcısı yoktur; kart alanlarını doldurmak para tahsil edildiği anlamına gelmez.
11. Ürün fiyatını/değişen stoğu tarayıcı payload'ında değiştirerek sipariş tutarı ve stok kararının DB değerlerinden verildiğini doğrulayın. Stok/API hatasında sepet korunmalı; başarılı `201` yanıtından sonra temizlenmelidir.
12. Kayıtlı adres yüklenmesini ve checkout'ta bir kayıtlı başlık seçildiğinde adres alanlarının otomatik dolmasını kontrol edin.
13. Kayıtlı adres üzerinde değişiklik yapın ve **Değişiklikleri kayıtlı adresime uygula** seçeneğini işaretleyerek sipariş gönderin. Adres güncellenmeli ve sonraki kullanımda yeni değerler yüklenmelidir. Seçenek işaretlenmezse kayıtlı adres aynı kalmalıdır.
14. Kayıtlı olmayan adres başlığında **Bu bilgileri bir sonraki sefere kaydet** seçeneği yeni adres oluşturmalıdır. Başarısız adres kaydında sipariş gönderilmemeli ve hata gösterilmelidir.
15. Son kullanma tarihinde geçen yıl reddedilmeli, mevcut takvim yılı ve sonrası kabul edilmeli; geçersiz ay ve biçim reddedilmelidir. Bu doğrulama geçerli yılın geçmiş ayını ayrıca kontrol etmez.

### İstemci checkout doğrulamaları ve sınırları

- Posta kodu: 5 veya 6 ASCII rakam. Kart numarası: 16 rakam; ekranda dörderli boşlukla gösterilebilir. Son kullanma tarihi: `AA/YYYY` ve ay `01`-`12`. CVV: 3 rakam. Giriş sırasında rakam dışı karakterler temizlenir, alanlar uzunluklarına göre kırpılır.
- Form ayrıca ad, soyad, TCKN, açık adres, ülke, il, ilçe, ödeme türü ve kart adı gibi alanlarda HTML `required` kontrolü kullanır. E-posta ve telefon formda isteğe bağlıdır.
- Son kullanma tarihi `AA/YYYY` biçimindedir; ay `01`-`12` olmalı ve yıl mevcut takvim yılından küçük olmamalıdır. Geçerli yıl içindeki ay ayrıca geçmişte kalmış olabilir; ay/yıl bazında tam kart geçerliliği hesaplanmaz. Gerçek kart varlığı veya Luhn kontrolü yapılmaz. Kart alanları sunucuya aktarılmadığından bu yalnızca demo biçim kontrolüdür; ödeme sağlayıcısı entegrasyonu değildir.
- Adres defterine kaydetme API'si ayrıca TCKN'nin 11 rakam olmasını, başlık/ülke/il/ilçe/adres uzunluklarını, ülkenin `countries` tablosunda bulunmasını, aynı başlığın tekrar etmemesini ve kullanıcı başına en fazla 3 adresi kontrol eder.

### Kayıtlı teslimat adreslerini düzenleme

- Kullanıcı alanındaki **Adresler** bölümünde kayıt kartının **Güncelle** düğmesi mevcut adresi formda düzenlemeye açar. Form aynı adresin başlığını koruyabilir; başka bir adresin kullandığı başlık seçilemez. **Değişiklikleri kaydet** `PUT /api/addresses/:id` çağırır, **İptal** formu temizleyip düzenleme modundan çıkarır. Güncelleme adres ekleme üst sınırına takılmaz.
- Checkout'ta `Ev`, `İş` veya `Diğer` başlığı seçildiğinde eşleşen kayıtlı adresin TCKN, adres, ülke, il, ilçe ve posta kodu alanları otomatik doldurulur. Alanlar sipariş için düzenlenebilir; **Değişiklikleri kayıtlı adresime uygula** seçeneği işaretlenmeden bu düzenlemeler adres defterine yazılmaz.
- Checkout güncelleme seçeneği işaretlenmişse mevcut kaydın `a_id` değeriyle `PUT /api/addresses/:id`, yeni başlık için **Bu bilgileri bir sonraki sefere kaydet** seçilmişse `POST /api/addresses` çağrısı sipariş isteğinden önce yapılır. Adres API'si hata verirse sipariş isteği gönderilmez ve hata kullanıcıya bildirilir. Başarılı kayıt/güncellemeden sonra sayfadaki adres listesi güncel değerlerle yenilenir.
- Her iki ekrandaki adres istekleri `credentials: 'include'` ile oturum taşır. Backend adresi oturumdaki kullanıcının `u_id` değeriyle sınırlar; istemciden gelen başka kullanıcıya ait ID ile güncelleme yapılamaz.

### Siparişler ve yönetim tabloları

- Kullanıcı siparişler alanında yalnızca kendi hesabına bağlı siparişleri görür; yönetici tüm siparişleri listeleyip yönetebilir.
- Sipariş tarihleri kısa tarih biçiminde, tutarlar Türkçe yerel biçimde (ör. `16.800,00 TL`) gösterilir.
- Yönetim panelindeki **Kullanıcılar** ve **Mesajlar** tablolarında `#1`, `#2` biçimindeki ilk sütun, API'den gelen mevcut liste sırasındaki satır indeksidir; kalıcı veritabanı ID'si değildir. Liste yenilendiğinde veya sıralama değiştiğinde bu sıra numarası değişebilir. Güncelleme/silme/yanıtlama işlemleri ekranda gösterilmeyen gerçek `u_id` ve `m_id` birincil anahtarlarıyla yapılır.
- Diğer yönetim tablolarında, örneğin **Ürünler** ve **Siparişler** tablolarında gösterilen `p_id`/sipariş `id` veritabanı kaydının gerçek ID'sidir; `#` ile başlayan sıra numarası değildir. Bu ayrım yalnızca sunum biçimidir, API kimliklerini değiştirmez.
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

- **Katalog/iletişim API'si erişilemiyor:** `backend/` içinden `node server.js` çalıştığını ve `http://localhost:3001/api/health` yanıtını kontrol edin.
- **Oturumlu kullanıcı alanları dolmuyor:** Tarayıcıda `woodenart_session` çerezinin gönderildiğini, `/api/auth/me` yanıtını ve CORS `credentials` ayarını kontrol edin. `userId` tek başına backend profili için yetkilendirme sağlamaz.
- **Mesaj kaydolmuyor:** DevTools Network'te `POST /api/contact` durum kodu/yanıtını ve backend DB bağlantısını kontrol edin. DB şeması `backend/migrations/20261007_expand_contact_message_fields.sql` ile uyumlu olmalıdır.
- **E-posta ile yanıt gitmiyor:** SMTP doğrulaması backend ortamında yapılır. `SMTP_USER`, Google Uygulama Şifresi `SMTP_APP_PASSWORD` ve backend'in en son `.env` ile yeniden başlatıldığını kontrol edin. Normal Gmail parolası kullanmayın.
- **Modal arka planı tıklamaları engelliyor:** Route değişiminden sonra sayfayı yenileyin; modal/backdrop temizliğini ve tarayıcı konsolundaki Bootstrap olaylarını kontrol edin.
- **Lint beklenmedik dosyaları değiştiriyor:** Lint script'leri otomatik düzeltme kullandığından çalışma ağacını önce kontrol edin; yalnız frontend'de hedefli doğrulama için `npx eslint src/views/Contact.vue` veya `npx oxlint src/App.vue` kullanın.
