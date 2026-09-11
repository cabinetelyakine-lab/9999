// Utility to format and normalize any Google Maps URL, coordinates, or search query into a reliable navigation URL that drops the Red Pin in Google Maps
export function normalizeMapsUrl(
  input: string | undefined,
  fallbackQuery?: { name: string; address?: string; commune?: string }
): string {
  if (input && input.trim()) {
    const raw = input.trim();

    // Check if it's pure decimal coordinates like "35.201234, -0.634567" or "35.201234 -0.634567"
    const coordMatch = raw.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[3];
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    // Check if coordinates embedded in url e.g. @35.201234,-0.634567 or q=35.201234,-0.634567 or ll=35.201234,-0.634567
    const embeddedCoord =
      raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      raw.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (embeddedCoord) {
      const lat = embeddedCoord[1];
      const lng = embeddedCoord[2];
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    // If it's already a full web URL (maps.app.goo.gl, goo.gl/maps, google.com/maps, etc.)
    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    // If it's a domain without protocol e.g. maps.app.goo.gl/xxx
    if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(raw)) {
      return `https://${raw}`;
    }

    // Fallback: search query with input string
    return `https://www.google.com/maps?q=${encodeURIComponent(raw)}`;
  }

  // Fallback using center metadata
  if (fallbackQuery) {
    const parts = [
      fallbackQuery.name,
      fallbackQuery.address,
      fallbackQuery.commune,
      'الجزائر',
    ].filter(Boolean);
    return `https://www.google.com/maps?q=${encodeURIComponent(parts.join(', '))}`;
  }

  return 'https://www.google.com/maps';
}

/**
 * Generates a clean Google Maps embed URL suitable for direct in-app iframe preview
 */
export function getMapEmbedUrl(
  input: string | undefined,
  fallbackQuery?: { name: string; address?: string; commune?: string }
): string {
  const coords = extractCoordinates(input);
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&hl=ar&z=16&output=embed`;
  }
  if (input && input.trim()) {
    const raw = input.trim();
    const coordMatch = raw.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[3]}&hl=ar&z=16&output=embed`;
    }
    // If it's a URL that contains coordinates
    const embeddedCoord =
      raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      raw.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (embeddedCoord) {
      return `https://maps.google.com/maps?q=${embeddedCoord[1]},${embeddedCoord[2]}&hl=ar&z=16&output=embed`;
    }
  }

  const parts = [
    fallbackQuery?.name,
    fallbackQuery?.address,
    fallbackQuery?.commune,
    'الجزائر',
  ].filter(Boolean);
  const query = parts.length > 0 ? parts.join(', ') : 'الجزائر';
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=ar&z=16&output=embed`;
}

/**
 * Extract numerical coordinates if present in a text or URL
 */
export function extractCoordinates(input: string | undefined): { lat: number; lng: number } | null {
  if (!input) return null;
  const str = input.trim();

  // Pure coords e.g. "35.201234, -0.634567"
  const directMatch = str.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Embedded in URL: @35.201234,-0.634567 or ?q=35.201234,-0.634567 or &ll=35.201234,-0.634567
  const urlMatch =
    str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    str.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lng = parseFloat(urlMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Any floating pair anywhere in the string
  const generalMatch = str.match(/(-?\d+\.\d{3,})[,\s]+(-?\d+\.\d{3,})/);
  if (generalMatch) {
    const lat = parseFloat(generalMatch[1]);
    const lng = parseFloat(generalMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return null;
}
