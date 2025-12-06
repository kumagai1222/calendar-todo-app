-- Debug: Check current RLS policies on colors table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'colors'
ORDER BY policyname;

-- Check if there are any colors in the database
SELECT id, user_id, name, hex_code, created_at
FROM colors
ORDER BY created_at DESC
LIMIT 10;

-- Check current user's email (when logged in as admin)
SELECT auth.jwt() ->> 'email' as current_user_email;
