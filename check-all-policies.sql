-- すべてのテーブルのSELECTポリシーを一度に確認

SELECT
  tablename as "テーブル名",
  policyname as "ポリシー名",
  cmd as "操作",
  CASE
    -- calendar_events
    WHEN tablename = 'calendar_events' AND policyname = '管理者は全ユーザーの予定を閲覧可能' THEN '✓ 正しい'
    WHEN tablename = 'calendar_events' AND policyname = 'Users can view their own calendar events' THEN '✗ 削除必要'
    WHEN tablename = 'calendar_events' AND policyname = 'calendar_events_select_policy' THEN '✓ 正しい'
    -- todos
    WHEN tablename = 'todos' AND policyname = '管理者は全ユーザーのTodoを閲覧可能' THEN '✓ 正しい'
    WHEN tablename = 'todos' AND policyname LIKE '%own todos%' THEN '✗ 削除必要'
    WHEN tablename = 'todos' AND policyname = 'todos_select_policy' THEN '✓ 正しい'
    -- categories
    WHEN tablename = 'categories' AND policyname = '管理者は全ユーザーのカテゴリを閲覧可能' THEN '✓ 正しい'
    WHEN tablename = 'categories' AND policyname LIKE '%own categories%' THEN '✗ 削除必要'
    WHEN tablename = 'categories' AND policyname = 'categories_select_policy' THEN '✓ 正しい'
    ELSE '確認必要'
  END as "状態"
FROM pg_policies
WHERE tablename IN ('calendar_events', 'todos', 'categories')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;
