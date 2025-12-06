-- 既存のポリシーを確認するSQL

-- 1. すべてのテーブルのポリシーを確認
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
WHERE tablename IN ('calendar_events', 'todos', 'categories', 'colors')
ORDER BY tablename, policyname;

-- 2. 既存のSELECTポリシーを確認（読み取り専用）
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('calendar_events', 'todos', 'categories')
AND cmd = 'SELECT'
ORDER BY tablename;
