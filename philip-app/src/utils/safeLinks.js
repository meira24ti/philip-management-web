export function googleMapsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl'].includes(url.hostname) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
