-- 現在のポリシー状態を確認するSQL

-- 1. calendar_events テーブルのSELECTポリシーを確認
SELECT
  policyname as "ポリシー名",
  cmd as "操作",
  CASE
    WHEN policyname = '管理者は全ユーザーの予定を閲覧可能' THEN '✓ 正しい（新しいポリシー）'
    WHEN policyname = 'Users can view their own calendar events' THEN '✗ 削除が必要（古いポリシー）'
    ELSE '確認が必要'
  END as "状態"
FROM pg_policies
WHERE tablename = 'calendar_events'
AND cmd = 'SELECT'
ORDER BY policyname;

-- 2. todos テーブルのSELECTポリシーを確認
SELECT
  policyname as "ポリシー名",
  cmd as "操作",
  CASE
    WHEN policyname = '管理者は全ユーザーのTodoを閲覧可能' THEN '✓ 正しい（新しいポリシー）'
    WHEN policyname LIKE '%own todos%' THEN '✗ 削除が必要（古いポリシー）'
    ELSE '確認が必要'
  END as "状態"
FROM pg_policies
WHERE tablename = 'todos'
AND cmd = 'SELECT'
ORDER BY policyname;

-- 3. categories テーブルのSELECTポリシーを確認
SELECT
  policyname as "ポリシー名",
  cmd as "操作",
  CASE
    WHEN policyname = '管理者は全ユーザーのカテゴリを閲覧可能' THEN '✓ 正しい（新しいポリシー）'
    WHEN policyname LIKE '%own categories%' THEN '✗ 削除が必要（古いポリシー）'
    ELSE '確認が必要'
  END as "状態"
FROM pg_policies
WHERE tablename = 'categories'
AND cmd = 'SELECT'
ORDER BY policyname;
