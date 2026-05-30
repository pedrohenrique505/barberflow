export const PHONE_VALIDATION_MESSAGE = "Informe um telefone válido com DDD.";

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function formatPhone(phone: string): string {
  const digits = normalizePhone(phone).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  if (digits.length <= 3) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(
    3,
    7,
  )}-${digits.slice(7)}`;
}

export function isValidPhone(phone: string): boolean {
  return /^\d{2}9\d{8}$/.test(normalizePhone(phone));
}

export function formatPhoneSearch(value: string): string {
  return normalizePhone(value) && !/[A-Za-zÀ-ÿ]/.test(value)
    ? formatPhone(value)
    : value;
}
