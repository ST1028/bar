# 🚀 Bar Order System デプロイ手順

## 現在の状況

✅ **完了済み**:
- 完全なBar注文サイトの実装
- CDK インフラストラクチャコード（テンプレート生成確認済み）
- React フロントエンド（完全実装）
- Lambda バックエンドAPI（4つの関数）
- データ移行スクリプト
- AWS CLI設定

❌ **残りのタスク**:
- CDKブートストラップ&デプロイ（管理者権限必要）
- フロントエンド環境変数設定
- メニューデータ投入

## 権限の問題と解決策

現在のIAMユーザー `bar-user` には以下の権限が不足しています:
- `cloudformation:*` - CloudFormationスタック管理
- `ssm:GetParameter` - CDKブートストラップ確認
- `iam:*` - IAMロール作成

### 解決方法

**オプション1: 管理者権限で実行（推奨）**
```bash
# 管理者権限のあるAWSアカウントで実行
aws configure  # 管理者クレデンシャルを設定
cd infra
npx cdk bootstrap
npx cdk deploy
```

**オプション2: 必要最小限の権限を付与**
以下のポリシーを `bar-user` にアタッチ:
- `PowerUserAccess` (推奨)
- または個別権限: `CloudFormationFullAccess`, `IAMFullAccess`, `SSMFullAccess`

## デプロイ手順（管理者権限で実行）

### 1. CDKデプロイ

```bash
cd /Users/shoun/Documents/GitHub/bar/infra

# CDKブートストラップ（初回のみ）
npx cdk bootstrap

# スタックデプロイ
npx cdk deploy
```

**重要な出力値をメモしてください:**
```
Outputs:
BarOrderSystemStack.UserPoolId = ap-northeast-1_XXXXXXXXX
BarOrderSystemStack.UserPoolClientId = XXXXXXXXXXXXXXXXXXXXXXXXXX
BarOrderSystemStack.ApiGatewayUrl = https://XXXXXXXXXX.execute-api.ap-northeast-1.amazonaws.com/prod
BarOrderSystemStack.TableName = bar_app
```

### 2. フロントエンド環境変数設定

```bash
cd ../frontend

# 環境変数ファイルを編集
nano .env.local

# 以下の値をCDKの出力値で置換:
VITE_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_API_GATEWAY_URL=https://XXXXXXXXXX.execute-api.ap-northeast-1.amazonaws.com/prod
```

### 3. メニューデータの移行

```bash
cd ../scripts

# 依存関係インストール
npm install

# メニューデータをDynamoDBに投入
npm run migrate /Users/shoun/Downloads/bar_2025-08-09.sql
```

### 4. Slack通知設定（オプション）

```bash
# Slack Webhook URLをSSMに設定
aws ssm put-parameter \
    --name "/bar-app/slack/webhook-url" \
    --value "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX" \
    --type "SecureString" \
    --description "Slack webhook URL for order notifications"
```

### 5. 管理者ユーザー作成

```bash
# CDKの出力値を使用してユーザー作成
aws cognito-idp admin-create-user \
    --user-pool-id <USER_POOL_ID> \
    --username admin@example.com \
    --user-attributes Name=email,Value=admin@example.com \
    --message-action SUPPRESS

# adminグループに追加
aws cognito-idp admin-add-user-to-group \
    --user-pool-id <USER_POOL_ID> \
    --username admin@example.com \
    --group-name admin
```

### 6. フロントエンド起動

```bash
cd frontend

# 依存関係インストール
npm install

# ローカル開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:5173` にアクセス

## 本番デプロイ（AWS Amplify Hosting）

### Option A: Amplify Console

1. [AWS Amplify Console](https://console.aws.amazon.com/amplify/) にアクセス
2. "New app" → "Host web app" を選択
3. GitHubリポジトリを連携
4. Build settings:
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
5. 環境変数を設定:
   - `VITE_USER_POOL_ID`
   - `VITE_USER_POOL_CLIENT_ID`
   - `VITE_API_GATEWAY_URL`

### Option B: Amplify CLI

```bash
npm install -g @aws-amplify/cli
cd frontend
amplify init
amplify add hosting
amplify publish
```

## テスト手順

### 1. API動作確認

```bash
# テストスクリプトを実行
../scripts/test-api.sh \
  "https://YOUR_API_ID.execute-api.ap-northeast-1.amazonaws.com/prod" \
  "YOUR_JWT_TOKEN"
```

### 2. フロントエンド動作確認

1. `http://localhost:5173` にアクセス
2. ユーザー登録・ログイン
3. 注文者追加
4. 注文作成
5. 注文履歴確認
6. Slack通知確認

## トラブルシューティング

### CORS エラー
- API GatewayのCORS設定確認
- フロントエンドのAPIエンドポイントURL確認

### 認証エラー  
- Cognitoの設定値確認
- JWTトークンの有効期限確認

### Lambda関数エラー
- CloudWatch Logsでエラー詳細確認
- IAMロールの権限確認

### DynamoDB アクセスエラー
- テーブル名確認
- Lambda実行ロールにDynamoDBアクセス権限確認

## 削除手順

```bash
# CDKスタック削除
cd infra
npx cdk destroy

# Amplifyアプリ削除（Amplify CLI使用時）
cd frontend
amplify delete
```

## 料金目安

- **DynamoDB**: 月数十円〜数百円
- **Lambda**: 月数十円  
- **API Gateway**: 月数百円
- **Amplify Hosting**: 月数百円
- **合計**: 月1,000円未満での運用が可能

---

## サポート情報

- **テンプレート確認済み**: CDK synthが成功、全リソース定義完了
- **Lambda関数**: 4つの関数（menus, patrons, orders, admin）実装済み
- **フロントエンド**: 完全実装、Material-UI使用
- **データ移行**: SQLからDynamoDBへの変換スクリプト完成

**次のステップ**: 管理者権限でのCDKデプロイのみが残っています。