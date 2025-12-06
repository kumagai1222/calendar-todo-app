# Supabase最終設定

## 🌐 デプロイURL
https://calendar-todo-app-six.vercel.app

---

## ⚙️ Supabase認証URL設定

### 1. Supabaseダッシュボードにアクセス
https://wybaosqvthxucixkenbg.supabase.co

### 2. Authentication → URL Configurationを開く

左メニュー:
1. 「Authentication」をクリック
2. 「URL Configuration」をクリック

### 3. Site URLを更新

**Site URL**:
```
https://calendar-todo-app-six.vercel.app
```

### 4. Redirect URLsを設定

「Redirect URLs」セクションで以下を追加（1行ずつ追加）:

```
https://calendar-todo-app-six.vercel.app/auth/callback
https://calendar-todo-app-six.vercel.app/login
https://calendar-todo-app-six.vercel.app/dashboard
https://calendar-todo-app-six.vercel.app/verify-email
https://calendar-todo-app-six.vercel.app/admin/users
http://localhost:8081/**
http://localhost:3000/**
```

**重要**: 各URLを個別に入力して「Add URL」をクリックしてください。

### 5. 保存

「Save」ボタンをクリック

---

## ✅ 動作確認チェックリスト

### 基本機能
- [ ] https://calendar-todo-app-six.vercel.app にアクセスできる
- [ ] 新規登録ページが表示される
- [ ] 新規登録後、メール認証ページに遷移する
- [ ] 確認メールが届く
- [ ] メール内のリンクをクリックして認証完了
- [ ] ログインできる
- [ ] ダッシュボードが表示される

### カレンダー機能
- [ ] カレンダーが表示される
- [ ] 予定を追加できる
- [ ] 予定を編集できる
- [ ] 予定を削除できる
- [ ] 月表示・日表示を切り替えられる

### Todo機能
- [ ] Todoリストが表示される
- [ ] Todoを追加できる
- [ ] Todoのチェックボックスが動作する（詳細画面に遷移しない）
- [ ] Todoを編集・削除できる

### 管理者機能（hajimeazb@gmail.comでログイン）
- [ ] 「管理者」バッジが表示される
- [ ] 「ユーザー管理」ボタンが表示される
- [ ] ユーザー管理ページにアクセスできる
- [ ] 他のユーザー一覧が表示される
- [ ] ユーザーを選択して予定を閲覧できる

---

## 🐛 トラブルシューティング

### 認証エラーが出る場合
- Supabaseの Redirect URLs が正しく設定されているか確認
- ブラウザのキャッシュをクリア（Ctrl+Shift+R）

### 管理者機能が動作しない場合
- Supabaseで `fix-rls-policies-final.sql` が実行されているか確認
- ブラウザコンソールで403エラーが出ていないか確認

### メールが届かない場合
- 迷惑メールフォルダを確認
- Supabaseの Email Templates 設定を確認

---

## 🎉 完成！

すべての設定が完了したら、本番環境でアプリケーションが利用できます！

**本番URL**: https://calendar-todo-app-six.vercel.app
**GitHubリポジトリ**: https://github.com/kumahajime-cloud/calendar-todo-app
