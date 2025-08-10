# ユーザーアカウント情報

## 管理者アカウント
- Email: admin@example.com
- Password: TempPassword123! (初回ログイン後変更が必要)
- 権限: 管理者（全機能アクセス可能）

## 一般ユーザーアカウント
以下の7つの一般ユーザーアカウントが作成されています：

1. **user1@example.com**
   - Password: Password123!
   - 権限: 一般ユーザー

2. **user2@example.com**
   - Password: Password123!
   - 権限: 一般ユーザー

3. **user3@example.com**
   - Password: Password123!
   - 権限: 一般ユーザー

4. **user4@example.com**
   - Password: Password123!
   - 権限: 一般ユーザー

5. **user5@example.com**
   - Password: Password123!
   - 権限: 一般ユーザー

6. **user6@example.com**
   - Password: Password123!
   - 権限: 一般ユーザー

7. **user7@example.com**
   - Password: Password123!
   - 権限: 一般ユーザー

## ログイン方法
1. ブラウザで http://localhost:5173 にアクセス
2. 上記のいずれかのアカウントでログイン
3. 管理者アカウントでログインすると、「Admin」タブが表示され、データリセット機能が利用可能

## 管理者機能
- 全注文データとパトロンデータのリセット
- 今後の予定: メニュー管理、カテゴリー管理、注文状況管理

## AWS Amplify Hosting セットアップ手順
手動でのAmplify Hostingセットアップ：

1. AWS Consoleで「AWS Amplify」サービスを開く
2. 「Create app」→「Host web app」を選択
3. GitHub を選択し、リポジトリ接続を設定
4. Repository: ST1028/bar を選択
5. Branch: main を選択
6. Build settings で以下を確認：
   ```yaml
   version: 1
   applications:
     - frontend:
         phases:
           preBuild:
             commands:
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: dist
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
       appRoot: frontend
   ```
7. Environment variables を設定：
   - VITE_API_GATEWAY_URL: https://kylb31ww8b.execute-api.us-east-1.amazonaws.com/prod
   - VITE_USER_POOL_ID: us-east-1_rLSE2iwet
   - VITE_USER_POOL_CLIENT_ID: 43mqcr6sbukfvcrogqg5edp3u3
8. Deploy を開始
9. 完了後、生成されたURLでアクセス可能