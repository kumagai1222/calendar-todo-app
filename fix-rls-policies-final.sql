-- すべてのSELECTポリシーを削除して、シンプルなポリシーを再作成

-- ステップ1: すべての既存SELECTポリシーを削除
DROP POLICY IF EXISTS "Users can view their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "管理者は全ユーザーの予定を閲覧可能" ON calendar_events;
DROP POLICY IF EXISTS "calendar_events_select_policy" ON calendar_events;

DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
DROP POLICY IF EXISTS "管理者は全ユーザーのTodoを閲覧可能" ON todos;
DROP POLICY IF EXISTS "todos_select_policy" ON todos;

DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "管理者は全ユーザーのカテゴリを閲覧可能" ON categories;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;

-- ステップ2: 新しいシンプルなポリシーを作成
-- auth.jwt() を使用してJWTトークンからメールアドレスを取得

-- calendar_events
CREATE POLICY "calendar_events_admin_select"
ON calendar_events
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  auth.jwt() ->> 'email' = 'hajimeazb@gmail.com'
);

-- todos
CREATE POLICY "todos_admin_select"
ON todos
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  auth.jwt() ->> 'email' = 'hajimeazb@gmail.com'
);

-- categories
CREATE POLICY "categories_admin_select"
ON categories
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  auth.jwt() ->> 'email' = 'hajimeazb@gmail.com'
);

-- colors テーブルも同様に設定
DROP POLICY IF EXISTS "Users can view colors" ON colors;
CREATE POLICY "colors_admin_select"
ON colors
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  auth.jwt() ->> 'email' = 'hajimeazb@gmail.com'
);

-- 実行後、ブラウザでページをリロードして確認してください
