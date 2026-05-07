/**
 * Formats any raw order ID into canonical display format "#ORD-001".
 * Handles: "order-001", "rder-001", "ord-5", null, undefined, 1
 */
export function formatOrderId(id: string | number | null | undefined): string {
  if (!id) return '#---';
  const raw = id.toString();
  const digits = raw.replace(/[^0-9]/g, '');
  const num = digits ? parseInt(digits, 10) : NaN;
  if (isNaN(num)) return `#${raw}`;
  return `#ORD-${String(num).padStart(3, '0')}`;
}
