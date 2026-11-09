// Checks the database security rules against the live project using two throwaway test users.
// Usage: node --env-file=.env.local scripts/check-rls.mjs
// Test users are created with the service key and deleted at the end.

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const results = [];
const check = (name, ok) => {
  results.push(ok);
  console.log(`${ok ? '✓' : '✗'} ${name}`);
};

async function makeUser(name) {
  const password = randomBytes(18).toString('base64url');
  const email = `${name}@users.rentobile.app`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: name },
  });
  if (error) throw error;
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, client };
}

const suffix = randomBytes(3).toString('hex');
const a = await makeUser(`rlstest_a_${suffix}`);
const b = await makeUser(`rlstest_b_${suffix}`);
const guest = createClient(url, anonKey, { auth: { persistSession: false } });

try {
  const listings = await guest.from('listings').select('id').eq('is_published', true);
  check('guest can read published listings', !listings.error && listings.data.length > 0);
  const listingId = listings.data[0].id;

  const profileA = await a.client.from('profiles').select('username, role').eq('id', a.id).single();
  check('sign-up trigger created a "user" profile', profileA.data?.role === 'user');

  const ins = await a.client.from('listings').insert({ title: 'should fail' }).select();
  check('normal user cannot create a listing', !!ins.error || ins.data.length === 0);

  const upd = await a.client.from('listings').update({ title: 'hacked' }).eq('id', listingId).select();
  check('normal user cannot edit a listing', !!upd.error || upd.data.length === 0);

  const role = await a.client.rpc('set_user_role', { target: a.id, new_role: 'admin' });
  check('normal user cannot make themselves admin', !!role.error);

  const direct = await a.client.from('profiles').update({ role: 'admin' }).eq('id', a.id).select();
  check('normal user cannot update their role directly', !!direct.error || direct.data.length === 0);

  const book = await a.client.from('booking_requests').insert({
    listing_id: listingId,
    start_date: '2026-12-01',
    end_date: '2026-12-03',
  });
  check('user can request a booking', !book.error);

  const approvedByUser = await a.client.from('booking_requests').insert({
    listing_id: listingId,
    start_date: '2026-12-05',
    end_date: '2026-12-06',
    status: 'approved',
  });
  check('user cannot create an already-approved booking', !!approvedByUser.error);

  const otherSees = await b.client.from('booking_requests').select('id');
  check("user cannot see someone else's bookings", !otherSees.error && otherSees.data.length === 0);

  const decide = await a.client.rpc('decide_booking', { request: '00000000-0000-0000-0000-000000000000', new_status: 'approved' });
  check('user cannot approve bookings', !!decide.error);

  const fav = await a.client.from('favorites').insert({ listing_id: listingId });
  const favB = await b.client.from('favorites').select('listing_id');
  check("favorites work and stay private", !fav.error && favB.data?.length === 0);

  const upload = await a.client.storage.from('listing-photos').upload(`listings/rls-${suffix}.txt`, 'x', { contentType: 'text/plain' });
  check('normal user cannot upload listing photos', !!upload.error);

  const usersList = await a.client.from('profiles').select('id');
  check('normal user only sees their own profile', usersList.data?.length === 1);
} finally {
  await admin.auth.admin.deleteUser(a.id);
  await admin.auth.admin.deleteUser(b.id);
}

const failed = results.filter((r) => !r).length;
console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
