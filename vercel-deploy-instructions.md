# Vercelデプロイ手順

## 1. Vercel CLIをインストール

```bash
npm install -g vercel
```

## 2. Vercelにログイン

```bash
vercel login
```

## 3. プロジェクトをデプロイ

```bash
vercel
```

初回デプロイ時に以下の質問が表示されます：
- Set up and deploy "～"? → **Y** (Enter)
- Which scope? → あなたのアカウントを選択
- Link to existing project? → **N** (新規プロジェクト)
- What's your project's name? → プロジェクト名を入力（例: calendar-app）
- In which directory is your code located? → **./** (Enter)
- Want to modify these settings? → **N** (Enter)

## 4. 環境変数を設定

デプロイ後、Vercelダッシュボードで環境変数を設定：

1. https://vercel.com/dashboard にアクセス
2. デプロイしたプロジェクトを選択
3. 「Settings」→「Environment Variables」をクリック
4. 以下の環境変数を追加：

```
NEXT_PUBLIC_SUPABASE_URL=https://wybaosqvthxucixkenbg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5YmFvc3F2dGh4dWNpeGtlbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDA5NTgsImV4cCI6MjA4MDU3Njk1OH0.a_Mwd-gPdXma-hN-h7Hq4bg6YDNxmU1gqbzokL2o1u4
```

5. 「Save」をクリック

## 5. 本番環境にデプロイ

```bash
vercel --prod
```

## 6. Supabase設定の更新

Vercelのデプロイ後、SupabaseのURL設定を更新：

1. Supabaseダッシュボード → Authentication → URL Configuration
2. 「Site URL」に Vercel の本番URL を追加
3. 「Redirect URLs」に以下を追加：
   - `https://<your-app>.vercel.app/auth/callback`
   - `https://<your-app>.vercel.app/login`
   - `https://<your-app>.vercel.app/dashboard`

完了！
