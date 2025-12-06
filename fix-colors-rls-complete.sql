-- Complete fix for colors RLS policies
-- This will drop ALL existing policies and recreate them correctly

-- Drop all existing policies on colors table
DROP POLICY IF EXISTS "Users can view their own colors" ON colors;
DROP POLICY IF EXISTS "Users can insert their own colors" ON colors;
DROP POLICY IF EXISTS "Users can update their own colors" ON colors;
DROP POLICY IF EXISTS "Users can delete their own colors" ON colors;
DROP POLICY IF EXISTS "colors_admin_select" ON colors;

-- Create new policies with admin access

-- SELECT: Allow users to see their own colors, admin can see all
CREATE POLICY "colors_select_policy"
ON colors FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR
  auth.jwt() ->> 'email' = 'hajimeazb@gmail.com'
);

-- INSERT: Users can only insert their own colors
CREATE POLICY "colors_insert_policy"
ON colors FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own colors
CREATE POLICY "colors_update_policy"
ON colors FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- DELETE: Users can only delete their own colors
CREATE POLICY "colors_delete_policy"
ON colors FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'colors'
ORDER BY policyname;
