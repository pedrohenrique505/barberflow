export const CUSTOMER_PHONE_VALIDATION_MESSAGE =
  "Informe um telefone válido com DDD.";

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidCustomerPhone(phone: string): boolean {
  const normalizedPhone = normalizePhone(phone);

  return /^\d{2}9\d{8}$/.test(normalizedPhone);
}
