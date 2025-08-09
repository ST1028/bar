# 🍺 Bar Order System

AWS最小コスト構成で構築したBarの注文サイトです。

## システム構成

- **フロントエンド**: React + TypeScript + Vite (Amplify Hosting)
- **認証**: Amazon Cognito User Pool
- **API**: API Gateway + Lambda (Node.js 20)
- **データベース**: DynamoDB (オンデマンド課金)
- **通知**: Slack Incoming Webhook
- **IaC**: AWS CDK (TypeScript)

## 機能

### 🎯 主要機能
- **注文システム**: カテゴリ別メニューからの注文作成
- **注文者管理**: 注文者（Patron）の追加・編集
- **注文履歴**: 注文者別の履歴表示
- **Slack通知**: 注文時のリアルタイム通知
- **管理者機能**: データリセット機能

### 🎨 UI/UX
- Material-UIベースのモダンなデザイン
- Framer Motionによるスムーズなアニメーション
- Bottom Navigationによる3ページ構成
- レスポンシブデザイン対応

## プロジェクト構造

```
bar/
├── infra/                 # CDK インフラストラクチャ
│   ├── lib/
│   │   └── bar-order-system-stack.ts
│   └── bin/
│       └── infra.ts
├── services/             # Lambda 関数
│   ├── functions/        # Lambda ハンドラ
│   └── layer/           # 共有レイヤー
├── frontend/            # React アプリケーション
├── scripts/             # データ移行スクリプト
└── README.md
```

## セットアップ手順

### 前提条件

- Node.js 18+ がインストールされている
- AWS CLI が設定済み
- AWS CDK がインストールされている (`npm install -g aws-cdk`)

### 1. リポジトリのクローンと依存関係のインストール

\`\`\`bash
git clone <repository-url>
cd bar

# ルートレベルの依存関係
npm install

# インフラストラクチャの依存関係
cd infra
npm install

# フロントエンドの依存関係  
cd ../frontend
npm install

# スクリプトの依存関係
cd ../scripts
npm install
\`\`\`

### 2. Slack Webhook URLの設定

AWS Systems Manager Parameter Storeに Slack Webhook URL を設定します：

\`\`\`bash
aws ssm put-parameter \\
    --name "/bar-app/slack/webhook-url" \\
    --value "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \\
    --type "SecureString" \\
    --description "Slack webhook URL for order notifications"
\`\`\`

### 3. CDKによるインフラストラクチャのデプロイ

\`\`\`bash
cd infra

# CDKの初期化 (初回のみ)
cdk bootstrap

# デプロイ実行
npm run deploy
\`\`\`

デプロイ完了後、以下の値が出力されます：
- `UserPoolId`: Cognito User Pool ID
- `UserPoolClientId`: Cognito User Pool Client ID  
- `ApiGatewayUrl`: API Gateway のURL
- `TableName`: DynamoDB テーブル名

### 4. メニューデータの移行

既存のSQLファイルからメニューデータをDynamoDBに移行します：

\`\`\`bash
cd scripts

# JSONファイルのみ作成（テスト用）
npm run migrate:json-only

# DynamoDBへの移行実行
npm run migrate /path/to/bar_2025-08-09.sql
\`\`\`

### 5. フロントエンドの設定

\`\`\`bash
cd frontend

# 環境変数ファイルをコピー
cp .env.example .env.local

# .env.local を編集して、CDKの出力値を設定
# VITE_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
# VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx  
# VITE_API_GATEWAY_URL=https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod
\`\`\`

### 6. 管理者ユーザーの作成

Cognito User Poolに管理者ユーザーを追加し、adminグループに所属させます：

\`\`\`bash
# ユーザー作成
aws cognito-idp admin-create-user \\
    --user-pool-id <USER_POOL_ID> \\
    --username admin@example.com \\
    --user-attributes Name=email,Value=admin@example.com \\
    --message-action SUPPRESS

# adminグループに追加
aws cognito-idp admin-add-user-to-group \\
    --user-pool-id <USER_POOL_ID> \\
    --username admin@example.com \\
    --group-name admin
\`\`\`

## ローカル開発

### フロントエンドの起動

\`\`\`bash
cd frontend
npm run dev
\`\`\`

ブラウザで `http://localhost:5173` にアクセス

### Lambda関数のテスト

\`\`\`bash
# メニュー取得API
curl -H "Authorization: Bearer <JWT_TOKEN>" \\
     https://<API_ID>.execute-api.ap-northeast-1.amazonaws.com/prod/menus

# 注文者一覧取得
curl -H "Authorization: Bearer <JWT_TOKEN>" \\
     https://<API_ID>.execute-api.ap-northeast-1.amazonaws.com/prod/patrons
\`\`\`

## AWS Amplify Hostingでのデプロイ

### 1. Amplify アプリの作成

\`\`\`bash
# Amplify CLI のインストール (未インストールの場合)
npm install -g @aws-amplify/cli

# フロントエンドディレクトリで初期化
cd frontend
amplify init
\`\`\`

### 2. ホスティングの追加

\`\`\`bash
amplify add hosting
# ? Select the plugin module to execute: Amazon CloudFront and S3
# ? Select the environment setup: PROD
# ? hosting bucket name: bar-order-system-hosting
\`\`\`

### 3. デプロイ

\`\`\`bash
amplify publish
\`\`\`

## 運用

### コスト監視

- DynamoDB: オンデマンド課金、月数十円〜数百円程度を想定
- Lambda: 月100万リクエスト、月数十円程度を想定  
- API Gateway: 月100万リクエスト、月数百円程度を想定
- Amplify Hosting: 月数百円程度を想定

### ログ監視

CloudWatch Logsでログを確認：

\`\`\`bash
# Lambda関数のログ
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/BarOrderSystemStack"

# API Gatewayのログ  
aws logs describe-log-groups --log-group-name-prefix "API-Gateway-Execution-Logs"
\`\`\`

### データバックアップ

DynamoDBのオンデマンドバックアップ：

\`\`\`bash
aws dynamodb create-backup \\
    --table-name bar_app \\
    --backup-name "bar_app-backup-$(date +%Y%m%d)"
\`\`\`

## トラブルシューティング

### よくある問題

1. **CORS エラー**
   - API GatewayのCORS設定を確認
   - フロントエンドのAPIエンドポイントURLを確認

2. **認証エラー**
   - Cognitoの設定値（User Pool ID, Client ID）を確認
   - JWTトークンの有効期限を確認

3. **Lambda関数エラー**  
   - CloudWatch Logsでエラー詳細を確認
   - IAMロールの権限を確認

4. **DynamoDB アクセスエラー**
   - テーブル名が正しいか確認
   - Lambda実行ロールにDynamoDBアクセス権限があるか確認

## リソースの削除

全てのAWSリソースを削除するには：

\`\`\`bash
# CDKスタックの削除
cd infra
cdk destroy

# Amplifyアプリの削除 (Amplify使用時)
cd frontend  
amplify delete
\`\`\`

## 開発者向け情報

### データモデル

DynamoDB単一テーブル設計：
- **PK**: `TENANT#<userSub>` または `TENANT#PUBLIC`
- **SK**: `PATRON#<patronId>` または `ORDER#<orderId>` または `MENU#<menuId>`

### API エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/menus` | メニュー一覧取得 |
| GET | `/patrons` | 注文者一覧取得 |
| POST | `/patrons` | 注文者作成 |
| PATCH | `/patrons/{id}` | 注文者更新 |
| GET | `/orders` | 注文履歴取得 |
| POST | `/orders` | 注文作成 |
| POST | `/admin/reset` | データリセット (管理者のみ) |

### 権限モデル

- **一般ユーザー**: 自分の注文者・注文のみアクセス可能
- **管理者**: すべてのデータにアクセス可能、リセット機能使用可能

---

## ライセンス

MIT License

## サポート

Issues: [GitHub Issues](https://github.com/your-repo/issues)