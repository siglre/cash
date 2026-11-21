/** 70000 -> "70 000 ₽" (неразрывные пробелы, без копеек) */
export function formatMoney(n: number, withSign = false): string {
  const v = Math.round(Math.abs(n));
  const s = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = n < 0 ? '−' : withSign && n > 0 ? '+' : '';
  return `${sign}${s} ₽`;
}
