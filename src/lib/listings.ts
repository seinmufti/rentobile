export type Currency = 'USD' | 'IQD';
export const CURRENCIES: Currency[] = ['USD', 'IQD'];

/** A car listing. Every field except id/createdAt is optional. */
export type Listing = {
  id: string;
  createdAt: string;
  title?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  pricePerDay?: number;
  currency?: Currency;
  location?: string;
  /** ISO date strings (YYYY-MM-DD). */
  availableFrom?: string;
  availableTo?: string;
  /** Storage paths in the listing-photos bucket (or full URLs). */
  photos: string[];
  description?: string;
  phone?: string;
  isPublished: boolean;
};

export type ListingInput = Omit<Listing, 'id' | 'createdAt'>;

/** Row shape of public.listings. */
export type ListingRow = {
  id: string;
  created_at: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  price_per_day: number | string | null;
  currency: Currency | null;
  location: string | null;
  available_from: string | null;
  available_to: string | null;
  photos: string[] | null;
  description: string | null;
  phone: string | null;
  is_published: boolean;
};

const opt = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

export function fromRow(r: ListingRow): Listing {
  return {
    id: r.id,
    createdAt: r.created_at,
    title: opt(r.title),
    brand: opt(r.brand),
    model: opt(r.model),
    year: opt(r.year),
    color: opt(r.color),
    pricePerDay: r.price_per_day === null ? undefined : Number(r.price_per_day),
    currency: opt(r.currency),
    location: opt(r.location),
    availableFrom: opt(r.available_from),
    availableTo: opt(r.available_to),
    photos: r.photos ?? [],
    description: opt(r.description),
    phone: opt(r.phone),
    isPublished: r.is_published,
  };
}

export function toRow(l: Partial<ListingInput>) {
  const row: Record<string, unknown> = {};
  const put = (key: string, v: unknown) => {
    if (v !== undefined) row[key] = v;
  };
  // Explicit nulls clear a field when editing.
  const nul = <T>(v: T | undefined) => (v === undefined ? null : v);
  if ('title' in l) put('title', nul(l.title));
  if ('brand' in l) put('brand', nul(l.brand));
  if ('model' in l) put('model', nul(l.model));
  if ('year' in l) put('year', nul(l.year));
  if ('color' in l) put('color', nul(l.color));
  if ('pricePerDay' in l) put('price_per_day', nul(l.pricePerDay));
  if ('currency' in l) put('currency', nul(l.currency));
  if ('location' in l) put('location', nul(l.location));
  if ('availableFrom' in l) put('available_from', nul(l.availableFrom));
  if ('availableTo' in l) put('available_to', nul(l.availableTo));
  if ('photos' in l) put('photos', l.photos ?? []);
  if ('description' in l) put('description', nul(l.description));
  if ('phone' in l) put('phone', nul(l.phone));
  if ('isPublished' in l) put('is_published', l.isPublished);
  return row;
}

/** Best display name for a listing, falling back through optional fields. */
export function listingName(l: Pick<Listing, 'title' | 'brand' | 'model'>): string | undefined {
  return l.title?.trim() || [l.brand, l.model].filter(Boolean).join(' ').trim() || undefined;
}

export function formatPrice(amount: number, currency: Currency = 'USD', locale = 'en-US') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'IQD' ? 0 : 2,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatDate(iso: string, locale = 'en-US') {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Whatsapp link for a phone number, assuming Iraqi numbers when no country code is given. */
export function whatsappUrl(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `964${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}
