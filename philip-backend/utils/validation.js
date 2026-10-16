function badRequest(message) { return Object.assign(new Error(message), { statusCode: 400 }); }
function text(value, label, { required = false, max = 255, min = 0 } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest(`${label} wajib diisi`);
    return "";
  }
  if (typeof value !== "string" || (required && !value.trim()) || value.trim().length < min || value.trim().length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw badRequest(`${label} tidak valid (maksimal ${max} karakter)`);
  return value.trim();
}
function email(value) {
  const result = text(value, "Email", { required: true, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw badRequest("Alamat email tidak valid");
  return result;
}
function password(value, label = "Password") {
  if (typeof value !== "string" || value.length < 8 || Buffer.byteLength(value, "utf8") > 72) throw badRequest(`${label} minimal 8 karakter dan maksimal 72 byte`);
  return value;
}
function date(value, label = "Tanggal") {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw badRequest(`${label} tidak valid`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw badRequest(`${label} tidak valid`);
  return value;
}
function number(value, label, { min = 0, max = 9999999999999.99, integer = false, required = false } = {}) {
  if (value === "" || value === undefined || value === null) {
    if (required) throw badRequest(`${label} wajib diisi`);
    return null;
  }
  if (!["number", "string"].includes(typeof value) || (typeof value === "string" && !/^-?\d+(\.\d+)?$/.test(value)) || !Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max || (integer && !Number.isInteger(Number(value)))) throw badRequest(`${label} tidak valid`);
  return Number(value);
}
function mapUrl(value) {
  if (!value) return "";
  const raw = text(value, "Link Google Maps", { max: 2000 });
  let url;
  try { url = new URL(raw); } catch { throw badRequest("Link Google Maps harus berupa URL HTTPS yang valid"); }
  const allowed = ["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"];
  if (url.protocol !== "https:" || !allowed.includes(url.hostname) || url.username || url.password) throw badRequest("Gunakan tautan HTTPS Google Maps");
  return url.href;
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
module.exports = { badRequest, text, email, password, date, number, mapUrl, escapeHtml };
