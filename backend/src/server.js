import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import db from "./db.js";
import { createPasswordResetRouter } from './password-reset.js';
import { sendSiteEmail } from './email.js';
import { hashPassword, passwordErrors, verifyPassword } from './passwords.js';
import {
  SESSION_COOKIE,
  createAuthMiddleware,
  createSessionToken,
  requireAdmin,
  sessionCookieOptions,
} from "./auth.js";

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const productImagesDirectory = path.resolve(currentDirectory, "../../frontend/src/assets/img/products");
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
]);
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    callback(new Error("Bu kaynaktan erişime izin verilmiyor."));
  },
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use("/product-images", express.static(productImagesDirectory));
app.use('/api/password-reset', createPasswordResetRouter(db));
const requireAuth = createAuthMiddleware(db);
const optionalAuth = (req, res, next) => {
  if (!req.cookies?.[SESSION_COOKIE]) return next();
  return requireAuth(req, res, next);
};

app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "disconnected", error: err.message });
  }
});

app.get("/countries", async (req, res) => {
  const sql = `
    SELECT id, country_name, country_code, phone_code, flag
    FROM countries
    ORDER BY country_name
  `;

  try {
    const [countries] = await db.query(sql);
    res.status(200).json(countries);
  } catch (err) {
    console.error("Ülkeler getirilemedi:", err.message);
    res.status(500).json({ message: "Ülkeler getirilemedi" });
  }
});

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

//! ADMIN BOLUMU
//! PRODUCTS LISTELE (OTURUM SAHIBINE GORE)
app.get("/api/products", requireAuth, async (req, res) => {
  try {
    const query = Number(req.user.u_role) === 1
      ? "SELECT * FROM products ORDER BY p_id ASC"
      : "SELECT * FROM products WHERE u_id = ? ORDER BY p_id ASC";
    const [rows] = await db.query(
      query,
      Number(req.user.u_role) === 1 ? [] : [req.user.u_id]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//! PRODUCTS LISTELE
app.get("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number(req.user.u_role) === 1) {
      var [rows] = await db.query("SELECT * FROM products ORDER BY p_id ASC");
    }
    else {
      if (id !== Number(req.user.u_id)) return res.status(403).json({ error: "Bu ürünlere erişemezsiniz." });
      var [rows] = await db.query("SELECT * FROM products WHERE u_id = ?  ORDER BY p_id ASC",[req.user.u_id]);
    }
    
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//! PRODUCTS SAYFASI LISTELE
app.get("/api/productPage", async (req, res) => {
  try {
    const type = Number(req.query.type);
    if (!Number.isInteger(type) || ![1, 2, 3].includes(type)) {
      return res.status(400).json({ error: "Geçerli bir ürün türü belirtilmelidir" });
    }
    const [rows] = await db.query(
      "SELECT * FROM products WHERE p_type = ? ORDER BY p_id ASC",
      [type]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
    

//! PRODUCTS EKLE
app.post("/api/products", requireAuth, async (req, res) => {
  try {
    const { name, stock, price, type, imgMain, imgDetails } = req.body;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Ürün adı boş olamaz" });
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: "Stok sıfır veya pozitif bir tam sayı olmalıdır" });
    }
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ error: "Fiyat sıfır veya pozitif bir sayı olmalıdır" });
    }
    if (!Number.isInteger(type) || ![1, 2, 3].includes(type)) {
      return res.status(400).json({ error: "Geçerli bir ürün türü seçilmelidir" });
    }
    if (typeof imgMain !== "string" || !imgMain.trim()) {
      return res.status(400).json({ error: "Kapak resmi seçilmelidir" });
    }
    if (typeof imgDetails !== "string" || !imgDetails.trim()) {
      return res.status(400).json({ error: "En az bir detay resmi seçilmelidir" });
    }
    const detailPaths = imgDetails.split(";").map((path) => path.trim()).filter(Boolean);
    if (!detailPaths.length) {
      return res.status(400).json({ error: "En az bir detay resmi seçilmelidir" });
    }
    const [result] = await db.query(
      "INSERT INTO products (p_name, p_stock, p_price, p_disc, p_type, p_imgMain, p_imgDetails, u_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name.trim(), stock, price, price, type, imgMain.trim(), detailPaths.join(";"), req.user.u_id]
    );

    res.status(201).json(name + " ürün başarıyla eklendi!");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//! PRODUCTS GÜNCELLE
app.put("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, stock, price, type } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });
    const [owners] = await db.query("SELECT u_id FROM products WHERE p_id = ?", [id]);
    if (!owners.length) return res.status(404).json({ error: "Güncellenecek ürün bulunamadı." });
    if (Number(req.user.u_role) !== 1 && Number(owners[0].u_id) !== Number(req.user.u_id)) {
      return res.status(403).json({ error: "Bu ürünü güncelleyemezsiniz." });
    }
    if (!name || !name.trim()) return res.status(400).json({ error: "Ürün adı boş olamaz" });
    if (isNaN(stock) || stock < 0) return res.status(400).json({ error: "Geçersiz stok miktarı" });
    if (isNaN(price) || price < 0) return res.status(400).json({ error: "Geçersiz fiyat" });
    if (!Number.isInteger(type) || ![1, 2, 3].includes(Number(type))) {
      return res.status(400).json({ error: "Geçerli bir ürün türü seçilmelidir" });
    }
    const [result] = await db.query(
      "UPDATE products SET p_name=?, p_stock=?, p_price=?, p_type=? WHERE p_id=?",
      [name.trim(), Number(stock), Number(price), Number(type), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Güncellenecek ürün bulunamadı." });
    }
    const [rows] = await db.query("SELECT * FROM products WHERE p_id=?", [id]);
    res.status(200).json(name + " adli ürün başarıyla güncellendi!");
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});
//! PRODUCTS SİL
app.delete("/api/products/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [owners] = await db.query("SELECT u_id FROM products WHERE p_id = ?", [id]);
    if (!owners.length) return res.status(404).json({ error: "Silinecek ürün bulunamadı." });
    if (Number(req.user.u_role) !== 1 && Number(owners[0].u_id) !== Number(req.user.u_id)) {
      return res.status(403).json({ error: "Bu ürünü silemezsiniz." });
    }
    const [result] = await db.query("DELETE FROM products WHERE p_id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Silinecek ürün bulunamadı." });
    }
    res.status(200).json({ message: "Ürün silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//! USER ADDRESSES
app.get("/api/addresses", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a_id, a_tckn, a_title AS a_label, a_country,
        a_state AS a_province, a_district, a_postcode AS a_postal_code,
        a_adress AS a_address
      FROM adresses
       WHERE u_id = ?
       ORDER BY a_id DESC`,
      [req.user.u_id]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Kullanıcı adresleri alınamadı:", err.code || err.message);
    res.status(500).json({ error: "Adresler alınamadı." });
  }
});

function validateAddressInput(body) {
  const { tckn, label, country, province, district, postalCode, address } =
    body && typeof body === "object" ? body : {};
  if (typeof tckn !== "string" || !/^\d{11}$/.test(tckn)) {
    return { error: "TCKN 11 rakamdan oluşmalıdır." };
  }
  if (typeof label !== "string" || !label.trim() || label.trim().length > 50) {
    return { error: "Adres başlığı 1-50 karakter olmalıdır." };
  }
  if (typeof country !== "string" || !country.trim() || country.trim().length > 100) {
    return { error: "Geçerli bir ülke seçiniz." };
  }
  if (typeof province !== "string" || !province.trim() || province.trim().length > 100) {
    return { error: "İl alanı 1-100 karakter olmalıdır." };
  }
  if (typeof district !== "string" || !district.trim() || district.trim().length > 100) {
    return { error: "İlçe alanı 1-100 karakter olmalıdır." };
  }
  if (
    typeof postalCode !== "string"
    || !/^[\p{L}\p{N} -]{1,20}$/u.test(postalCode.trim())
  ) {
    return { error: "Posta kodu 1-20 karakter olmalı; harf, rakam, boşluk veya tire içerebilir." };
  }
  if (typeof address !== "string" || !address.trim() || address.trim().length > 1000) {
    return { error: "Açık adres 1-1000 karakter olmalıdır." };
  }

  return {
    value: {
      tckn,
      label: label.trim(),
      country: country.trim(),
      province: province.trim(),
      district: district.trim(),
      postalCode: postalCode.trim(),
      address: address.trim(),
    },
  };
}

app.post("/api/addresses", requireAuth, async (req, res) => {
  try {
    const validated = validateAddressInput(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });
    const { tckn, label, country, province, district, postalCode, address } = validated.value;

    const [countries] = await db.query(
      "SELECT country_name FROM countries WHERE country_name = ? LIMIT 1",
      [country.trim()]
    );
    if (!countries.length) {
      return res.status(400).json({ error: "Seçilen ülke bulunamadı." });
    }

    const connection = await db.getConnection();
    let result;
    try {
      await connection.beginTransaction();
      await connection.query("SELECT u_id FROM users WHERE u_id = ? FOR UPDATE", [req.user.u_id]);
      const [existingAddresses] = await connection.query(
        "SELECT COUNT(*) AS addressCount FROM adresses WHERE u_id = ?",
        [req.user.u_id]
      );
      const [existingTitles] = await connection.query(
        `SELECT a_id FROM adresses
         WHERE u_id = ? AND LOWER(TRIM(a_title)) = LOWER(TRIM(?))
         LIMIT 1`,
        [req.user.u_id, label.trim()]
      );
      if (existingTitles.length) {
        await connection.rollback();
        return res.status(409).json({ error: "Bu adres başlığıyla zaten bir adresiniz var." });
      }
      if (Number(existingAddresses[0].addressCount) >= 3) {
        await connection.rollback();
        return res.status(409).json({ error: "En fazla 3 adres kaydedebilirsiniz." });
      }

      [result] = await connection.query(
        `INSERT INTO adresses
          (a_tckn, u_id, a_title, a_adress, a_country, a_state, a_district, a_postcode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tckn,
          req.user.u_id,
          label.trim(),
          address.trim(),
          country.trim(),
          province.trim(),
          district.trim(),
          postalCode.trim(),
        ]
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
    res.status(201).json({ a_id: result.insertId, message: "Adres kaydedildi." });
  } catch (err) {
    console.error("Kullanıcı adresi kaydedilemedi:", err.code || err.message);
    res.status(500).json({ error: "Adres kaydedilemedi." });
  }
});

app.put("/api/addresses/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Geçersiz adres numarası." });
    }

    const validated = validateAddressInput(req.body);
    if (validated.error) return res.status(400).json({ error: validated.error });
    const { tckn, label, country, province, district, postalCode, address } = validated.value;

    const [existingAddress] = await db.query(
      "SELECT a_id FROM adresses WHERE a_id = ? AND u_id = ? LIMIT 1",
      [id, req.user.u_id]
    );
    if (!existingAddress.length) {
      return res.status(404).json({ error: "Adres bulunamadı." });
    }

    const [existingTitle] = await db.query(
      `SELECT a_id FROM adresses
       WHERE u_id = ? AND a_id <> ? AND LOWER(TRIM(a_title)) = LOWER(TRIM(?))
       LIMIT 1`,
      [req.user.u_id, id, label]
    );
    if (existingTitle.length) {
      return res.status(409).json({ error: "Bu adres başlığıyla zaten bir adresiniz var." });
    }

    const [countries] = await db.query(
      "SELECT country_name FROM countries WHERE country_name = ? LIMIT 1",
      [country]
    );
    if (!countries.length) {
      return res.status(400).json({ error: "Seçilen ülke bulunamadı." });
    }

    await db.query(
      `UPDATE adresses
       SET a_tckn = ?, a_title = ?, a_adress = ?, a_country = ?,
         a_state = ?, a_district = ?, a_postcode = ?
       WHERE a_id = ? AND u_id = ?`,
      [tckn, label, address, country, province, district, postalCode, id, req.user.u_id]
    );
    res.status(200).json({ a_id: id, message: "Adres güncellendi." });
  } catch (err) {
    console.error("Kullanıcı adresi güncellenemedi:", err.code || err.message);
    res.status(500).json({ error: "Adres güncellenemedi." });
  }
});

app.delete("/api/addresses/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Geçersiz adres numarası." });
    }

    const [result] = await db.query(
      "DELETE FROM adresses WHERE a_id = ? AND u_id = ?",
      [id, req.user.u_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Adres bulunamadı." });
    }
    res.status(200).json({ message: "Adres silindi." });
  } catch (err) {
    console.error("Kullanıcı adresi silinemedi:", err.code || err.message);
    res.status(500).json({ error: "Adres silinemedi." });
  }
});

//! MESSAGE BOLUMU
async function createContactMessage(req, res) {
  try {
    const { firstName, lastName, email, code, tel, subject, message } = req.body;
    const values = { firstName, lastName, email, tel, subject, message };
    for (const [field, value] of Object.entries(values)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({ error: "Lütfen tüm zorunlu alanları doldurun." });
      }
    }

    const normalized = Object.fromEntries(
      Object.entries(values).map(([field, value]) => [field, value.trim()])
    );
    if (normalized.firstName.length > 50 || normalized.lastName.length > 50) {
      return res.status(400).json({ error: "Ad ve soyad en fazla 50 karakter olabilir." });
    }
    if (normalized.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
      return res.status(400).json({ error: "Geçerli bir e-posta adresi giriniz." });
    }
    if (normalized.tel.length > 32 || normalized.subject.length > 100 || normalized.message.length > 5000) {
      return res.status(400).json({ error: "Telefon, konu veya mesaj izin verilen uzunluğu aşıyor." });
    }

    const phoneCode = typeof code === "string" ? code.trim() : "";
    if (!phoneCode && !normalized.tel.startsWith("+")) {
      return res.status(400).json({ error: "Telefon ülke kodu girilmelidir." });
    }
    const fullPhone = phoneCode && !normalized.tel.startsWith(phoneCode)
      ? `${phoneCode}${normalized.tel}`
      : normalized.tel;

    const [result] = await db.query(
      "INSERT INTO messages (m_firstName, m_lastName, m_email, m_tel, m_subject, m_message, m_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [normalized.firstName, normalized.lastName, normalized.email, fullPhone, normalized.subject, normalized.message, 0]
    );
    return res.status(201).json({
      status: "success",
      message: "Mesajınız başarıyla gönderildi.",
      messageId: result.insertId,
    });
  } catch (error) {
    console.error("İletişim mesajı kaydedilemedi:", error);
    return res.status(500).json({ error: "Mesajınız kaydedilemedi. Lütfen daha sonra tekrar deneyin." });
  }
}

//! MESSAGE LISTELE
app.get("/api/messages", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM messages ORDER BY m_id DESC");
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//! MESSAGE EKLE
app.post("/api/messages", createContactMessage);
app.post("/api/messages/:id/reply", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const reply = req.body.reply;
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Geçersiz mesaj numarası." });
  }
  if (typeof reply !== "string" || !reply.trim() || reply.trim().length > 5000) {
    return res.status(400).json({ error: "Yanıt boş olamaz ve en fazla 5000 karakter olabilir." });
  }

  let message;
  try {
    const [rows] = await db.query(
      "SELECT m_firstName, m_email, m_subject FROM messages WHERE m_id = ? LIMIT 1",
      [id]
    );
    message = rows[0];
  } catch (error) {
    console.error("Yanıtlanacak iletişim mesajı alınamadı:", error.code || error.message);
    return res.status(500).json({ error: "Mesaj bilgileri alınamadı." });
  }

  if (!message) return res.status(404).json({ error: "Yanıtlanacak mesaj bulunamadı." });
  if (typeof message.m_email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.m_email)) {
    return res.status(400).json({ error: "Mesaj sahibinin e-posta adresi geçersiz." });
  }

  try {
    await sendSiteEmail({
      to: message.m_email,
      subject: `Re: ${String(message.m_subject || "Woodenart iletişim").replace(/[\r\n]+/g, " ").slice(0, 100)}`,
      text: `Merhaba ${message.m_firstName},\n\n${reply.trim()}\n\nWoodenart`,
    });
  } catch (error) {
    console.error("İletişim mesajı yanıt e-postası gönderilemedi:", error.code || error.message);
    return res.status(502).json({ error: "E-posta gönderilemedi. SMTP ayarlarını kontrol edip tekrar deneyin." });
  }

  try {
    await db.query("UPDATE messages SET m_status = 1 WHERE m_id = ?", [id]);
    return res.status(200).json({ message: "Yanıt e-posta ile gönderildi." });
  } catch (error) {
    console.error("E-posta gönderildi ancak mesaj durumu güncellenemedi:", error.code || error.message);
    return res.status(500).json({ error: "E-posta gönderildi ancak mesaj durumu güncellenemedi. Tekrar göndermek yerine durumu elle güncelleyin." });
  }
});
//! MESSAGE GÜNCELLE
app.put("/api/messages/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });
    if (isNaN(status)) return res.status(400).json({ error: "Geçersiz durum" });
    const [result] = await db.query(
      "UPDATE messages SET m_status=? WHERE m_id=?",
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Güncellenecek mesaj bulunamadı." });
    }
    const [rows] = await db.query("SELECT * FROM messages WHERE m_id=?", [id]);
    res.status(200).json("Mesaj durumu başarıyla güncellendi!");
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});
//! MESSAGE SİL
app.delete("/api/messages/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db.query("DELETE FROM messages WHERE m_id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Silinecek mesaj bulunamadı." });
    }
    res.status(200).json({ message: "Mesaj silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//! USERS BOLUMU
//! USERS LISTELE
app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u_id,
        u_firstName,
        u_lastName,
        u_email,
        DATE_FORMAT(u_birthday, '%Y-%m-%d') AS u_birthday,
        u_tel,
        u_role,
        u_created_at
      FROM users
      ORDER BY u_id ASC
    `);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//! USERS EKLE
app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, birthday, code, tel, pass, role } = req.body;
    if (typeof firstName !== "string" || !firstName.trim()) {
      return res.status(400).json({ error: "Ad boş olamaz" });
    }
    if (typeof lastName !== "string" || !lastName.trim()) {
      return res.status(400).json({ error: "Soyad boş olamaz" });
    }
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email boş olamaz" });
    }
    if (!isValidDate(birthday)) {
      return res.status(400).json({ error: "Geçerli bir doğum tarihi giriniz" });
    }
    if (typeof tel !== "string" || !tel.trim()) {
      return res.status(400).json({ error: "Telefon numarası boş olamaz" });
    }
    if (typeof pass !== "string" || !pass.trim()) {
      return res.status(400).json({ error: "Şifre boş olamaz" });
    }
    const passValidationErrors = passwordErrors(pass, pass);
    if (passValidationErrors.length) return res.status(400).json({ error: passValidationErrors[0] });


    const [result] = await db.query(
      "INSERT INTO users (u_firstName, u_lastName, u_email, u_birthday, u_tel, u_pass, u_role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [firstName.trim(), lastName.trim(), email.trim(), birthday, tel.trim(), await hashPassword(pass), role]
    );

    res.status(201).json(firstName + " adli kullanıcı başarıyla eklendi!");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//! USERS GÜNCELLE
app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { firstName, lastName, email, birthday, code, tel, pass, role } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });
    if (typeof firstName !== "string" || !firstName.trim()) return res.status(400).json({ error: "Ad boş olamaz" });
    if (typeof lastName !== "string" || !lastName.trim()) return res.status(400).json({ error: "Soyad boş olamaz" });
    if (typeof email !== "string" || !email.trim()) return res.status(400).json({ error: "Email boş olamaz" });
    if (!isValidDate(birthday)) return res.status(400).json({ error: "Geçerli bir doğum tarihi giriniz" });
    if (typeof tel !== "string" || !tel.trim()) return res.status(400).json({ error: "Telefon numarası boş olamaz" });
    if (typeof pass !== "string") return res.status(400).json({ error: "Şifre alanı geçersiz" });
    let result;
    if (pass.trim()) {
      const passValidationErrors = passwordErrors(pass, pass);
      if (passValidationErrors.length) return res.status(400).json({ error: passValidationErrors[0] });
      [result] = await db.query(
        "UPDATE users SET u_firstName=?, u_lastName=?, u_email=?, u_birthday=?, u_tel=?, u_pass=?, u_role=? WHERE u_id=?",
        [firstName.trim(), lastName.trim(), email.trim(), birthday, tel.trim(), await hashPassword(pass), role, id]
      );
    } else {
      [result] = await db.query(
        "UPDATE users SET u_firstName=?, u_lastName=?, u_email=?, u_birthday=?, u_tel=?, u_role=? WHERE u_id=?",
        [firstName.trim(), lastName.trim(), email.trim(), birthday, tel.trim(), role, id]
      );
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Güncellenecek kullanıcı bulunamadı." });
    }
    const [rows] = await db.query("SELECT * FROM users WHERE u_id=?", [id]);
    res.status(200).json(firstName + " adli kullanıcı başarıyla güncellendi!");
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});
//! USERS SİL
app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db.query("DELETE FROM users WHERE u_id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Silinecek kullanıcı bulunamadı." });
    }
    res.status(200).json({ message: "Kullanıcı silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//! ORDERS BOLUMU
app.post("/api/orders", optionalAuth, async (req, res) => {
  try {
    const cart = req.body?.sepet;
    const checkout = Array.isArray(req.body?.order) ? req.body.order[0] : req.body?.order;
    if (!Array.isArray(cart) || cart.length === 0 || cart.length > 100) {
      return res.status(400).json({ error: "Sepet boş olamaz ve en fazla 100 ürün içerebilir." });
    }
    if (!checkout || typeof checkout !== "object") {
      return res.status(400).json({ error: "Sipariş iletişim ve adres bilgileri eksik." });
    }

    const quantities = new Map();
    for (const item of cart) {
      const productId = Number(item?.p_id);
      const quantity = item?.adet === undefined ? 1 : Number(item.adet);
      if (!Number.isInteger(productId) || productId < 1) {
        return res.status(400).json({ error: "Sepette geçersiz ürün bilgisi var." });
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return res.status(400).json({ error: "Ürün adedi geçersiz." });
      }
      const totalQuantity = (quantities.get(productId) || 0) + quantity;
      if (totalQuantity > 100) {
        return res.status(400).json({ error: "Aynı üründen en fazla 100 adet sipariş verilebilir." });
      }
      quantities.set(productId, totalQuantity);
    }

    const productIds = [...quantities.keys()];
    const firstName = req.user?.u_firstName ?? checkout.name;
    const lastName = req.user?.u_lastName ?? checkout.lastName;
    if (
      typeof firstName !== "string" || !firstName.trim()
      || typeof lastName !== "string" || !lastName.trim()
    ) {
      return res.status(400).json({ error: "Ad ve soyad alanları zorunludur." });
    }
    const person = `${firstName.trim()} ${lastName.trim()}`;
    if (person.length > 50) {
      return res.status(400).json({ error: "Ad ve soyad toplamı 50 karakteri geçemez." });
    }

    const requiredAddressFields = [
      ["address", "Açık adres"],
      ["country", "Ülke"],
      ["city", "İl"],
      ["district", "İlçe"],
      ["zip", "Posta kodu"],
    ];
    for (const [field, label] of requiredAddressFields) {
      if (typeof checkout[field] !== "string" || !checkout[field].trim()) {
        return res.status(400).json({ error: `${label} alanı zorunludur.` });
      }
    }
    const address = [
      checkout.address,
      checkout.district,
      checkout.city,
      checkout.country,
      checkout.zip,
    ].map((value) => value.trim()).join(", ");
    if (address.length > 200) {
      return res.status(400).json({ error: "Sipariş adresi 200 karakteri geçemez." });
    }

    const connection = await db.getConnection();
    let result;
    const orderNumber = `${Date.now()}${randomNumber(1000, 9999)}`;
    try {
      await connection.beginTransaction();
      const [products] = await connection.query(
        "SELECT p_id, p_name, p_price, p_stock FROM products WHERE p_id IN (?) FOR UPDATE",
        [productIds]
      );
      if (products.length !== productIds.length) {
        await connection.rollback();
        return res.status(400).json({ error: "Sepette bulunmayan veya artık mevcut olmayan ürün var." });
      }

      const productsById = new Map(products.map((product) => [Number(product.p_id), product]));
      const orderedProductIds = [];
      const orderedProductNames = [];
      let subtotalCents = 0;
      for (const [productId, quantity] of quantities) {
        const product = productsById.get(productId);
        const stock = Number(product.p_stock);
        if (stock > 0 && quantity > stock) {
          await connection.rollback();
          return res.status(409).json({
            error: `${product.p_name} için stok yetersiz. Mevcut stok: ${stock}.`
          });
        }
        if (stock <= 0 && quantity > 1) {
          await connection.rollback();
          return res.status(409).json({
            error: `${product.p_name} stokta bulunmuyor; en fazla 1 adet sipariş verilebilir.`
          });
        }

        for (let index = 0; index < quantity; index += 1) {
          orderedProductIds.push(productId);
          orderedProductNames.push(product.p_name);
        }
        subtotalCents += Math.round(Number(product.p_price) * 100) * quantity;
      }
      const amount = (subtotalCents + Math.round(subtotalCents * 0.2)) / 100;

      for (const [productId, quantity] of quantities) {
        const product = productsById.get(productId);
        if (Number(product.p_stock) <= 0) continue;

        const [stockUpdate] = await connection.query(
          "UPDATE products SET p_stock = p_stock - ? WHERE p_id = ? AND p_stock >= ?",
          [quantity, productId, quantity]
        );
        if (stockUpdate.affectedRows !== 1) {
          throw new Error(`Ürün stoğu güncellenemedi (p_id: ${productId}).`);
        }
      }

      [result] = await connection.query(
        `INSERT INTO orders
          (u_id, o_no, o_products, o_pid, o_person, o_adress, o_amount, o_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user?.u_id ?? null,
          orderNumber,
          JSON.stringify(orderedProductNames),
          JSON.stringify(orderedProductIds),
          person,
          address,
          amount.toFixed(2),
          "Hazirlaniyor",
        ]
      );
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    res.status(201).json({
      o_id: result.insertId,
      o_no: orderNumber,
      message: "Sipariş başarıyla oluşturuldu.",
    });
  } catch (err) {
    console.error("Sipariş oluşturulamadı:", err.code || err.message);
    res.status(500).json({ error: "Sipariş oluşturulamadı." });
  }
});

//! ORDERS LISTELE
app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const isAdmin = Number(req.user.u_role) === 1;
    const [rows] = await db.query(
      `SELECT o_id AS id, o_no, o_products, o_pid, o_person,
        o_adress AS o_address, o_amount, o_date, o_status
       FROM orders
       ${isAdmin ? "" : "WHERE u_id = ?"}
       ORDER BY o_id DESC`,
      isAdmin ? [] : [req.user.u_id]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//! ORDERS GÜNCELLE
app.put("/api/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { o_no, o_amount, o_date, o_status } = req.body;
    if (isNaN(id)) return res.status(400).json({ error: "Geçersiz ID" });
    if (!o_no || !o_no.trim()) return res.status(400).json({ error: "Sipariş numarası boş olamaz" });
    if (isNaN(o_amount) || o_amount < 0) return res.status(400).json({ error: "Geçersiz sipariş miktarı" });
    if (!o_date) return res.status(400).json({ error: "Sipariş tarihi boş olamaz" });
    const [result] = await db.query(
      "UPDATE orders SET o_no=?, o_amount=?, o_date=?, o_status=? WHERE o_id=?",
      [o_no.trim(), o_amount, o_date, o_status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Güncellenecek sipariş bulunamadı." });
    }
    res.status(200).json(o_no + " numaralı sipariş başarıyla güncellendi!");
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});
//! ORDERS SİL
app.delete("/api/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [result] = await db.query("DELETE FROM orders WHERE o_id=?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Silinecek sipariş bulunamadı." });
    }
    res.status(200).json({ message: "Sipariş silindi." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//! CONTACTMESSAGE EKLE
app.post("/api/contact", createContactMessage);

//! REGISTER POST
app.post("/api/register", async (req, res) => {
  try {
    const { firstName, lastName, email, birthday, tel, pass } = req.body;
    if (typeof firstName !== "string" || !firstName.trim()) {
      return res.status(400).json({ error: "Ad boş olamaz" });
    }
    if (typeof lastName !== "string" || !lastName.trim()) {
      return res.status(400).json({ error: "Soyad boş olamaz" });
    }
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email boş olamaz" });
    }
    if (!isValidDate(birthday)) {
      return res.status(400).json({ error: "Geçerli bir doğum tarihi giriniz" });
    }
    if (typeof pass !== "string" || !pass.trim()) {
      return res.status(400).json({ error: "Şifre boş olamaz" });
    }
    if (typeof tel !== "string" || !tel.trim()) {
      return res.status(400).json({ error: "Telefon numarası boş olamaz" });
    }
    const passValidationErrors = passwordErrors(pass, pass);
    if (passValidationErrors.length) return res.status(400).json({ error: passValidationErrors[0] });

    const [result] = await db.query(
      "INSERT INTO users (u_firstName, u_lastName, u_email, u_birthday, u_tel, u_pass, u_role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [firstName.trim(), lastName.trim(), email.trim(), birthday, tel.trim(), await hashPassword(pass), 0]
    );

    res.status(201).json({ status: "success", message: firstName + " adli kullanıcı başarıyla eklendi!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//! LOGIN POST
app.post("/api/login", async (req, res) => {
  try {
    const { email, pass } = req.body;
    if (typeof email !== 'string' || typeof pass !== 'string' || pass.length > 128) {
      return res.status(400).json({ error: 'Geçersiz giriş bilgileri.' });
    }
    const [rows] = await db.query("SELECT u_id, u_role, u_firstName, u_lastName, u_pass FROM users WHERE u_email=?", [email]);
    const matched = [];
    for (const user of rows) {
      if (await verifyPassword(pass, user.u_pass)) {
        const { u_pass, ...publicUser } = user;
        matched.push(publicUser);
      }
    }
    if (matched.length > 0) {
      const token = createSessionToken(matched[0]);
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions);
      res.status(200).json(matched);
    }
    else {
      res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//! LOGIN sql
app.get("/api/auth/me", requireAuth, (req, res) => {
  res.status(200).json(req.user);
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: sessionCookieOptions.httpOnly,
    secure: sessionCookieOptions.secure,
    sameSite: sessionCookieOptions.sameSite,
    path: sessionCookieOptions.path,
  });
  res.status(200).json({ message: "Oturum kapatıldı." });
});

app.post("/api/getUserName", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT u_id, u_role, u_firstName, u_lastName FROM users WHERE u_id=? ", [req.user.u_id]);
    if (rows.length > 0) {
      res.status(200).json(rows);
    }
    else {
      res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = Number(process.env.PORT) || 3001;

async function startServer() {
  try {
    await db.query("SELECT 1");
    app.listen(PORT, () => console.log(`Backend: http://localhost:${PORT}`));
  } catch (err) {
    console.error("Veritabanı bağlantısı kurulamadı:", err.message);
    process.exitCode = 1;
  }
}

startServer();
