# Vercelデプロイ - 最終手順

## ✅ GitHubリポジトリ
https://github.com/kumahajime-cloud/calendar-todo-app

コードは `hotfix/bug` ブランチにプッシュ済みです！

---

## 🚀 Vercelデプロイ手順

### 1. Vercelにアクセス
https://vercel.com にアクセスして、GitHubアカウント（kumahajime-cloud）でログイン

### 2. 新しいプロジェクトをインポート
1. 「Add New...」→「Project」をクリック
2. 「Import Git Repository」セクションで `kumahajime-cloud/calendar-todo-app` を検索
3. 「Import」をクリック

### 3. プロジェクト設定

#### Configure Project画面で：
- **Project Name**: `calendar-todo-app`（そのまま）
- **Framework Preset**: Next.js（自動検出）
- **Root Directory**: `./`（そのまま）
- **Build and Output Settings**: デフォルトのまま

#### 環境変数を追加

「Environment Variables」セクションで以下を追加：

**Name**: `NEXT_PUBLIC_SUPABASE_URL`
**Value**: `https://wybaosqvthxucixkenbg.supabase.co`

**Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YmFvc3F2dGh4dWNpeGtlbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDA5NTgsImV4cCI6MjA4MDU3Njk1OH0.a_Mwd-gPdXma-hN-h7Hq4bg6YDNxmU1gqbzokL2o1u4`

すべての環境を選択（Production、Preview、Development）

### 4. デプロイ
「Deploy」ボタンをクリック

デプロイには数分かかります。完了すると、デプロイURLが表示されます。

---

## ⚙️ デプロイ後の設定

### Supabase認証URL設定

1. **Supabaseダッシュボード**にアクセス
   - https://wybaosqvthxucixkenbg.supabase.co

2. **Authentication** → **URL Configuration**

3. **Site URL**を更新:
   ```
   https://calendar-todo-app-xxx.vercel.app
   ```
   （実際のVercel URLに置き換えてください）

4. **Redirect URLs**に以下を追加（改行で複数追加）:
   ```
   https://calendar-todo-app-xxx.vercel.app/auth/callback
   https://calendar-todo-app-xxx.vercel.app/login
   https://calendar-todo-app-xxx.vercel.app/dashboard
   https://calendar-todo-app-xxx.vercel.app/verify-email
   https://calendar-todo-app-xxx.vercel.app/admin/users
   http://localhost:8081/**
   http://localhost:3000/**
   ```

5. **Save**をクリック

---

## 🧪 動作確認

1. Vercel URLにアクセス
2. 新規登録してメール認証を確認
3. ログインしてカレンダー・Todo機能をテスト
4. **hajimeazb@gmail.com** でログインして管理者機能をテスト
   - 「ユーザー管理」ボタンが表示されるか
   - 他のユーザーの予定が閲覧できるか

---

## 📝 実装した機能まとめ

✅ ユーザー認証（Supabase Auth）
✅ メール認証ページ
✅ カレンダー機能
✅ Todo管理機能
✅ 管理者専用ユーザー管理機能
✅ Supabase RLSポリシーによるセキュリティ

---

## 🎉 完了！

デプロイが成功したら、Vercel URLを共有してアプリケーションを使い始められます！
