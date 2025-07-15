export function safeNumberInputValue(value: unknown): string {
  return value != null && !isNaN(Number(value)) ? String(value) : "";
}