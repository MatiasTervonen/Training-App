import {
  digest,
  getRandomValues,
  CryptoDigestAlgorithm,
} from "expo-crypto";

const crypto = (globalThis.crypto ??= {} as Crypto);

if (typeof crypto.getRandomValues !== "function") {
  Object.defineProperty(crypto, "getRandomValues", { value: getRandomValues });
}

if (typeof crypto.subtle?.digest !== "function") {
  Object.defineProperty(crypto, "subtle", {
    value: {
      digest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> {
        return digest(algorithm as CryptoDigestAlgorithm, data);
      },
    },
  });
}
