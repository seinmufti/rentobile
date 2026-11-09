// Seeds the 10 sample cars: uploads assets/cars/*.jpg to the listing-photos bucket
// and inserts the listings. Safe to re-run: skips when sample listings already exist.
//
// Usage: node --env-file=.env.local scripts/seed.mjs
// Needs EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (never commit or ship the service key).

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const CARS = [
  { photo: 'corolla', title: 'Toyota Corolla Hybrid', brand: 'Toyota', model: 'Corolla', year: 2020, color: 'White', price_per_day: 40, currency: 'USD', location: 'Erbil, 100m Road', description: 'Very fuel efficient, perfect for city driving. Clean and non-smoking.', phone: '07501234567' },
  { photo: 'camry', brand: 'Toyota', model: 'Camry', year: 2018, color: 'Silver', price_per_day: 55000, currency: 'IQD', location: 'Sulaymaniyah, Salim Street', description: 'Comfortable sedan for long trips. Full insurance included.', phone: '07701234567' },
  { photo: 'yaris', title: 'Toyota Yaris – small & cheap', brand: 'Toyota', model: 'Yaris', year: 2020, color: 'Red', price_per_day: 30, currency: 'USD', location: 'Duhok', available_from: '2026-11-10', available_to: '2026-12-31' },
  { photo: 'elantra', brand: 'Hyundai', model: 'Elantra', year: 2023, color: 'Silver', price_per_day: 50000, currency: 'IQD', location: 'Erbil, Ankawa', phone: '07504567890' },
  { photo: 'tucson', title: 'Hyundai Tucson family SUV', brand: 'Hyundai', model: 'Tucson', year: 2022, color: 'Grey', price_per_day: 65, currency: 'USD', location: 'Erbil, Dream City', description: 'Spacious SUV with a big trunk. Great for family trips to the mountains.' },
  { photo: 'sonata', brand: 'Hyundai', model: 'Sonata', year: 2024, color: 'White', price_per_day: 75000, currency: 'IQD', location: 'Kirkuk', phone: '07709876543' },
  { photo: 'sportage', brand: 'Kia', model: 'Sportage', year: 2025, color: 'White', price_per_day: 70, currency: 'USD', location: 'Sulaymaniyah, Bakrajo', available_from: '2026-11-15', description: 'Almost new. Minimum rental 3 days.' },
  { photo: 'rio', title: 'Kia Rio – easy to park', brand: 'Kia', model: 'Rio', year: 2021, color: 'Grey', price_per_day: 35000, currency: 'IQD', location: 'Zakho' },
  { photo: 'cerato', brand: 'Kia', model: 'Cerato', year: 2019, color: 'Red', price_per_day: 35, currency: 'USD', location: 'Erbil, Iskan', phone: '07512223344' },
  { photo: 'cruze', brand: 'Chevrolet', model: 'Cruze', year: 2017, color: 'Blue', price_per_day: 40000, currency: 'IQD', location: 'Halabja', description: 'Reliable daily car, automatic gearbox, A/C works great.' },
];

const { count, error: countError } = await db
  .from('listings')
  .select('*', { count: 'exact', head: true })
  .contains('photos', ['samples/corolla.jpg']);
if (countError) throw countError;
if (count) {
  console.log(`Sample listings already exist (${count}). Nothing to do.`);
  process.exit(0);
}

const day = 24 * 60 * 60 * 1000;
for (const [i, { photo, ...car }] of CARS.entries()) {
  const path = `samples/${photo}.jpg`;
  const file = await readFile(new URL(`../assets/cars/${photo}.jpg`, import.meta.url));
  const up = await db.storage.from('listing-photos').upload(path, file, { contentType: 'image/jpeg', upsert: true });
  if (up.error) throw up.error;
  // Older entries get older timestamps so the list keeps this order.
  const created_at = new Date(Date.now() - (i + 1) * day).toISOString();
  const ins = await db.from('listings').insert({ ...car, photos: [path], created_at, created_by: null });
  if (ins.error) throw ins.error;
  console.log(`✓ ${car.title ?? `${car.brand} ${car.model}`}`);
}
console.log('Done.');
