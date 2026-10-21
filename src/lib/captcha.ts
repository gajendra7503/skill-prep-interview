import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

const CAPTCHA_LIFETIME_MS = 10 * 60 * 1000;

export type Captcha = { token: string; image: string };

const globalForCaptcha = globalThis as typeof globalThis & {
  captchaSecret?: Buffer;
  usedCaptchaNonces?: Map<string, number>;
};

// Set CAPTCHA_SECRET to keep challenges valid across restarts and multiple server instances.
const secret = (globalForCaptcha.captchaSecret ??= process.env.CAPTCHA_SECRET
  ? Buffer.from(process.env.CAPTCHA_SECRET)
  : randomBytes(32));
const usedNonces = (globalForCaptcha.usedCaptchaNonces ??= new Map());

function sign(expiresAt: number, nonce: string, answer: number) {
  return createHmac("sha256", secret).update(`${expiresAt}.${nonce}.${answer}`).digest("base64url");
}

// Seven-segment strokes in a 20x36 box: a b c d e f g.
const SEGMENTS: Record<string, [number, number, number, number]> = {
  a: [0, 0, 20, 0],
  b: [20, 0, 20, 18],
  c: [20, 18, 20, 36],
  d: [0, 36, 20, 36],
  e: [0, 18, 0, 36],
  f: [0, 0, 0, 18],
  g: [0, 18, 20, 18],
};
const GLYPHS: Record<string, [number, number, number, number][]> = {
  ...Object.fromEntries(
    ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"].map(
      (segments, digit) => [String(digit), [...segments].map((segment) => SEGMENTS[segment])]
    )
  ),
  "+": [
    [0, 18, 20, 18],
    [10, 8, 10, 28],
  ],
  "-": [[0, 18, 20, 18]],
};
const COLORS = ["#4338ca", "#6d28d9", "#0f766e", "#b45309", "#be123c", "#1d4ed8"];

const jitter = (amount: number) => randomInt(-amount * 10, amount * 10 + 1) / 10;
const pick = <T>(items: T[]) => items[randomInt(items.length)];

function renderImage(text: string) {
  const width = 180;
  const height = 60;
  const parts: string[] = [`<rect width="${width}" height="${height}" rx="8" fill="#f4f4f5"/>`];

  for (let i = 0; i < 6; i++) {
    parts.push(
      `<path d="M${randomInt(width)} ${randomInt(height)} Q${randomInt(width)} ${randomInt(height)} ${randomInt(width)} ${randomInt(height)}" stroke="${pick(COLORS)}" stroke-opacity="0.35" stroke-width="1.5" fill="none"/>`
    );
  }

  const step = 32;
  let x = (width - text.length * step) / 2 + 6;
  for (const char of text) {
    const strokes = GLYPHS[char]
      .map(([x1, y1, x2, y2]) => `M${x1 + jitter(2)} ${y1 + jitter(2)}L${x2 + jitter(2)} ${y2 + jitter(2)}`)
      .join("");
    const y = 12 + jitter(4);
    parts.push(
      `<path transform="translate(${x + jitter(2)} ${y}) rotate(${jitter(14)} 10 18)" d="${strokes}" stroke="${pick(COLORS)}" stroke-width="3.5" stroke-linecap="round" fill="none"/>`
    );
    x += step;
  }

  for (let i = 0; i < 30; i++) {
    parts.push(`<circle cx="${randomInt(width)}" cy="${randomInt(height)}" r="1.2" fill="${pick(COLORS)}" fill-opacity="0.5"/>`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${parts.join("")}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Creates a small arithmetic challenge. The answer lives only inside the signed token. */
export function createCaptcha(): Captcha {
  const add = randomInt(2) === 0;
  const a = randomInt(add ? 1 : 5, 10);
  const b = randomInt(1, add ? 10 : a);
  const answer = add ? a + b : a - b;
  const expiresAt = Date.now() + CAPTCHA_LIFETIME_MS;
  const nonce = randomBytes(12).toString("base64url");

  return {
    token: `${expiresAt}.${nonce}.${sign(expiresAt, nonce, answer)}`,
    image: renderImage(`${a}${add ? "+" : "-"}${b}`),
  };
}

/** Checks an answer. Each challenge can be attempted only once, whether or not it is solved. */
export function verifyCaptcha(token: FormDataEntryValue | null, answer: FormDataEntryValue | null) {
  if (typeof token !== "string" || typeof answer !== "string") return false;
  const [expiresAtText, nonce, signature] = token.split(".");
  const expiresAt = Number(expiresAtText);
  const now = Date.now();
  if (!nonce || !signature || !Number.isSafeInteger(expiresAt) || expiresAt < now) return false;

  for (const [usedNonce, usedExpiry] of usedNonces) {
    if (usedExpiry < now) usedNonces.delete(usedNonce);
  }
  if (usedNonces.has(nonce)) return false;
  usedNonces.set(nonce, expiresAt);

  const trimmed = answer.trim();
  if (!/^\d{1,2}$/.test(trimmed)) return false;
  const expected = Buffer.from(sign(expiresAt, nonce, Number(trimmed)));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
