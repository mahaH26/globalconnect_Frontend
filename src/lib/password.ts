// Characters without look-alikes (no 0/O, 1/l/I) so a password is easy to read out loud
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(length = 10): string {
  const out: string[] = [];
  const c: any = (globalThis as any).crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(length);
    c.getRandomValues(buf);
    for (let i = 0; i < length; i++) out.push(CHARS[buf[i] % CHARS.length]);
  } else {
    for (let i = 0; i < length; i++) out.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
  }
  return out.join("");
}