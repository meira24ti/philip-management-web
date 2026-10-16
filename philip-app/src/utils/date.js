export function formatListingDate(value) {
  if (!value) return "Belum diisi";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "Tanggal tidak valid";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
