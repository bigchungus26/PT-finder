import { supabase } from './supabase';

const BUCKET = 'uploads';
const VERIFICATION_BUCKET = 'verification-docs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

async function ensureBucket(bucket: string, isPublic: boolean) {
  try {
    const { data } = await supabase.storage.getBucket(bucket);
    if (!data) {
      await supabase.storage.createBucket(bucket, { public: isPublic });
    }
  } catch {
    // Bucket may already exist or we lack permission to create — proceed anyway
  }
}

function validateFile(file: File, allowedTypes: string[], maxSize: number) {
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
  }
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`);
  }
}

export async function uploadFile(
  file: File,
  folder: string,
): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE);
  await ensureBucket(BUCKET, true);

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadVerificationDoc(
  file: File,
  userId: string,
): Promise<string> {
  validateFile(file, ALLOWED_DOC_TYPES, MAX_FILE_SIZE);
  await ensureBucket(VERIFICATION_BUCKET, false);

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  return path;
}

export async function getVerificationDocUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .createSignedUrl(path, 3600);
    if (error) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
