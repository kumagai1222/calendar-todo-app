-- ポリシーの詳細な内容を確認するSQL

SELECT
  schemaname as "スキーマ",
  tablename as "テーブル名",
  policyname as "ポリシー名",
  permissive as "許可型",
  roles as "ロール",
  cmd as "コマンド",
  qual as "条件式（USING）",
  with_check as "チェック式（WITH CHECK）"
FROM pg_policies
WHERE tablename IN ('calendar_events', 'todos', 'categories')
AND cmd = 'SELECT'
ORDER BY tablename, policyname;
