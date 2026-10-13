type Forms = [one: string, few: string, many: string];

/** Russian plural form for a count: plural(1, ["зал","зала","залов"]) → "зал". */
export function plural(n: number, forms: Forms) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

/** "11 залов", "21 зал", "2 зала". */
export function formatCount(n: number, forms: Forms) {
  return `${n} ${plural(n, forms)}`;
}
