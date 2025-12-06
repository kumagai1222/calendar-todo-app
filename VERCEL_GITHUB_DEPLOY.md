# VercelでGitHubリポジトリをデプロイ

## GitHubリポジトリ
✅ https://github.com/kumagai1222/calendar-todo-app

## Vercelデプロイ手順

### 1. Vercelにアクセス
https://vercel.com にアクセスして、GitHubアカウントでログイン

### 2. 新しいプロジェクトを作成
1. ダッシュボードで「Add New...」→「Project」をクリック
2. 「Import Git Repository」セクションで `calendar-todo-app` を検索
3. 「Import」をクリック

### 3. プロジェクト設定
- **Project Name**: calendar-todo-app（そのまま）
- **Framework Preset**: Next.js（自動検出される）
- **Root Directory**: ./（そのまま）
- **Build Command**: `npm run build`（自動設定される）
- **Output Directory**: `.next`（自動設定される）

### 4. 環境変数を設定
「Environment Variables」セクションで以下を追加：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wybaosqvthxucixkenbg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YmFvc3F2dGh4dWNpeGtlbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDA5NTgsImV4cCI6MjA4MDU3Njk1OH0.a_Mwd-gPdXma-hN-h7Hq4bg6YDNxmU1gqbzokL2o1u4` |

### 5. デプロイ
「Deploy」ボタンをクリック

### 6. デプロイ後の設定

#### A. Vercelのデプロイ完了を待つ
- デプロイが完了すると、URLが表示されます（例: `https://calendar-todo-app-xxx.vercel.app`）

#### B. Supabaseの認証URL設定を更新
1. Supabaseダッシュボード（https://wybaosqvthxucixkenbg.supabase.co）にアクセス
2. 「Authentication」→「URL Configuration」を開く
3. 以下を設定：

**Site URL**:
```
https://calendar-todo-app-xxx.vercel.app
```
（実際のVercel URLに置き換えてください）

**Redirect URLs**（複数追加）:
```
https://calendar-todo-app-xxx.vercel.app/auth/callback
https://calendar-todo-app-xxx.vercel.app/login
https://calendar-todo-app-xxx.vercel.app/dashboard
https://calendar-todo-app-xxx.vercel.app/verify-email
http://localhost:8081/**
http://localhost:3000/**
```

4. 「Save」をクリック

### 7. 動作確認
1. Vercel URLにアクセス
2. 新規登録してメール認証を確認
3. ログインして機能をテスト
4. 管理者（hajimeazb@gmail.com）でログインしてユーザー管理機能を確認

## トラブルシューティング

### デプロイエラーが出た場合
- Vercelのログを確認
- 環境変数が正しく設定されているか確認

### 認証エラーが出た場合
- SupabaseのRedirect URLsに新しいVercel URLが追加されているか確認
- ブラウザのキャッシュをクリア

### 管理者機能が動かない場合
- Supabaseダッシュボードで `fix-rls-policies-final.sql` が実行されているか確認
- ブラウザコンソールで403エラーがないか確認

完成！🎉
