-- 古いSELECTポリシーを削除して、管理者対応の新しいポリシーのみを使用する

-- calendar_events テーブルの古いSELECTポリシーを削除
DROP POLICY "Users can view their own calendar events" ON calendar_events;

-- todos テーブルの古いSELECTポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own todos" ON todos;

-- categories テーブルの古いSELECTポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;

-- 実行後、ページをリロードして動作を確認してください
