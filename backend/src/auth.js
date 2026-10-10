import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "woodenart_session";

const issuer = "woodenart-api";
const audience = "woodenart-web";
const isProduction = process.env.NODE_ENV === "production";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET en az 32 karakter olmalıdır.");
  }
  return secret;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createSessionToken(user) {
  return jwt.sign(
    { role: Number(user.u_role) },
    getJwtSecret(),
    {
      algorithm: "HS256",
      subject: String(user.u_id),
      issuer,
      audience,
      expiresIn: "7d",
    },
  );
}

export function createAuthMiddleware(db) {
  return async function requireAuth(req, res, next) {
    try {
      const token = req.cookies?.[SESSION_COOKIE];
      if (!token) return res.status(401).json({ error: "Oturum açmanız gerekiyor." });

      const payload = jwt.verify(token, getJwtSecret(), {
        algorithms: ["HS256"],
        issuer,
        audience,
      });
      const userId = Number(payload.sub);
      if (!Number.isInteger(userId)) throw new Error("Geçersiz kullanıcı kimliği");

      const [rows] = await db.query(
        "SELECT u_id, u_role, u_firstName, u_lastName, u_email, u_tel FROM users WHERE u_id = ? LIMIT 1",
        [userId],
      );
      if (!rows.length) return res.status(401).json({ error: "Oturum geçersiz." });

      req.user = rows[0];
      next();
    } catch {
      res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions, maxAge: undefined });
      return res.status(401).json({ error: "Oturum süresi dolmuş veya geçersiz." });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (Number(req.user?.u_role) !== 1) {
    return res.status(403).json({ error: "Bu işlem için yetkiniz yok." });
  }
  next();
}
