// lib/crypto.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// secret key from the ENV
const secretKey = process.env.ENCRYPTION_KEY; 
const iv = crypto.randomBytes(16);

export function encrypt(text) {
  if (!secretKey) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text) {
  if (!secretKey) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}