# Woodenart

Woodenart, Vue 3 ve Vite ile oluşturulmuş bir vitrin/yönetim arayüzü ve Express/MySQL backend'inden oluşur. Bu rehber kurulumun yanında kullanıcıların sayfa ve modal akışlarını, önemli API/DB yollarını ve tekrarlanabilir kontrolleri açıklar.

## Proje yapısı

- `frontend/`: Vue sayfaları, ürün kataloğu, sepet, giriş/kayıt ve yönetim arayüzü.
- `backend/`: Express API, MySQL erişimi, oturum doğrulama ve e-posta gönderimi.
- `backend/migrations/`: Veritabanı şema değişiklikleri.
- `backend/tests/`: Backend akış testleri.
- Kurulum ve kontroller: [frontend rehberi](./frontend/README.md) ve [backend rehberi](./backend/README.md).

## Gereksinimler ve kurulum

- Node.js: backend için 22 veya üzeri; frontend için `frontend/package.json` içindeki engines aralığı.
- MySQL: uygulamanın veritabanı ve `users`, `products`, `messages`, `orders`, `countries` tabloları.

PowerShell'de:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

`backend/.env` içine yerel veritabanı bilgilerini girin. Gerekli değişkenler `DB_HOST`, `DB_USER`, `DB_NAME`; ayrıca gerektiğinde `DB_PASSWORD`, `DB_PORT` ve `PORT` kullanılır. Oturum açma için `JWT_SECRET` en az 32 karakter olmalıdır. Gerçek kimlik bilgilerini README'ye, kaynak koda veya Git'e koymayın.

Frontend bağımlılıklarını kurun:

```powershell
cd ..\frontend
npm install
```

## Uygulamayı çalıştırma

İki ayrı terminal kullanın:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm run dev
```

Backend varsayılan olarak `http://localhost:3001`, Vite ise `http://localhost:5173` adresinde çalışır. Backend sağlık kontrolü:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Beklenen yanıt: `status: ok`, `database: connected`.

## Sayfa ve modal senaryoları

### Giriş ve parola sıfırlama

1. Navbar'daki hesap simgesi giriş modalını açar; oturum varsa kullanıcı/admin sayfasına yönlendirir.
2. E-posta ve parola gönderilir: `POST /api/login`. Başarıda backend HTTP-only oturum çerezi verir, arayüz `GET /api/auth/me` ile oturumu doğrular ve yetkiye göre `/user` veya `/admin` açılır.
3. Üç hatalı parola denemesinde giriş modalı, e-posta doğrulama kodu formuna geçer.
4. E-posta girilip **Doğrulama Kodu Gönder** seçilince `POST /api/password-reset/request`; altı haneli kod e-posta ile gönderilir.
5. Kod, yeni parola ve tekrar gönderilince `POST /api/password-reset/confirm`. Kod 10 dakika geçerli, tek kullanımlık ve beş hatalı denemeyle iptal olur. E-posta başına kod talebi aralığı bir dakikadır.
6. Doğrudan/doğrulamasız parola güncelleme yolu kapalıdır.

E-posta gönderimi Gmail SMTP ile yapılır. `backend/.env` içinde `SMTP_USER` ve Google hesabından üretilmiş `SMTP_APP_PASSWORD` tanımlanmalı; `.env` değişince backend yeniden başlatılmalıdır. Normal Gmail parolası kullanılmaz.

### Kayıt

1. Giriş modalındaki kayıt bağlantısı kayıt modalını açar.
2. Ad, soyad, e-posta, doğum tarihi, ülke/telefon, parola/tekrar ve onay alanları doğrulanır.
3. `POST /api/register` başarılı olunca başarı mesajı üç saniye görünür.
4. Kayıt modalı kapanır; kapanma animasyonu tamamlanınca giriş modalı açılır.

### Ürün arama ve katalog

1. Navbar aramasına kelime veya birden fazla kelime yazıp arama ikonuna basılır ya da form Enter ile gönderilir.
2. Arama `GET /api/productPage?type=1`, `type=2` ve `type=3` kataloglarını tarar: ürünler, devam eden çalışmalar ve araçlar.
3. Eşleştirme ürün adına göre yapılır; Türkçe harf/aksan farklılıkları normalize edilir ve girilen bütün arama terimleri ad içinde bulunmalıdır.
4. Sonuç seçilince ilgili katalog sayfası açılır ve arama terimine uyan ürünler gösterilir. Katalog kartı mevcut ürün/çalışma galerisi akışını kullanır.

### Sepet ve kullanıcı değişimi

- Sepet tarayıcının `localStorage` alanında `woodenart_cart_<u_id>` anahtarıyla saklanır; oturumsuz ziyaretçinin anahtarı `woodenart_cart_guest` olur.
- Sayfa yenilenince aynı kullanıcı/ziyaretçi sepeti yüklenir. Girişte yeni `u_id` sepetine, çıkışta misafir sepetine geçilir; sepetler birbirine karışmaz.
- Eski `woodenart_cart` anahtarı ilk yüklemede etkin kullanıcı/ziyaretçi anahtarına taşınır.
- Sepette ürün adedi stok sınırlarını aşamaz. Ödeme sayfasına boş sepetle geçilemez.
- Checkout posta kodu (5-6 rakam), kart numarası (16 rakam), son kullanma tarihi (`AA/YYYY`, ay `01`-`12`) ve CVV (3 rakam) biçimlerini kontrol eder. Bu kontroller gerçek kartı doğrulamaz ve ödeme işlemez; sipariş tutarını backend ürün fiyatlarından hesaplar.

### İletişim formu ve mesaj yanıtlama

1. Oturum açmış kullanıcı iletişim sayfasını açınca `GET /api/auth/me` HTTP-only çerezle çağrılır. Backend çerezdeki oturumdan `u_id` belirler ve o kullanıcıya ait ad, soyad, e-posta ve telefonu döndürür.
2. Oturum yoksa ad, soyad, e-posta ve telefon alanları ziyaretçi tarafından doldurulur; ülke telefon kodu varsayılan olarak `+90` olur.
3. Konu, mesaj ve bilgi onayı girildikten sonra **Gönder** `POST /api/contact` isteğini yapar. Ülke kodu/telefon birleşik telefon numarası olarak `messages.m_tel` alanına kaydedilir; mesajın başlangıç durumu yanıtsızdır.
4. Admin panelindeki **Mesajlar** listesi `GET /api/messages` ile yüklenir; bu ve mesaj yönetimi endpoint'leri admin oturumu gerektirir.
5. **Yanıtla** uygulama içi modalı açar. Metin gönderilince `POST /api/messages/:id/reply` admin yetkisini doğrular, alıcıyı veritabanındaki mesajdan alır ve aynı SMTP posta servisiyle e-posta gönderir.
6. E-posta başarıyla gönderilince `messages.m_status` yanıtlandı (`1`) olur. SMTP hatasında hata kullanıcıya gösterilir, durum yanıtlandı yapılmaz.

## API akış özeti

| İşlem | Endpoint | Erişim |
|---|---|---|
| Backend/DB sağlık kontrolü | `GET /api/health` | Açık |
| Giriş | `POST /api/login` | Açık |
| Geçerli kullanıcı profili | `GET /api/auth/me` | Oturum çerezi |
| Çıkış | `POST /api/logout` | Oturum çerezi |
| Kayıt | `POST /api/register` | Açık |
| Katalog | `GET /api/productPage?type=1\|2\|3` | Açık |
| Şifre sıfırlama kodu isteği/doğrulaması | `POST /api/password-reset/request`, `POST /api/password-reset/confirm` | Açık, hız sınırlı |
| İletişim mesajı kaydetme | `POST /api/contact` | Açık |
| Mesajları listeleme | `GET /api/messages` | Admin oturumu |
| Mesaja e-posta yanıtı | `POST /api/messages/:id/reply` | Admin oturumu |
| Mesaj durumu/silme | `PUT /api/messages/:id`, `DELETE /api/messages/:id` | Admin oturumu |

## Veritabanı ve migration

Şema güncellemeleri `backend/migrations/` altındadır: iletişim alanlarını genişletme, adres şeması, siparişleri kullanıcılarla ilişkilendirme ve sipariş tutarını `DECIMAL(10, 2)` olarak saklama. Bunlar başlangıç şeması değildir ve uygulama tarafından otomatik çalıştırılmaz. Her dosyayı inceleyip doğru veritabanında yalnızca bir kez uygulayın; öncesinde yedek alın ve dağıtım kaydında takip edin. Migration etkileri ve sırası için [backend migration rehberine](./backend/README.md#veritabanı-ve-migration) bakın.

## Kontroller ve test senaryoları

### Otomatik kontroller

Frontend derlemesi:

```powershell
cd frontend
npm run build
```

Frontend lint (mevcut lint script'i `--fix` kullanır; önce değişiklikleri inceleyin):

```powershell
npm run lint
```

Parola sıfırlama backend testi:

```powershell
cd backend
node tests/password-reset.test.mjs
```

Test; doğrudan sıfırlama endpoint'inin kapalı olduğunu, kod gönderimini, hız sınırını, geçersiz kodu, parola hash'ini, tek kullanımı, zaman aşımını ve beş denemelik kilidi sahte DB/e-posta göndericisiyle kontrol eder. Gerçek kullanıcı parolasını değiştirmez ve e-posta göndermez.

Backend dosyalarında sözdizimi kontrolü:

```powershell
node --check src/server.js
node --check src/auth.js
node --check src/email.js
node --check src/password-reset.js
```

### Tarayıcıda elle kontrol listesi

- [ ] Oturumsuz ziyaretçi iletişim formunu elle doldurup gönderebilir; başarı mesajı görünür ve admin mesaj listesinde kayıt belirir.
- [ ] Giriş yapmış kullanıcı iletişim sayfasını açınca yalnız kendi DB profilindeki ad, soyad, e-posta ve telefon gelir.
- [ ] Giriş ve çıkış arasında kullanıcı A'nın sepeti kullanıcı B'ye gösterilmez; yenileme sonrası her kullanıcının sepeti korunur.
- [ ] Başarılı kayıt mesajı üç saniye görünür; ardından kayıt modalı kapanıp giriş modalı açılır.
- [ ] Katalog adında Türkçe karakter içeren ürün, aksan/harf varyantı ve çok kelimeli aramayla bulunur; sonuç doğru ürün kategorisinde gösterilir.
- [ ] Admin'de **Yanıtla** modalı açılır, klavye/fareyle kullanılabilir; geçersiz/boş yanıt gönderilmez.
- [ ] SMTP ayarları doğrulanmışken bir test mesajına yanıt verilir; alıcıya e-posta ulaşır ve durum yanıtlandı olur.
- [ ] SMTP başarısızken kullanıcıya hata gösterilir ve mesaj durumu yanıtsız kalır.
- [ ] Admin olmayan oturum `/api/messages` veya reply endpoint'ine erişemez.

SMTP bağlantısı `nodemailer` transport `verify()` ile e-posta göndermeden sınanabilir. Gerçek alıcıya e-posta gönderme kontrolü yalnızca açıkça seçilmiş bir test mesajı ve test alıcısıyla yapılmalıdır. Parola, uygulama şifresi, oturum çerezi veya kişisel kullanıcı verilerini terminal çıktısına/README'ye koymayın.

## Daha fazla bilgi

- Backend kurulum ve çalıştırma: [`backend/README.md`](./backend/README.md)
- Gmail parola sıfırlama: [`backend/PASSWORD_RESET.md`](./backend/PASSWORD_RESET.md)
- Frontend notları: [`frontend/README.md`](./frontend/README.md)
