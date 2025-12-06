# GitHubへのプッシュ手順（Personal Access Token使用）

## リポジトリURL
https://github.com/kumahajime-cloud/calendar-todo-app

## 手順

### 1. GitHub Personal Access Token (PAT) を作成

1. **GitHubにログイン** (hajimeazb@gmail.com)
2. **https://github.com/settings/tokens** にアクセス
3. 「Generate new token」→「Generate new token (classic)」をクリック
4. 以下の設定：
   - **Note**: calendar-todo-app-deploy
   - **Expiration**: 90 days（または好みの期間）
   - **Select scopes**:
     - ✅ `repo` (すべてのrepoにチェック)
     - ✅ `workflow`
5. 「Generate token」をクリック
6. **表示されたトークンをコピー**（一度しか表示されません！）

### 2. Gitの認証情報を設定

ターミナルで以下を実行（トークンを貼り付け）:

```bash
git remote remove origin
git remote add origin https://<YOUR_TOKEN>@github.com/kumahajime-cloud/calendar-todo-app.git
```

`<YOUR_TOKEN>` の部分を、先ほどコピーしたトークンに置き換えてください。

例:
```bash
git remote add origin https://ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx@github.com/kumahajime-cloud/calendar-todo-app.git
```

### 3. プッシュ

```bash
git push -u origin hotfix/bug
```

### 4. mainブランチも作成（オプション）

```bash
git checkout -b main
git push -u origin main
```

## 完了後

GitHubリポジトリにアクセスして、コードがプッシュされたことを確認してください：
https://github.com/kumahajime-cloud/calendar-todo-app

---

## トラブルシューティング

### 認証エラーが出る場合
- トークンのスコープに `repo` が含まれているか確認
- トークンが期限切れでないか確認
- URLに正しくトークンが含まれているか確認

### トークンを忘れた場合
- 新しいトークンを作成し直してください
