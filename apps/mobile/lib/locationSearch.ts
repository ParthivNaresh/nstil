import type { LocationData } from "@/lib/locationUtils";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const MAX_RESULTS = 3;
const USER_AGENT = "NStil/1.0";

export interface LocationSearchResult {
  readonly latitude: number;
  readonly longitude: number;
  readonly displayName: string;
  readonly subtitle: string;
}

interface NominatimResult {
  readonly lat: string;
  readonly lon: string;
  readonly display_name: string;
  readonly name?: string;
  readonly address?: NominatimAddress;
}

interface NominatimAddress {
  readonly road?: string;
  readonly house_number?: string;
  readonly neighbourhood?: string;
  readonly suburb?: string;
  readonly city?: string;
  readonly town?: string;
  readonly village?: string;
  readonly county?: string;
  readonly state?: string;
  readonly country?: string;
}

function formatResultName(result: NominatimResult): string {
  if (result.name) {
    return result.name;
  }

  const addr = result.address;
  if (!addr) {
    return result.display_name.split(",")[0].trim();
  }

  const parts: string[] = [];
  if (addr.house_number && addr.road) {
    parts.push(`${addr.house_number} ${addr.road}`);
  } else if (addr.road) {
    parts.push(addr.road);
  } else if (addr.neighbourhood) {
    parts.push(addr.neighbourhood);
  }

  const locality = addr.city ?? addr.town ?? addr.village;
  if (locality) {
    parts.push(locality);
  }

  return parts.length > 0 ? parts.join(", ") : result.display_name.split(",")[0].trim();
}

function formatResultSubtitle(result: NominatimResult): string {
  const addr = result.address;
  if (!addr) {
    const parts = result.display_name.split(",").slice(1, 3);
    return parts.map((p) => p.trim()).join(", ");
  }

  const parts: string[] = [];
  const locality = addr.city ?? addr.town ?? addr.village;

  if (result.name && locality) {
    parts.push(locality);
  }

  if (addr.state) {
    parts.push(addr.state);
  }

  if (addr.country) {
    parts.push(addr.country);
  }

  return parts.join(", ");
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    limit: String(MAX_RESULTS),
    dedupe: "1",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as NominatimResult[];

  return data.map((result) => ({
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    displayName: formatResultName(result),
    subtitle: formatResultSubtitle(result),
  }));
}

export function searchResultToLocationData(result: LocationSearchResult): LocationData {
  const fullName = result.subtitle
    ? `${result.displayName}, ${result.subtitle}`
    : result.displayName;

  return {
    latitude: result.latitude,
    longitude: result.longitude,
    displayName: fullName,
  };
}
