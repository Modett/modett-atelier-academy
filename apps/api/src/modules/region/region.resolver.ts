import { timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';
import { resolveRegion } from '@modett/shared';
import type { ResolvedRegion } from '@modett/shared';

const CF_IP_COUNTRY_HEADER = 'cf-ipcountry';

export type RegionResolverConfig = {
  devCountryOverride: string | undefined;
  originSecret: string | undefined;
  originSecretHeader: string;
};

export function resolveRequestRegion(
  headers: IncomingHttpHeaders,
  config: RegionResolverConfig,
): ResolvedRegion {
  if (config.devCountryOverride !== undefined && config.devCountryOverride.length > 0) {
    return resolveRegion(config.devCountryOverride);
  }

  const country = readHeader(headers, CF_IP_COUNTRY_HEADER);
  if (config.originSecret === undefined || config.originSecret.length === 0) {
    return resolveRegion(country);
  }

  const provided = readHeader(headers, config.originSecretHeader);
  if (provided !== undefined && secretsMatch(config.originSecret, provided)) {
    return resolveRegion(country);
  }

  return resolveRegion(null);
}

function readHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name.toLowerCase()];
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return undefined;
}

function secretsMatch(expected: string, provided: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  // timingSafeEqual throws when the buffers differ in length, so compare equal-sized copies.
  const length = Math.max(expectedBytes.length, providedBytes.length, 1);
  const paddedExpected = Buffer.alloc(length);
  const paddedProvided = Buffer.alloc(length);
  expectedBytes.copy(paddedExpected);
  providedBytes.copy(paddedProvided);
  const bytesMatch = timingSafeEqual(paddedExpected, paddedProvided);
  return bytesMatch && expectedBytes.length === providedBytes.length;
}
