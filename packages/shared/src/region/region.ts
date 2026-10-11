export const Region = {
  SG: 'SG',
  LK: 'LK',
  EU: 'EU',
  ROW: 'ROW',
} as const;

export type Region = (typeof Region)[keyof typeof Region];

export const Currency = {
  SGD: 'SGD',
  LKR: 'LKR',
  EUR: 'EUR',
  USD: 'USD',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const REGION_CURRENCY = {
  [Region.SG]: Currency.SGD,
  [Region.LK]: Currency.LKR,
  [Region.EU]: Currency.EUR,
  [Region.ROW]: Currency.USD,
} as const satisfies Record<Region, Currency>;

/** EU-27, then EEA members outside the EU, then CH and GB. */
export const EU_COUNTRY_CODES = [
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'IS',
  'LI',
  'NO',
  'CH',
  'GB',
] as const;

const EU_COUNTRIES: ReadonlySet<string> = new Set(EU_COUNTRY_CODES);

const COUNTRY_CODE = /^[A-Z]{2}$/;

/** Cloudflare uses XX when the country cannot be determined. */
const UNKNOWN_COUNTRY = 'XX';

export type ResolvedRegion = {
  country: string | null;
  region: Region;
  currency: Currency;
};

export function resolveRegion(country: string | null | undefined): ResolvedRegion {
  const normalised = normaliseCountry(country);
  const region = regionForCountry(normalised);
  return {
    country: normalised,
    region,
    currency: REGION_CURRENCY[region],
  };
}

function normaliseCountry(country: string | null | undefined): string | null {
  if (country === null || country === undefined) {
    return null;
  }

  const normalised = country.trim().toUpperCase();
  if (normalised === UNKNOWN_COUNTRY || !COUNTRY_CODE.test(normalised)) {
    return null;
  }

  return normalised;
}

function regionForCountry(country: string | null): Region {
  if (country === Region.SG) {
    return Region.SG;
  }
  if (country === Region.LK) {
    return Region.LK;
  }
  if (country !== null && EU_COUNTRIES.has(country)) {
    return Region.EU;
  }
  return Region.ROW;
}
