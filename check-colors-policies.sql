-- Check all existing policies on colors table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'colors'
ORDER BY policyname;
