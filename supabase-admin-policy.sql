-- 管理者用のRow Level Security (RLS) ポリシー
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください

-- 1. calendar_events テーブルに管理者用の読み取りポリシーを追加
CREATE POLICY "管理者は全ユーザーの予定を閲覧可能"
ON calendar_events
FOR SELECT
USING (
  -- 自分のデータは誰でも見られる
  auth.uid() = user_id
  OR
  -- 管理者メールアドレスのユーザーは全データを見られる
  (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) = 'hajimeazb@gmail.com'
);

-- 2. todos テーブルに管理者用の読み取りポリシーを追加
CREATE POLICY "管理者は全ユーザーのTodoを閲覧可能"
ON todos
FOR SELECT
USING (
  -- 自分のデータは誰でも見られる
  auth.uid() = user_id
  OR
  -- 管理者メールアドレスのユーザーは全データを見られる
  (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) = 'hajimeazb@gmail.com'
);

-- 3. categories テーブルに管理者用の読み取りポリシーを追加（必要に応じて）
CREATE POLICY "管理者は全ユーザーのカテゴリを閲覧可能"
ON categories
FOR SELECT
USING (
  -- 自分のデータは誰でも見られる
  auth.uid() = user_id
  OR
  -- 管理者メールアドレスのユーザーは全データを見られる
  (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ) = 'hajimeazb@gmail.com'
);

-- 注意: 既存のポリシーと競合する場合は、既存のポリシーを削除してから実行してください
-- 既存のポリシーを削除するには（例）:
-- DROP POLICY IF EXISTS "既存のポリシー名" ON calendar_events;
