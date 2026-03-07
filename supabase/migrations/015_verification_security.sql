-- Enhanced trainer verification system with secure document storage
-- and proper verification workflow

-- Add verification workflow fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewer_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS verification_rejection_reason text,
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Add document storage path (private, not public URL) to verifications
ALTER TABLE tutor_verifications
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS selfie_path text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS file_type text;

-- Sync existing verified_status boolean to new verification_status text
UPDATE profiles
SET verification_status = 'approved'
WHERE verified_status = true AND verification_status = 'unverified';

-- Create private storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Only the document owner can upload to their folder
CREATE POLICY "Trainers upload own verification docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Only admins can read verification documents
CREATE POLICY "Admins read verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Document owners can also read their own docs
CREATE POLICY "Owners read own verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Prevent trainers from directly updating their own verified_status
-- via a trigger that blocks non-admin updates to verification fields
CREATE OR REPLACE FUNCTION prevent_self_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified_status IS DISTINCT FROM OLD.verified_status THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
      NEW.verified_status := OLD.verified_status;
      NEW.verification_status := OLD.verification_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_self_verification_trigger ON profiles;
CREATE TRIGGER prevent_self_verification_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_verification();

-- RLS for tutor_verifications: trainers see only their own, admins see all
DROP POLICY IF EXISTS "Trainers view own verifications" ON tutor_verifications;
CREATE POLICY "Trainers view own verifications"
  ON tutor_verifications FOR SELECT TO authenticated
  USING (
    tutor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Trainers insert own verifications" ON tutor_verifications;
CREATE POLICY "Trainers insert own verifications"
  ON tutor_verifications FOR INSERT TO authenticated
  WITH CHECK (tutor_id = auth.uid());

DROP POLICY IF EXISTS "Admins update verifications" ON tutor_verifications;
CREATE POLICY "Admins update verifications"
  ON tutor_verifications FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
