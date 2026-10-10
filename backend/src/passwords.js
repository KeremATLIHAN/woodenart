import { randomBytes, scrypt as deriveKey, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(deriveKey);

export function passwordErrors(password, confirmation) {
  const errors = [];
  if (typeof password !== 'string' || password.length < 8 || password.length > 128
    || !/\p{Ll}/u.test(password) || !/\p{Lu}/u.test(password)
    || !/\p{N}/u.test(password) || !/[^\p{L}\p{N}\s]/u.test(password)) {
    errors.push('Parola 8-128 karakter olmalı; küçük harf, büyük harf, rakam ve özel karakter içermelidir.');
  }
  if (password !== confirmation) errors.push('Parola tekrarı parola ile aynı olmalıdır.');
  return errors;
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || password.length > 128 || typeof stored !== 'string') return false;
  if (!stored.startsWith('scrypt$')) {
    const actual = Buffer.from(password);
    const expected = Buffer.from(stored);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
  const [, salt, digest] = stored.split('$');
  if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(digest, 'hex'));
}
