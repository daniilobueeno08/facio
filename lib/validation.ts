export function normalizePhone(value: string) {
  return value?.toString().replace(/\D/g, "") ?? "";
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value ?? "");
}

export function isValidWhatsapp(value: string) {
  const digits = normalizePhone(value);
  return digits.length >= 10 && digits.length <= 11;
}
