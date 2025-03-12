import cryptoRandomString from "crypto-random-string";

export function generateRandomAlphabetString(length: number = 24): string {
  return cryptoRandomString({
    characters: "abcdefghijklmnopqrstuvwxyz",
    length,
  });
}
