-- 既存のポリシーを削除して、管理者用のポリシーを適用するSQL
-- 注意: このSQLを実行する前に、必ず check-policies.sql で既存のポリシー名を確認してください

-- ステップ1: 既存のSELECTポリシーを削除（ポリシー名は環境により異なる可能性があります）
-- 以下は一般的なポリシー名の例です。実際のポリシー名に置き換えてください。

-- calendar_events の既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Enable read access for users" ON calendar_events;
DROP POLICY IF EXISTS "管理者は全ユーザーの予定を閲覧可能" ON calendar_events;

-- todos の既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view own todos" ON todos;
DROP POLICY IF EXISTS "Enable read access for users" ON todos;
DROP POLICY IF EXISTS "管理者は全ユーザーのTodoを閲覧可能" ON todos;

-- categories の既存ポリシーを削除
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Enable read access for users" ON categories;
DROP POLICY IF EXISTS "管理者は全ユーザーのカテゴリを閲覧可能" ON categories;

-- ステップ2: 新しい管理者対応ポリシーを作成

-- 1. calendar_events テーブル
CREATE POLICY "calendar_events_select_policy"
ON calendar_events
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'hajimeazb@gmail.com'
);

-- 2. todos テーブル
CREATE POLICY "todos_select_policy"
ON todos
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'hajimeazb@gmail.com'
);

-- 3. categories テーブル
CREATE POLICY "categories_select_policy"
ON categories
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'hajimeazb@gmail.com'
);

-- 実行後、アプリケーションをリロードして動作を確認してください
