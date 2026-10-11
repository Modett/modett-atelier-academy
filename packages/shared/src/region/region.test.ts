import { EU_COUNTRY_CODES, resolveRegion } from './region';

const EU_27 = [
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
] as const;

const EEA_EXTRAS = ['IS', 'LI', 'NO'] as const;
const ALSO_EUROPE = ['CH', 'GB'] as const;

describe('resolveRegion', () => {
  it('maps Singapore to SG and SGD', () => {
    expect(resolveRegion('SG')).toEqual({ country: 'SG', region: 'SG', currency: 'SGD' });
  });

  it('maps Sri Lanka to LK and LKR', () => {
    expect(resolveRegion('LK')).toEqual({ country: 'LK', region: 'LK', currency: 'LKR' });
  });

  it.each(EU_27)('maps EU-27 country %s to EU and EUR', (country) => {
    expect(resolveRegion(country)).toEqual({ country, region: 'EU', currency: 'EUR' });
  });

  it.each([...EEA_EXTRAS, ...ALSO_EUROPE])('maps %s to EU and EUR', (country) => {
    expect(resolveRegion(country)).toEqual({ country, region: 'EU', currency: 'EUR' });
  });

  it.each(['US', 'IN', 'AU', 'JP'])('maps %s to ROW and USD', (country) => {
    expect(resolveRegion(country)).toEqual({ country, region: 'ROW', currency: 'USD' });
  });

  it('normalises a lowercase country code', () => {
    expect(resolveRegion('lk')).toEqual({ country: 'LK', region: 'LK', currency: 'LKR' });
  });

  it.each([null, undefined, '', 'XX', 'T1', 'SGP', 'S1'])(
    'treats %p as an unknown country',
    (country) => {
      expect(resolveRegion(country)).toEqual({ country: null, region: 'ROW', currency: 'USD' });
    },
  );
});

describe('EU_COUNTRY_CODES', () => {
  it('lists each Europe country once, as two uppercase letters', () => {
    expect(EU_27).toHaveLength(27);
    expect(EEA_EXTRAS).toHaveLength(3);
    expect(ALSO_EUROPE).toEqual(['CH', 'GB']);

    const expected = [...EU_27, ...EEA_EXTRAS, ...ALSO_EUROPE];
    expect(expected).toHaveLength(32);
    expect(new Set(EU_COUNTRY_CODES).size).toBe(EU_COUNTRY_CODES.length);
    expect([...EU_COUNTRY_CODES].sort()).toEqual([...expected].sort());

    for (const code of EU_COUNTRY_CODES) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });
});
