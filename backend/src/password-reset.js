import { Router } from 'express';
import { createHash, randomInt, randomBytes, timingSafeEqual } from 'node:crypto';
import { hashPassword, passwordErrors } from './passwords.js';
import { sendSiteEmail } from './email.js';

const digest = (value) => createHash('sha256').update(value).digest();
const validEmail = (email) => typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function createPasswordResetRouter(db, { sendMail, now = Date.now } = {}) {
  const router = Router();
  const challenges = new Map();
  const requests = new Map();
  const TTL = 10 * 60 * 1000;

  function rateAllowed(key, max, window) {
    const time = now();
    const entries = (requests.get(key) || []).filter((value) => time - value < window);
    if (entries.length >= max) return false;
    entries.push(time);
    requests.set(key, entries);
    return true;
  }

  async function sendCode(email, code) {
    if (sendMail) return sendMail(email, code);
    await sendSiteEmail({
      to: email,
      subject: 'Woodenart şifre yenileme kodunuz',
      text: `Şifre yenileme kodunuz: ${code}\nKod 10 dakika geçerlidir ve yalnızca bir kez kullanılabilir.\nBu isteği siz yapmadıysanız e-postayı dikkate almayın.`,
    });
  }

  router.post('/request', async (req, res) => {
    const email = req.body.email?.trim?.();
    if (!validEmail(email)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    for (const [key, challenge] of challenges) if (challenge.expires <= now()) challenges.delete(key);
    for (const [key, entries] of requests) if (entries.every((time) => now() - time >= 3600000)) requests.delete(key);
    if (!rateAllowed(`ip:${req.ip}`, 10, 3600000)
      || !rateAllowed(`email:${email.toLowerCase()}`, 1, 60000)) {
      return res.status(429).json({ error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' });
    }
    if (!sendMail && (!process.env.SMTP_USER || !process.env.SMTP_APP_PASSWORD?.trim())) {
      return res.status(503).json({ error: 'Şifre yenileme e-posta hizmeti henüz yapılandırılmadı.' });
    }
    try {
      const [users] = await db.query('SELECT u_id FROM users WHERE u_email=?', [email]);
      const requestId = randomBytes(32).toString('hex');
      const code = String(randomInt(100000, 1000000));
      const challenge = { email, ids: users.map((user) => user.u_id), hash: digest(code), expires: now() + TTL, attempts: 0 };
      for (const [key, previous] of challenges) if (previous.email.toLowerCase() === email.toLowerCase()) challenges.delete(key);
      if (users.length) await sendCode(email, code);
      challenges.set(requestId, challenge);
      return res.json({ requestId, message: 'Bu e-posta adresi kayıtlıysa doğrulama kodu gönderildi. Kod 10 dakika geçerlidir.' });
    } catch (error) {
      console.error('Parola sıfırlama kodu gönderme hatası:', error);
      return res.status(503).json({ error: 'Doğrulama kodu gönderilemedi. Lütfen daha sonra tekrar deneyin.' });
    }
  });

  router.post('/confirm', async (req, res) => {
    const { requestId, code, password, confirmPassword } = req.body;
    if (!rateAllowed(`confirm:${req.ip}`, 30, 600000)) return res.status(429).json({ error: 'Çok fazla deneme yaptınız.' });
    const errors = passwordErrors(password, confirmPassword);
    if (errors.length) return res.status(400).json({ error: errors[0] });
    const challenge = challenges.get(requestId);
    if (!challenge || challenge.expires <= now()) {
      challenges.delete(requestId);
      return res.status(400).json({ error: 'Kodun süresi doldu veya istek geçersiz. Yeni kod isteyin.' });
    }
    challenge.attempts += 1;
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)
      || !timingSafeEqual(digest(code), challenge.hash) || !challenge.ids.length) {
      if (challenge.attempts >= 5) challenges.delete(requestId);
      return res.status(400).json({ error: 'Doğrulama kodu hatalı. Beş hatalı denemeden sonra yeni kod istemelisiniz.' });
    }
    // Consume before awaiting: concurrent requests cannot reuse the same code.
    challenges.delete(requestId);
    try {
      const hashed = await hashPassword(password);
      const [result] = await db.query('UPDATE users SET u_pass=? WHERE u_email=? AND u_id IN (?)', [hashed, challenge.email, challenge.ids]);
      if (!result.affectedRows) return res.status(400).json({ error: 'Şifre yenileme isteği geçersiz.' });
      return res.json({ message: 'Parolanız güncellendi. Yeni parolanızla giriş yapabilirsiniz.' });
    } catch (error) {
      console.error('Doğrulama koduyla parola güncelleme hatası:', error);
      return res.status(500).json({ error: 'Parola güncellenemedi. Lütfen yeni kod isteyin.' });
    }
  });
  return router;
}
