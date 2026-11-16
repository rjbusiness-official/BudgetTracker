/** Keep two whole-number digits, plus centavos only when non-zero. */
export function maskAmount(value: number, formatted?: string) {
  const safe = Number.isFinite(value) ? value : 0;
  const hasCents = Math.abs(Math.round(safe * 100)) % 100 !== 0;
  const text = formatted ?? new Intl.NumberFormat("en-PH", { minimumFractionDigits: hasCents ? 2 : 0, maximumFractionDigits: 2 }).format(safe);
  // Currency formatters add .00 even to whole amounts; omit that suffix when hidden.
  const display = hasCents ? text : text.replace(/\.00(?!\d)/, "");
  let remaining = hasCents ? 4 : 2;
  return display.split("").reverse().map(character => {
    if (!/\d/.test(character)) return character;
    return remaining-- > 0 ? character : "*";
  }).reverse().join("");
}

export async function authorizeAmountVisibility(verify: (password: string) => Promise<void>, password: string, apply: () => void) {
  if (!password) throw new Error("Enter your account login password.");
  await verify(password);
  apply();
}
