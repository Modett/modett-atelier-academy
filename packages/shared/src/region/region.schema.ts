import { z } from 'zod';
import { Currency, Region } from './region';

export const currencySchema = z.enum(Currency);
export type CurrencySchema = z.infer<typeof currencySchema>;

export const regionSchema = z.enum(Region);
export type RegionSchema = z.infer<typeof regionSchema>;

export const resolvedRegionSchema = z.object({
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  region: regionSchema,
  currency: currencySchema,
});

export type ResolvedRegionSchema = z.infer<typeof resolvedRegionSchema>;
