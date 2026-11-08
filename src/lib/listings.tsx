import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSource } from 'expo-image';
import * as React from 'react';

export type Currency = 'USD' | 'IQD';
export const CURRENCIES: Currency[] = ['USD', 'IQD'];

/** Every field except id/createdAt is optional. */
export type Listing = {
  id: string;
  createdAt: number;
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
  /** Remote/local URIs, or bundled assets (require) for sample listings. */
  photos?: PhotoSource[];
  description?: string;
  phone?: string;
};

/** A URI string, or a bundled asset from require() (a number on native, an object on web). */
export type PhotoSource = string | number | ImageSource;

export type NewListing = Omit<Listing, 'id' | 'createdAt'>;

const STORAGE_KEY = 'rentobile.listings.v1';
/** Key used before the app was renamed from BaKre; read once as a fallback. */
const LEGACY_STORAGE_KEY = 'bakre.listings.v1';
const SEED_PREFIX = 'seed-';

const day = 24 * 60 * 60 * 1000;

/** Sample everyday cars. Photos are bundled; see assets/cars/CREDITS.md. Never persisted. */
const SEED: Listing[] = [
  {
    title: 'Toyota Corolla Hybrid',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    color: 'White',
    pricePerDay: 40,
    currency: 'USD',
    location: 'Erbil, 100m Road',
    photos: [require('../../assets/cars/corolla.jpg')],
    description: 'Very fuel efficient, perfect for city driving. Clean and non-smoking.',
    phone: '07501234567',
  },
  {
    brand: 'Toyota',
    model: 'Camry',
    year: 2018,
    color: 'Silver',
    pricePerDay: 55000,
    currency: 'IQD',
    location: 'Sulaymaniyah, Salim Street',
    photos: [require('../../assets/cars/camry.jpg')],
    description: 'Comfortable sedan for long trips. Full insurance included.',
    phone: '07701234567',
  },
  {
    title: 'Toyota Yaris – small & cheap',
    brand: 'Toyota',
    model: 'Yaris',
    year: 2020,
    color: 'Red',
    pricePerDay: 30,
    currency: 'USD',
    location: 'Duhok',
    availableFrom: '2026-11-10',
    availableTo: '2026-12-31',
    photos: [require('../../assets/cars/yaris.jpg')],
  },
  {
    brand: 'Hyundai',
    model: 'Elantra',
    year: 2023,
    color: 'Silver',
    pricePerDay: 50000,
    currency: 'IQD',
    location: 'Erbil, Ankawa',
    photos: [require('../../assets/cars/elantra.jpg')],
    phone: '07504567890',
  },
  {
    title: 'Hyundai Tucson family SUV',
    brand: 'Hyundai',
    model: 'Tucson',
    year: 2022,
    color: 'Grey',
    pricePerDay: 65,
    currency: 'USD',
    location: 'Erbil, Dream City',
    photos: [require('../../assets/cars/tucson.jpg')],
    description: 'Spacious SUV with a big trunk. Great for family trips to the mountains.',
  },
  {
    brand: 'Hyundai',
    model: 'Sonata',
    year: 2024,
    color: 'White',
    pricePerDay: 75000,
    currency: 'IQD',
    location: 'Kirkuk',
    photos: [require('../../assets/cars/sonata.jpg')],
    phone: '07709876543',
  },
  {
    brand: 'Kia',
    model: 'Sportage',
    year: 2025,
    color: 'White',
    pricePerDay: 70,
    currency: 'USD',
    location: 'Sulaymaniyah, Bakrajo',
    availableFrom: '2026-11-15',
    photos: [require('../../assets/cars/sportage.jpg')],
    description: 'Almost new. Minimum rental 3 days.',
  },
  {
    title: 'Kia Rio – easy to park',
    brand: 'Kia',
    model: 'Rio',
    year: 2021,
    color: 'Grey',
    pricePerDay: 35000,
    currency: 'IQD',
    location: 'Zakho',
    photos: [require('../../assets/cars/rio.jpg')],
  },
  {
    brand: 'Kia',
    model: 'Cerato',
    year: 2019,
    color: 'Red',
    pricePerDay: 35,
    currency: 'USD',
    location: 'Erbil, Iskan',
    photos: [require('../../assets/cars/cerato.jpg')],
    phone: '07512223344',
  },
  {
    brand: 'Chevrolet',
    model: 'Cruze',
    year: 2017,
    color: 'Blue',
    pricePerDay: 40000,
    currency: 'IQD',
    location: 'Halabja',
    photos: [require('../../assets/cars/cruze.jpg')],
    description: 'Reliable daily car, automatic gearbox, A/C works great.',
  },
].map((l, i) => ({ ...l, id: `${SEED_PREFIX}${i + 1}`, createdAt: Date.now() - (i + 1) * day }) as Listing);

const isSeed = (l: Listing) => l.id.startsWith(SEED_PREFIX);

type ListingsCtx = {
  listings: Listing[];
  ready: boolean;
  addListing: (data: NewListing) => Listing;
};

const ListingsContext = React.createContext<ListingsCtx | null>(null);

export function ListingsProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw ?? AsyncStorage.getItem(LEGACY_STORAGE_KEY))
      // Stored data only holds user listings; sample cars are always the current SEED.
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as Listing[]).filter((l) => !isSeed(l)) : [];
        setListings([...saved, ...SEED]);
      })
      .catch(() => setListings(SEED))
      .finally(() => setReady(true));
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    const own = listings.filter((l) => !isSeed(l));
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(own)).catch(() => {});
  }, [listings, ready]);

  const addListing = React.useCallback((data: NewListing) => {
    const listing: Listing = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    setListings((prev) => [listing, ...prev]);
    return listing;
  }, []);

  const value = React.useMemo(() => ({ listings, ready, addListing }), [listings, ready, addListing]);
  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings() {
  const ctx = React.useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used inside ListingsProvider');
  return ctx;
}

/** Best display name for a listing, falling back through optional fields. */
export function listingName(l: Listing): string | undefined {
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
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}
