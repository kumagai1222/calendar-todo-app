-- Option 1: If the existing policy already has admin access, do nothing
-- Check the output of check-colors-policies.sql first

-- Option 2: If the existing policy needs to be replaced
-- Drop the old policy and create new one

DROP POLICY IF EXISTS "colors_admin_select" ON colors;

CREATE POLICY "colors_admin_select"
ON colors FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  auth.jwt() ->> 'email' = 'hajimeazb@gmail.com'
);

-- Verify the new policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'colors'
ORDER BY policyname;
