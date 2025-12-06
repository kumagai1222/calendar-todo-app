# カレンダー & Todo管理アプリ

Next.js、TypeScript、Supabaseを使用したフル機能のカレンダー・Todo管理Webアプリケーションです。

## 機能

### カレンダー機能
- **月表示・日表示の切り替え** - 月間カレンダーと日間スケジュールの表示
- **予定の作成・編集・削除** - 詳細な予定情報の管理
- **カラー分け** - カラーに名前をつけて予定を分類
- **フィルター機能** - 表示する予定を選択可能
- **レスポンシブデザイン** - スマホ・PC両対応

### Todo機能
- **Todoの作成・編集・削除** - タスク管理
- **カテゴリ分け** - Todoをジャンル別に整理
- **締切設定** - 期限を設定して管理
- **優先度設定** - 低・中・高の3段階
- **完了/未完了の切り替え** - タスクの進捗管理
- **統計情報** - 全タスク、完了、未完了の件数表示

### 認証機能
- ユーザー登録・ログイン (Supabase Auth)
- マルチユーザー対応

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth
- **デプロイ**: Vercel推奨

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

### 4. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成:

```bash
cp .env.local.example .env.local
```

`.env.local` に以下の値を設定:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. データベーススキーマの作成

Supabaseダッシュボードで以下を実行:

1. `SQL Editor` を開く
2. `supabase/schema.sql` の内容をコピー
3. SQLエディタに貼り付けて実行

これにより以下のテーブルが作成されます:
- `colors` - カラー情報
- `categories` - カテゴリ情報
- `calendar_events` - カレンダー予定
- `todos` - Todoリスト

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

### 7. アカウント作成とログイン

1. サインアップページでアカウントを作成
2. ログインしてアプリケーションを使用開始

## プロジェクト構成

```
├── app/
│   ├── dashboard/          # ダッシュボードページ
│   ├── login/              # ログインページ
│   ├── signup/             # サインアップページ
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # ホームページ (リダイレクト)
├── components/
│   ├── CalendarView.tsx    # カレンダービューメイン
│   ├── MonthlyCalendar.tsx # 月表示カレンダー
│   ├── DailyCalendar.tsx   # 日表示カレンダー
│   ├── EventModal.tsx      # 予定作成/編集モーダル
│   ├── ColorManager.tsx    # カラー管理
│   ├── TodoList.tsx        # Todoリストメイン
│   ├── TodoModal.tsx       # Todo作成/編集モーダル
│   ├── CategoryManager.tsx # カテゴリ管理
│   └── DashboardClient.tsx # ダッシュボードクライアント
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # クライアントサイドSupabase
│   │   ├── server.ts       # サーバーサイドSupabase
│   │   └── middleware.ts   # ミドルウェア用Supabase
│   └── types/
│       └── database.types.ts # データベース型定義
├── supabase/
│   └── schema.sql          # データベーススキーマ
└── middleware.ts           # Next.jsミドルウェア
```

## 使い方

### カレンダー機能

1. **カラーの作成**
   - 「カラー管理」ボタンをクリック
   - カラー名と色を選択して追加

2. **予定の追加**
   - 「予定追加」ボタンまたはカレンダーの日付をクリック
   - タイトル、説明、日時、カラーを入力

3. **表示の切り替え**
   - 「月」「日」ボタンで表示モードを切り替え
   - カラーフィルターで表示する予定を選択

### Todo機能

1. **カテゴリの作成**
   - 「カテゴリ管理」ボタンをクリック
   - カテゴリ名とカラーを設定

2. **Todoの追加**
   - 「Todo追加」ボタンをクリック
   - タイトル、説明、カテゴリ、締切、優先度を設定

3. **Todoの管理**
   - チェックボックスで完了/未完了を切り替え
   - Todoをクリックして編集・削除

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. [Vercel](https://vercel.com) でプロジェクトをインポート
3. 環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. デプロイ

## トラブルシューティング

### 認証エラー
- `.env.local` の環境変数が正しく設定されているか確認
- SupabaseダッシュボードでAnon Keyを確認

### データベースエラー
- `supabase/schema.sql` が正しく実行されているか確認
- Supabaseダッシュボードの「Table Editor」でテーブルを確認
- Row Level Security (RLS) が有効になっているか確認

### ビルドエラー
- `npm install` を再実行
- `node_modules` を削除して再インストール

## ライセンス

MIT

## 開発者

カレンダー & Todo管理アプリ
