# 🔔 Slack通知セットアップ手順

## Slack Webhook URLの取得

1. **Slackワークスペースでアプリを作成**:
   - https://api.slack.com/apps にアクセス
   - "Create New App" → "From scratch"
   - App Name: "Bar Order Notifications"
   - Pick a workspace: 通知を受け取りたいワークスペースを選択

2. **Incoming Webhookを有効化**:
   - 作成したアプリの設定画面で "Incoming Webhooks" をクリック
   - "Activate Incoming Webhooks" をONにする
   - "Add New Webhook to Workspace" をクリック
   - 通知を送信したいチャンネルを選択
   - "Allow" をクリック

3. **Webhook URLをコピー**:
   - 生成されたWebhook URLをコピー
   - 形式: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

## AWSへの設定

Webhook URLを取得したら、以下のコマンドでSSM Parameter Storeに設定してください:

\`\`\`bash
aws ssm put-parameter \
    --name "/bar-app/slack/webhook-url" \
    --value "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX" \
    --type "SecureString" \
    --description "Slack webhook URL for order notifications" \
    --region us-east-1
\`\`\`

## 設定確認

設定後、注文を作成するとSlackチャンネルに以下のような通知が送信されます:

```
🍺 新しい注文が入りました！

注文ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
注文者: 田中太郎
ユーザー: user@example.com
注文時刻: 2025/08/09 21:30:00

注文内容:
• ビール x2 (¥1,200)
• 唐揚げ x1 (¥800)

合計金額: ¥2,000
```

## トラブルシューティング

- Slack通知が送信されない場合は、CloudWatch Logsでエラーを確認してください
- Webhook URLが正しく設定されているかSSMで確認: 
  \`aws ssm get-parameter --name "/bar-app/slack/webhook-url" --with-decryption --region us-east-1\`