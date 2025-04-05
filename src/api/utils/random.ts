import { randomBytes } from "crypto";
import cryptoRandomString from "crypto-random-string";

const API_KEY_PREFIX = "ck_";
const API_KEY_BYTES = 32;

export function generateApiKey(prefix: string = API_KEY_PREFIX): string {
  const key = randomBytes(API_KEY_BYTES).toString("hex");
  return `${prefix}${key}`;
}

export function generateRandomAlphabetString(length: number = 24): string {
  return cryptoRandomString({
    characters: "abcdefghijklmnopqrstuvwxyz",
    length,
  });
}
