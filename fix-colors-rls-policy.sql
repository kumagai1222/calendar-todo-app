-- Add admin SELECT policy for colors table
-- This allows admin to view other users' colors when viewing their calendars

CREATE POLICY "colors_admin_select"
ON colors FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  auth.jwt() ->> 'email' = 'hajimeazb@gmail.com'
);

-- Verify the new policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'colors'
ORDER BY policyname;
