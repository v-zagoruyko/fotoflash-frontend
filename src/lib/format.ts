/** "3000.00" → "3 000 ₽". Money stays a string end to end, no float math. */
export function formatMoney(value: string) {
  const [int, frac] = value.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const kopecks = frac && Number(frac) !== 0 ? `,${frac}` : "";
  return `${grouped}${kopecks} ₽`;
}

/** "09:00:00" → "09:00" */
export function formatTime(value: string) {
  return value.slice(0, 5);
}
