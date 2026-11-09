import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';
import { PHOTO_BUCKET } from './supabase-config';

export type PickedPhoto = { uri: string; base64: string; mimeType: string };

/** Opens the photo library and returns the picked images with their data, ready to upload. */
export async function pickPhotos(limit: number): Promise<PickedPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: Math.max(1, limit),
    quality: 0.7,
    base64: true,
  });
  if (result.canceled) return [];
  return result.assets
    .filter((a) => a.base64)
    .map((a) => ({ uri: a.uri, base64: a.base64!, mimeType: a.mimeType ?? 'image/jpeg' }));
}

/** Uploads a picked photo to the listing-photos bucket and returns its storage path. */
export async function uploadPhoto(photo: PickedPhoto): Promise<string> {
  const ext = photo.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const path = `listings/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, decode(photo.base64), { contentType: photo.mimeType, upsert: false });
  if (error) throw error;
  return path;
}
