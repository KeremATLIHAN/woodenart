# Gmail ile şifre yenileme

Backend `.env` dosyasında:

```env
SMTP_USER=thewoodenart.tr@gmail.com
SMTP_APP_PASSWORD=
```

Google hesabında iki adımlı doğrulamayı açın. https://myaccount.google.com/apppasswords adresinden Woodenart için uygulama şifresi oluşturun ve `SMTP_APP_PASSWORD` alanına yazın. Gmail hesap parolasını SMTP için kullanmayın; Google uygulama şifresi gereklidir. E-posta hesabı parolanız herkese açık bir yerde paylaşıldıysa hemen değiştirin. `.env` dosyasını paylaşmayın veya Git'e eklemeyin.

Ardından backend'i yeniden başlatın: `npm run dev` veya `npm start`.

Üç hatalı girişten sonra açılan formda e-posta adresinizi girip doğrulama kodu isteyin. E-postaya gelen altı rakamlı kodu ve yeni parolanızı girerek Parolayı Güncelle düğmesine basın. Kodu doğrulamadan parola değiştirilemez. Parola güncellendiğinde giriş formu açılır.

Kod 10 dakika geçerlidir, tek kullanımlıktır ve beş hatalı kod denemesinde iptal edilir. Yeniden kod isteme aralığı bir dakikadır. Kodlar sunucu belleğinde saklanır; backend yeniden başlatılınca geçersiz olur. Bu uygulama tek backend işlemi içindir; çoklu sunucu için ortak kod deposu gerekir.

`POST /api/password-reset/request`: `{ email }`

`POST /api/password-reset/confirm`: `{ requestId, code, password, confirmPassword }`

Yeni parolalar scrypt hash olarak saklanır. Eski kayıtların girişini korumak için login endpoint'i eski düz metin parolaları da kabul eder. Kayıt ve admin oluşturma akışları henüz hash'e taşınmadı.

Yeni bir veritabanına kurulumda hash sütununu genişletin:

```sql
ALTER TABLE users MODIFY u_pass VARCHAR(255) NOT NULL;
```

Akış testi: `node tests/password-reset.test.mjs`. Test, sahte veritabanı ve e-posta göndericisi kullanır; gerçek hesaba e-posta göndermez veya kullanıcı parolası değiştirmez.
