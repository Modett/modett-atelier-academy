import type { IncomingHttpHeaders } from 'node:http';
import { resolveRequestRegion } from './region.resolver';
import type { RegionResolverConfig } from './region.resolver';

const SECRET = '0123456789abcdef';

function config(overrides: Partial<RegionResolverConfig> = {}): RegionResolverConfig {
  return {
    devCountryOverride: undefined,
    originSecret: undefined,
    originSecretHeader: 'x-cf-origin-secret',
    ...overrides,
  };
}

describe('resolveRequestRegion', () => {
  it('uses cf-ipcountry when the configured secret header matches', () => {
    const headers: IncomingHttpHeaders = {
      'cf-ipcountry': 'LK',
      'x-cf-origin-secret': SECRET,
    };

    expect(resolveRequestRegion(headers, config({ originSecret: SECRET }))).toEqual({
      country: 'LK',
      region: 'LK',
      currency: 'LKR',
    });
  });

  it('ignores cf-ipcountry when the secret does not match', () => {
    const headers: IncomingHttpHeaders = {
      'cf-ipcountry': 'LK',
      'x-cf-origin-secret': 'ffffffffffffffff',
    };

    expect(resolveRequestRegion(headers, config({ originSecret: SECRET }))).toEqual({
      country: null,
      region: 'ROW',
      currency: 'USD',
    });
  });

  it('ignores cf-ipcountry when the secret header is missing', () => {
    const headers: IncomingHttpHeaders = { 'cf-ipcountry': 'LK' };

    expect(resolveRequestRegion(headers, config({ originSecret: SECRET }))).toEqual({
      country: null,
      region: 'ROW',
      currency: 'USD',
    });
  });

  it('uses cf-ipcountry as sent when no secret is configured', () => {
    const headers: IncomingHttpHeaders = { 'cf-ipcountry': 'DE' };

    expect(resolveRequestRegion(headers, config())).toEqual({
      country: 'DE',
      region: 'EU',
      currency: 'EUR',
    });
  });

  it('prefers DEV_COUNTRY_OVERRIDE over the request headers', () => {
    const headers: IncomingHttpHeaders = {
      'cf-ipcountry': 'US',
      'x-cf-origin-secret': SECRET,
    };

    expect(
      resolveRequestRegion(headers, config({ devCountryOverride: 'SG', originSecret: SECRET })),
    ).toEqual({
      country: 'SG',
      region: 'SG',
      currency: 'SGD',
    });
  });

  it('does not throw when the provided secret length differs', () => {
    const headers: IncomingHttpHeaders = {
      'cf-ipcountry': 'LK',
      'x-cf-origin-secret': 'short',
    };
    const trust = config({ originSecret: SECRET });

    expect(() => resolveRequestRegion(headers, trust)).not.toThrow();
    expect(resolveRequestRegion(headers, trust)).toEqual({
      country: null,
      region: 'ROW',
      currency: 'USD',
    });
  });
});
