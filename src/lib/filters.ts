import { listingName, type Currency, type Listing } from './listings';

export type Sort = 'newest' | 'priceLow' | 'priceHigh';

export type Filters = {
  sort: Sort;
  /** Price range applies to listings priced in this currency. */
  currency: Currency;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  brand?: string;
  yearFrom?: number;
};

export const DEFAULT_FILTERS: Filters = { sort: 'newest', currency: 'USD' };

/** Rough rate, only used to sort USD and IQD prices together. */
const IQD_PER_USD = 1310;

function priceInUsd(l: Listing) {
  if (l.pricePerDay == null) return undefined;
  return l.currency === 'IQD' ? l.pricePerDay / IQD_PER_USD : l.pricePerDay;
}

/** City is the part before the first comma, e.g. "Erbil, Ankawa" → "Erbil". */
export function cityOf(l: Listing) {
  return l.location?.split(/[,،]/)[0]?.trim() || undefined;
}

export function activeFilterCount(f: Filters) {
  return [f.minPrice != null || f.maxPrice != null, f.city, f.brand, f.yearFrom, f.sort !== 'newest'].filter(Boolean)
    .length;
}

export function applyFilters(listings: Listing[], f: Filters, query: string) {
  const q = query.trim().toLowerCase();
  const out = listings.filter((l) => {
    if (q) {
      const hay = [listingName(l), l.brand, l.model, l.location, l.color, l.year?.toString()]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.city && cityOf(l)?.toLowerCase() !== f.city.toLowerCase()) return false;
    if (f.brand && l.brand?.toLowerCase() !== f.brand.toLowerCase()) return false;
    if (f.yearFrom && (l.year == null || l.year < f.yearFrom)) return false;
    if (f.minPrice != null || f.maxPrice != null) {
      if (l.pricePerDay == null || (l.currency ?? 'USD') !== f.currency) return false;
      if (f.minPrice != null && l.pricePerDay < f.minPrice) return false;
      if (f.maxPrice != null && l.pricePerDay > f.maxPrice) return false;
    }
    return true;
  });

  if (f.sort !== 'newest') {
    const dir = f.sort === 'priceLow' ? 1 : -1;
    out.sort((a, b) => {
      const pa = priceInUsd(a);
      const pb = priceInUsd(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1; // unpriced last
      if (pb == null) return -1;
      return (pa - pb) * dir;
    });
  }
  return out;
}

/** Distinct, sorted values for filter chips. */
export function distinct(values: (string | undefined)[]) {
  const map = new Map<string, string>();
  for (const v of values) if (v) map.set(v.toLowerCase(), map.get(v.toLowerCase()) ?? v);
  return [...map.values()].sort((a, b) => a.localeCompare(b));
}
