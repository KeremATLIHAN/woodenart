# Woodenart Backend

Woodenart backend'i Express, MySQL (`mysql2`), JWT tabanlı HTTP-only oturum çerezi ve Nodemailer/Gmail SMTP kullanır. Bu belge backend'i tek başına kurup çalıştırmak, endpoint erişimlerini anlamak ve sayfa/modal senaryolarının sunucu ile veritabanı tarafını test etmek için hazırlanmıştır.

## İçindekiler

- [Gereksinimler](#gereksinimler)
- [Kurulum ve ortam ayarları](#kurulum-ve-ortam-ayarları)
- [Başlatma ve sağlık kontrolü](#başlatma-ve-sağlık-kontrolü)
- [Dizin yapısı](#dizin-yapısı)
- [Oturum ve yetkilendirme](#oturum-ve-yetkilendirme)
- [API kataloğu](#api-kataloğu)
- [Sayfa ve modal akışları](#sayfa-ve-modal-akışları)
- [Veritabanı ve migration](#veritabanı-ve-migration)
- [Test ve kontrol senaryoları](#test-ve-kontrol-senaryoları)
- [Sorun giderme](#sorun-giderme)

## Gereksinimler

- Node.js `>=22`.
- MySQL sunucusu ve Woodenart veritabanı.
- Frontend geliştirme sırasında backend varsayılan olarak `http://localhost:3001`, frontend origin'i `http://localhost:5173` kullanır.
- Gerçek parola sıfırlama/yanıt e-postası için Gmail SMTP kimlik bilgileri gerekir.

## Kurulum ve ortam ayarları

PowerShell'de:

```powershell
npm install
Copy-Item .env.example .env
```

`backend/.env` dosyasını açıp aşağıdaki değerleri kendi ortamınıza göre ayarlayın:

| Değişken | Açıklama |
|---|---|
| `DB_HOST` | MySQL host adı |
| `DB_USER` | MySQL kullanıcı adı |
| `DB_PASSWORD` | MySQL parolası; boş olabilir |
| `DB_NAME` | Kullanılacak veritabanı |
| `DB_PORT` | MySQL portu; varsayılan `3306` |
| `PORT` | HTTP API portu; varsayılan `3001` |
| `FRONTEND_URL` | CORS için izinli frontend origin'i; varsayılan `http://localhost:5173` |
| `JWT_SECRET` | En az 32 karakterlik gizli oturum imzalama anahtarı |
| `SMTP_USER` | SMTP gönderici Gmail adresi |
| `SMTP_APP_PASSWORD` | Bu Google hesabından oluşturulan Uygulama Şifresi |

Gerçek şifreleri, JWT anahtarını veya `.env` içeriğini README'ye, kaynak koda, issue'ya ya da Git'e koymayın. Gmail SMTP'de normal Google hesap parolası değil, 2 Adımlı Doğrulama etkin hesaptan oluşturulan Uygulama Şifresi kullanılır. `.env` güncellendiğinde backend yeniden başlatılmalıdır. Ayrıntı: [`PASSWORD_RESET.md`](./PASSWORD_RESET.md).

`src/db.js` `.env` dosyasını backend kökünden yükler ve `DB_HOST`, `DB_USER`, `DB_NAME` eksikse başlangıçta hata verir. MySQL havuzu en çok 10 bağlantı kullanır.

## Başlatma ve sağlık kontrolü

Geliştirme:

```powershell
npm run dev
```

Üretim:

```powershell
npm start
```

Backend varsayılan olarak `http://localhost:3001` adresinde başlar. DB bağlantısı kurulamadan API başarılı başlatılmış sayılmaz.

```powershell
Invoke-RestMethod http://localhost:3001/api/health
```

Beklenen yanıt:

```json
{ "status": "ok", "database": "connected" }
```

DB erişimi yoksa endpoint HTTP `503` döndürür. Görseller `GET /product-images/...` statik yolu üzerinden servis edilir.

## Dizin yapısı

```text
src/
  server.js          Express middleware, REST endpoint'leri, DB akışları
  db.js              .env yükleme ve MySQL connection pool
  auth.js            JWT oturum oluşturma/doğrulama ve admin middleware'i
  passwords.js       parola doğrulama, scrypt hash ve eski kayıt uyumluluğu
  email.js           ortak Gmail SMTP gönderim servisi
  password-reset.js  e-posta kodu ile güvenli parola yenileme router'ı
tests/
  password-reset.test.mjs
migrations/
  20261007_expand_contact_message_fields.sql
```

## Oturum ve yetkilendirme

- Giriş başarılı olduğunda yedi gün geçerli `woodenart_session` adlı **HTTP-only** çerez döner. Frontend bu çerezi `credentials: 'include'` ile taşır; tarayıcı JavaScript'i çerez değerini okuyamaz.
- JWT, kullanıcı kimliğini subject (`sub`) alanında taşır. Her korumalı istekte middleware token'ı doğrular ve kullanıcıyı DB'den yeniden okur.
- `requireAuth`: geçerli oturum ister.
- `requireAdmin`: oturuma ek olarak `u_role === 1` ister.
- İstek gövdesindeki `userId` yetki kaynağı değildir. Kaynak, doğrulanmış oturumdaki `req.user.u_id` değeridir.
- CORS yalnız yapılandırılmış frontend origin'lerine credential erişimi açar. Yeni frontend host'u kullanılırsa `FRONTEND_URL` ayarlanıp backend yeniden başlatılmalıdır.
- Çıkış endpoint'i oturum çerezini temizler.

### Kalıcı kullanıcı verileri ve istemci sepeti

- Profil ve kimlik bilgileri `users` tablosundadır; korumalı API her istekte HTTP-only çerezi doğrular ve kullanıcıyı DB'den bulur. Yedi günlük süre dolunca veya hesap silinince oturum artık geçerli sayılmaz.
- Sepet backend DB'sinde saklanmaz. Frontend her tarayıcı profilinde `localStorage` içindeki `woodenart_cart_<u_id>` anahtarını kullanır; ziyaretçi sepeti `woodenart_cart_guest` anahtarındadır. Bu nedenle yenileme ve aynı tarayıcıdaki farklı hesap oturumları sepeti kaybettirmez/hesaplar arasında karıştırmaz; farklı cihaz eşitlemesi veya tarayıcı verisini temizledikten sonra geri yükleme sunulmaz.
- `adresses` tablosundaki kaydedilmiş adresler `u_id` ile kullanıcıya bağlıdır ve yalnız oturumdaki kullanıcı tarafından listelenip değiştirilebilir. Checkout kullanıcı adresini açıkça kaydettiğinde bu API'yi çağırır.
- `orders` tablosu sipariş kaydıdır. Oturumlu siparişte kullanıcı ID'si istek gövdesinden değil, doğrulanmış oturumdan alınır. Sipariş okuma endpoint'i admin'e tüm kayıtları, kullanıcıya yalnız kendi `u_id` kayıtlarını döndürür.
- Checkout form taslağı ve kart bilgileri DB/localStorage kalıcılığına sahip değildir. Kart numarası, son kullanma tarihi ve CVV `/api/orders` payload'ında bulunmaz; backend bunları tahsil etmez/doğrulamaz. Gerçek ödeme entegrasyonu bu uygulamanın kapsamı dışındadır.

## API kataloğu

### Genel ve katalog

| Method | Yol | Erişim | Sonuç |
|---|---|---|---|
| `GET` | `/api/health` | Açık | Backend/DB sağlık durumu |
| `GET` | `/countries` | Açık | Kayıt/iletişim için ülke ve telefon kodları |
| `GET` | `/api/productPage?type=1\|2\|3` | Açık | `p_type` değerine göre sıralı ürün kataloğu |
| `GET` | `/product-images/:path` | Açık | Yerel ürün görseli |

`type` yalnızca `1`, `2` veya `3` olabilir; geçersiz değer HTTP `400` döndürür.

### Oturum ve kullanıcı

| Method | Yol | Erişim | İşlev |
|---|---|---|---|
| `POST` | `/api/login` | Açık | E-posta/parola doğrular ve session cookie oluşturur |
| `GET` | `/api/auth/me` | Oturum | Oturumdaki kullanıcı kimliği ve iletişim profilini döndürür |
| `POST` | `/api/logout` | Açık/çerez temizleme | Session cookie'yi temizler |
| `POST` | `/api/register` | Açık | Kullanıcı hesabı oluşturur |
| `POST` | `/api/getUserName` | Oturum | Oturumdaki kullanıcı bilgisini döndürür; istemci `userId` değeri yetki olarak kullanılmaz |
| `GET` | `/api/users` | Admin | Kullanıcı listesini, parola hariç alanlarla döndürür |
| `POST` | `/api/users` | Admin | Yönetici tarafından kullanıcı oluşturur |
| `PUT` | `/api/users/:id` | Admin | Kullanıcı profilini/opsiyonel parolasını günceller |
| `DELETE` | `/api/users/:id` | Admin | Kullanıcı siler |

Yeni parolalar kayıt, yönetici hesabı ekleme ve parola sıfırlamada scrypt ile hash'lenir. Login, eski düz metin parolalı kayıtları geriye dönük uyumluluk için doğrulayabilir. Geçiş tamamlanana kadar düz metin kayıtlar mevcut olabilir.

### Ürün yönetimi

| Method | Yol | Erişim | İşlev |
|---|---|---|---|
| `GET` | `/api/products/:id` | Oturum | Admin tüm ürünleri; diğer kullanıcı yalnız kendi ürünlerini görür |
| `POST` | `/api/products` | Oturum | Oturumdaki kullanıcı adına ürün oluşturur |
| `PUT` | `/api/products/:id` | Oturum/sahip veya admin | Ürün adı, stok, fiyat ve türünü günceller |
| `DELETE` | `/api/products/:id` | Oturum/sahip veya admin | Ürünü siler |

Ürün tipi `1`, `2`, `3`; stok ve fiyat sıfır veya pozitif olmalıdır. Ürün yazma endpoint'lerinde ownership kontrolü backend'de uygulanır.

### İletişim ve admin mesajları

| Method | Yol | Erişim | İşlev |
|---|---|---|---|
| `POST` | `/api/contact` | Açık | İletişim formu mesajını `messages` tablosuna ekler |
| `POST` | `/api/messages` | Açık | İletişim mesajı eklemek için aynı handler'ın uyumluluk yolu |
| `GET` | `/api/messages` | Admin | Mesajları yenilerden eskiye listeler |
| `POST` | `/api/messages/:id/reply` | Admin | DB'deki alıcıya SMTP üzerinden yanıt gönderir; başarıdan sonra status `1` olur |
| `PUT` | `/api/messages/:id` | Admin | Mesaj durumunu günceller |
| `DELETE` | `/api/messages/:id` | Admin | Mesajı siler |

İletişim telefon ülke kodu ve telefonla birleştirilerek `messages.m_tel` alanında saklanır; tabloda ayrı `m_code` alanı yoktur. Mesaj durumu başlangıçta `0` (yanıtsız), e-posta yanıtı başarıyla gönderildikten sonra `1` (yanıtlandı) olur.

### Parola sıfırlama

| Method | Yol | Erişim | İşlev |
|---|---|---|---|
| `POST` | `/api/password-reset/request` | Açık, hız sınırlı | Adrese doğrulama kodu isteği |
| `POST` | `/api/password-reset/confirm` | Açık, deneme sınırlı | Kod doğrulanınca yeni parolayı kaydeder |

Doğrudan/doğrulamasız parola güncelleme endpoint'i sunulmaz. Payload, süreler, SMTP kurulumu ve test kapsamı için [`PASSWORD_RESET.md`](./PASSWORD_RESET.md) belgesine bakın.

### Siparişler

| Method | Yol | Erişim | İşlev |
|---|---|---|---|
| `POST` | `/api/orders` | Açık veya oturumlu | Sepetteki ürün kimliklerini ve adetleri DB'den doğrular; siparişi oluşturur. Oturumlu siparişte `u_id` ve kişi bilgisi oturumdan alınır. |
| `GET` | `/api/orders` | Oturum | Admin tüm siparişleri; kullanıcı yalnız kendi siparişlerini `u_id` üzerinden görür |
| `PUT` | `/api/orders/:id` | Admin | Sipariş numarası, tutar, tarih ve durumunu günceller |
| `DELETE` | `/api/orders/:id` | Admin | Siparişi siler |

`o_products` ve `o_pid` alanları her ürün adedi için tekrar eden ürün adı/ID dizilerini JSON olarak saklar. `o_amount` istemciden kabul edilmez: backend `products` tablosundaki güncel fiyatları kuruş hassasiyetine yuvarlar, miktarla çarpar ve %20 KDV ekler. Sipariş başlangıç durumu `Hazirlaniyor` olur. Üye siparişlerini `users.u_id` ile ilişkilendirmek için [`20261010_link_orders_to_users.sql`](./migrations/20261010_link_orders_to_users.sql) migration'ı, KDV dahil tutarı kuruş hassasiyetinde saklamak için de [`20261010_store_order_amount_with_vat.sql`](./migrations/20261010_store_order_amount_with_vat.sql) migration'ı uygulanmalıdır. Misafir API siparişlerinde `u_id` boş kalır; mevcut frontend checkout rotası oturum gerektirir.

#### Sipariş oluşturma ve stok transaction'ı

`POST /api/orders` isteği `sepet` dizisi ile `order` adres/iletişim bilgilerini alır. Oturum middleware'i opsiyoneldir; varsa `u_id`, ad ve soyad sunucuda oturum kullanıcısından alınır. Misafir API çağrısı ad ve soyadı payload'dan ister. Her iki durumda da kayıtlı ürün fiyatı/ismi/stoğu yalnızca `products` tablosundan okunur.

1. Sepet boş olamaz, en fazla 100 kayıt içerebilir. `p_id` pozitif tam sayı; `adet` (yoksa 1 kabul edilir) pozitif tam sayı olmalı ve aynı ürünün birleştirilmiş adedi 100'ü aşmamalıdır.
2. Backend ad/soyadın bulunmasını ve toplamının 50 karakteri aşmamasını; açık adres, ülke, il, ilçe ve posta kodunun dolu olmasını, birleştirilmiş sipariş adresinin 200 karakteri geçmemesini kontrol eder. Checkout'taki kart numarası, CVV, son kullanma tarihi ve TCKN bu order handler tarafından doğrulanmaz veya sipariş verisine yazılmaz.
3. Bağlantı transaction başlatır; sepetteki DB ürünlerini `SELECT ... FOR UPDATE` ile kilitler. Ürün artık yoksa sipariş reddedilir. `p_stock > 0` için adet stoktan fazla olamaz. `p_stock <= 0` sipariş verilebilir ürün için aynı sipariş içinde en fazla bir adet kabul edilir.
4. Tutar DB'deki ürün fiyatları üzerinden hesaplanır; stoklu ürünler için `p_stock = p_stock - adet` güncellemesi `p_stock >= adet` koşuluyla çalışır. Stoku sıfır/negatif sipariş verilebilir ürünlerde stok azaltımı yapılmaz.
5. Stok güncellemesi ve `orders` insert'i aynı transaction içindedir. Herhangi bir hata/uyuşmazlıkta rollback stok değişikliklerini de geri alır; başarılı insert sonrasında commit edilir ve HTTP `201` döner. Stok yetersizliği `409`, geçersiz payload `400` döner.
6. Frontend yalnız başarılı yanıtı aldıktan sonra sepeti temizler. API isteği başarısızsa veya stok değişmişse sepet kullanıcının tarayıcısında kalır ve kullanıcı düzeltip yeniden deneyebilir.

Checkout'ta görünen kart alanları şu an gerçek bir ödeme adımına bağlı değildir. İstemci posta kodu/kart biçimini doğrular fakat bu alanları sipariş API'sine göndermez; sunucu tarafında ödeme veya kart doğrulaması yapılmaz.

### Kayıtlı teslimat adresleri

`GET /api/addresses`, `POST /api/addresses`, `PUT /api/addresses/:id` ve `DELETE /api/addresses/:id` oturum gerektirir. Her sorgu `req.user.u_id` ile kapsamlandırılır; başka kullanıcının adresi listelenemez, düzenlenemez veya silinemez. Kayıt/güncelleme TCKN için tam 11 rakam; başlık için 1-50, ülke/il/ilçe için 1-100 ve açık adres için 1-1000 karakter kontrolü yapar. Posta kodu 1-20 harf/rakam/boşluk/tire karakteri kabul eder. Ülke `countries` tablosunda olmalıdır. Kullanıcı başına en fazla 3 adres ve yinelenmeyen adres başlığı uygulanır. Mevcut frontend adres ekranında ekleme/silme, checkout'ta yeni başlıklı adres kaydetme vardır; kayıtlı adresin düzenlenmesi için backend `PUT` endpoint'i mevcut olsa da arayüzde düzenleme akışı sunulmaz.

## Sayfa ve modal akışları

### Giriş, kayıt ve parola sıfırlama

1. Frontend giriş POST'u `/api/login` endpoint'ine gönderir.
2. Backend parola doğrular, uygun kullanıcıyı döndürür ve HTTP-only session cookie oluşturur.
3. Frontend route guard `/api/auth/me` ile çerezi doğrular; admin/user rolüne göre korumalı sayfaya izin verir.
4. Üç hatalı girişten sonra frontend `/api/password-reset/request` çağırır; backend e-posta adresi için altı haneli kod üretir ve Gmail SMTP ile iletir.
5. `/api/password-reset/confirm`, geçerli kodu ve parola kurallarını doğrular; kodu tek kullanım için tüketir ve yeni parolayı hash'leyip kaydeder.
6. SMTP gönderimi için `SMTP_USER` ile Google Uygulama Şifresi gerekir. Parola sıfırlama kodları RAM'de tutulduğundan backend yeniden başlayınca geçersizleşir; birden çok backend instance'ı için ortak challenge store gerekir.

### İletişimden admin yanıtına

1. Oturumlu frontend `/api/auth/me` ile backend'den oturum kullanıcısının (`u_id`) ad, soyad, e-posta ve telefon bilgilerini alır. Misafir kullanıcı formu kendisi doldurur.
2. Frontend `/api/contact` çağrısında iletişim detaylarını, ülke kodunu, konuyu ve mesajı gönderir.
3. Backend alanları doğrular; ülke kodu/telefonu birleştirerek `m_tel` yazar, mesajı status `0` ile kaydeder ve oluşturulan ID'yi döndürür.
4. Admin `/api/messages` ile kayıtları görür. Yanıt modalı `/api/messages/:id/reply` POST'unu oturum çereziyle çağırır.
5. Backend recipient'i istemci payload'ından değil, `m_id` ile bulduğu DB mesajından alır. E-posta gönderimi başarısızsa hata döner ve status değişmez. Gönderimden sonra status güncelleme DB hatası alırsa yanıt e-postasının gönderilmiş olabileceği ayrıca bildirilir.

### Ürün yönetimi ve katalog

1. Ziyaretçi katalogları `GET /api/productPage?type=...` ile okuyabilir.
2. Kullanıcı/admin ürün yönetimi ekranları oturumlu `/api/products/:id` çağrısı yapar.
3. Ürün yazma endpoint'leri tür, stok, fiyat ve görsel yollarını kontrol eder; kullanıcı ürünleri kendi `req.user.u_id` değeriyle ilişkilendirilir.

## Veritabanı ve migration

Uygulama `users`, `products`, `messages`, `orders` ve `countries` tablolarını kullanır.

Başlangıç şeması bu migration dosyalarıyla oluşturulmaz; ilgili tabloların önceden mevcut olması gerekir. Aşağıdaki migration'lar mevcut şemayı günceller:

| Dosya | Etki |
|---|---|
| [`20261007_expand_contact_message_fields.sql`](./migrations/20261007_expand_contact_message_fields.sql) | `messages` iletişim alanlarının uzunluklarını artırır ve `m_message` alanını `TEXT` yapar |
| [`20261010_link_orders_to_users.sql`](./migrations/20261010_link_orders_to_users.sql) | `orders.u_id` alanı, index'i ve kullanıcı foreign key'ini ekler; silinen kullanıcı için değer `NULL` olur |
| [`20261010_store_order_amount_with_vat.sql`](./migrations/20261010_store_order_amount_with_vat.sql) | `orders.o_amount` alanını kuruş hassasiyetli `DECIMAL(10, 2)` yapar |
| [`20261010_align_adresses_schema.sql`](./migrations/20261010_align_adresses_schema.sql) | `adresses` alan tiplerini günceller ve kullanıcı index/foreign key'ini ekler |

Yeni ortamda veya deploy öncesinde:

1. Hedef DB adını/ortamını doğrulayın.
2. Migration öncesi yedek alın.
3. Dosyaların etkisini inceleyin; her migration'ı yalnızca henüz uygulanmadıysa hedef veritabanında çalıştırın. Sipariş bağlantısı migration'ı `orders.u_id` alanını bekleyen API'den önce uygulanmalıdır.
4. `INFORMATION_SCHEMA.COLUMNS`, `INFORMATION_SCHEMA.STATISTICS` ve `INFORMATION_SCHEMA.KEY_COLUMN_USAGE` ile kolonları, index'leri ve foreign key'leri doğrulayın.
5. İlgili iletişim, sipariş ve adres akışlarını test edin.

Migration'lar uygulama başlangıcında otomatik çalışmaz ve framework tarafından izlenmez. Her ortamda hangi dosyaların uygulandığını güvenli bir dağıtım kaydında takip edin; tekrar çalıştırmak kolon/index/constraint çakışmasına yol açabilir. Eski ve misafir siparişlerinde `u_id` boş kalabilir.

## Test ve kontrol senaryoları

### Otomatik testler ve statik kontroller

```powershell
node tests/password-reset.test.mjs
node --check src/server.js
node --check src/auth.js
node --check src/email.js
node --check src/password-reset.js
```

Parola sıfırlama testi fake DB ve fake e-posta göndericisi kullanır; gerçek Gmail'e e-posta atmaz ve gerçek kullanıcı parolasını değiştirmez.

### Çalışan backend/DB kontrolleri

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod 'http://localhost:3001/api/productPage?type=1'
Invoke-RestMethod http://localhost:3001/countries
```

`/api/health` DB bağlantısını doğrular. Katalog ve ülkeler endpoint'leri için gerçek veri bulunması gerekir.

SMTP bağlantısını gerçek e-posta göndermeden Nodemailer `transport.verify()` ile sınayın. SMTP doğrulamasının geçmesi, uygulamadaki reply endpoint'inin admin yetkisi/DB recipient sorgusu gibi diğer kısımlarını tek başına doğrulamaz.

### Senaryo kontrol listesi

- [ ] Eksik `DB_HOST`, `DB_USER` veya `DB_NAME` ile backend başlangıçta açıklayıcı hata verir.
- [ ] Veritabanı erişilebilirken `/api/health` HTTP `200` ve `database: connected` döndürür; DB kesikken `503` döner.
- [ ] Geçersiz `type` ile ürün kataloğu HTTP `400` döndürür.
- [ ] Geçerli giriş cookie üretir; geçersiz giriş cookie oluşturmadan reddedilir.
- [ ] `/api/auth/me` geçerli cookie ile profil döndürür; cookie yok/geçersizken `401` döner.
- [ ] User rolü admin mesaj endpoint'lerine erişemez; admin oturumu erişebilir.
- [ ] Admin olmayan kullanıcı başka kullanıcının ürününü okuyamaz/güncelleyemez/silemez.
- [ ] Üç hatalı frontend girişinden sonra kod isteği; yanlış, süresi dolmuş, yeniden kullanılan kod ve 5 hatalı kod durumları doğrulanır.
- [ ] Contact POST alanları gerçek DB şemasına tam yazar; `m_tel` birleşik telefon, `m_status` başlangıçta `0` olur.
- [ ] Admin reply alıcı adresini DB'den seçer; geçersiz/eksik alıcı veya SMTP hatasında status `0` kalır.
- [ ] SMTP başarılı reply'de e-posta hedef alıcıya gider ve status `1` olur.
- [ ] Reply sonrası status update DB hatası için API özel hata verir; kullanıcı e-postanın gönderilmiş olabileceğini bilir.
- [ ] CORS yalnız izin verilen frontend origin'i kabul eder; credential'lı frontend isteklerinde cookie gönderilir.

Gerçek DB testi yaparken benzersiz test verisi kullanın, eklenen satırın tüm alanlarını ve status değerini doğrulayın ve test kaydını temizleyin. Gerçek alıcıya e-posta testi yalnızca izinli test adresiyle yapılmalıdır. Kullanıcı parolalarını, JWT'leri, SMTP sırlarını veya kişisel mesaj içeriklerini loglamayın.

## Sorun giderme

- **Backend başlamıyor:** Terminalde eksik env değişkenlerini, `JWT_SECRET` uzunluğunu ve MySQL bağlantı hatalarını kontrol edin.
- **Frontend API'ye erişemiyor:** Backend portunu, `FRONTEND_URL` değerini, CORS origin'ini ve frontend çağrılarındaki API adresini kontrol edin.
- **401 / oturum geçersiz:** İstek `credentials: 'include'` kullanıyor mu, `cookie-parser` çalışıyor mu, `JWT_SECRET` yeniden değişmiş mi ve tarayıcı cookie'yi saklıyor mu kontrol edin.
- **403:** Geçerli kullanıcı admin mi veya istenen ürünün sahibi mi kontrol edin. İstemci tarafındaki rol değeri backend yetkisinin yerine geçmez.
- **SMTP `EAUTH` / `535`:** Gönderen kullanıcı adı ve uygulama şifresinin aynı Google hesabına ait olduğunu kontrol edin; normal Gmail parolası kullanmayın. Ayar değişince backend'i yeniden başlatıp `transport.verify()` ile yeniden deneyin.
- **İletişim alanları kesiliyor / insert hatası:** Migration'ın doğru DB'de uygulanıp uygulanmadığını ve `messages` alan tiplerini `INFORMATION_SCHEMA` ile kontrol edin.
- **Yanıt gönderildi ama durum değişmedi:** SMTP gönderimi sonrası DB update başarısız olmuş olabilir; alıcıya tekrar göndermeden admin panelinde status'u kontrol edin.

## İlgili dokümanlar

- Frontend ekranları ve tarayıcı senaryoları: [`../frontend/README.md`](../frontend/README.md)
- Proje genel akışları ve kontroller: [`../README.md`](../README.md)
- Gmail parola sıfırlama kurulumu: [`PASSWORD_RESET.md`](./PASSWORD_RESET.md)
