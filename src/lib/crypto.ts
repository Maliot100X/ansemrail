import { createCipheriv, createDecipheriv, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "default-key-change-me";
  return scryptSync(secret, "ansemrail-salt", 32);
}

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const key = getKey();
  const iv = Buffer.from(crypto.getRandomValues(new Uint8Array(16)));
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

export function decrypt(data: {
  encrypted: string;
  iv: string;
  tag: string;
}): string {
  const key = getKey();
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(data.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(data.tag, "hex"));
  let decrypted = decipher.update(data.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encryptApiKey(apiKey: string): string {
  return JSON.stringify(encrypt(apiKey));
}

export function decryptApiKey(encryptedJson: string): string {
  try {
    const data = JSON.parse(encryptedJson);
    return decrypt(data);
  } catch {
    return encryptedJson;
  }
}
