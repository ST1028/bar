const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({ region: 'us-east-1' });

const testSlackNotification = async () => {
  try {
    // Slack Webhook URLを取得
    const command = new GetParameterCommand({
      Name: '/bar-app/slack/webhook-url',
      WithDecryption: true,
    });
    
    const result = await ssmClient.send(command);
    const webhookUrl = result.Parameter.Value;
    
    console.log('🔗 Webhook URL取得完了');
    
    // テスト通知を送信
    const message = {
      text: '🍺 Bar注文システム - テスト通知',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🍺 Bar注文システム テスト',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*システム状態:*\n✅ 正常動作中',
            },
            {
              type: 'mrkdwn',
              text: '*テスト時刻:*\n' + new Date().toLocaleString('ja-JP'),
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*メッセージ:*\nSlack通知の設定が正常に完了しました！注文時に通知が送信されます。',
          },
        },
      ],
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    
    if (response.ok) {
      console.log('✅ Slack通知テスト成功！');
      console.log('Slackチャンネルで通知を確認してください。');
    } else {
      console.error('❌ Slack通知テスト失敗:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
};

testSlackNotification();