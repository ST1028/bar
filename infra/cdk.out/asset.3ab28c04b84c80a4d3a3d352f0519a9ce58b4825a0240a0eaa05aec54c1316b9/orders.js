const { 
  response, 
  errorResponse, 
  getUserFromEvent,
  getTenantId,
  generateId,
  getCurrentTimestamp,
  putItem,
  queryItems,
  getItem,
  getSSMParameter
} = require('/opt/nodejs/utils');

const TABLE_NAME = process.env.TABLE_NAME;
const SLACK_WEBHOOK_PARAM = process.env.SLACK_WEBHOOK_PARAM;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return response(200, {});
    }

    const user = getUserFromEvent(event);
    const tenantId = getTenantId(user.sub);

    switch (event.httpMethod) {
      case 'GET':
        return await getOrders(event, tenantId);
      case 'POST':
        return await createOrder(event, tenantId, user);
      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

const getOrders = async (event, tenantId) => {
  try {
    const patronId = event.queryStringParameters?.patronId;

    let orders;
    if (patronId) {
      // Get orders for specific patron
      orders = await queryItems(TABLE_NAME, {
        expression: '#gsi2pk = :gsi2pk',
        names: { '#gsi2pk': 'gsi2pk' },
        values: { ':gsi2pk': `${tenantId}#PATRON#${patronId}` },
      }, {
        IndexName: 'gsi2',
        ScanIndexForward: false, // Sort by createdAt desc
      });
    } else {
      // Get all orders for tenant
      orders = await queryItems(TABLE_NAME, {
        expression: '#pk = :pk AND begins_with(#sk, :sk)',
        names: { '#pk': 'pk', '#sk': 'sk' },
        values: { ':pk': tenantId, ':sk': 'ORDER#' },
      });
    }

    const result = orders.map(order => ({
      id: order.orderId,
      patronId: order.patronId,
      patronName: order.patronName,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return response(200, { orders: result });
  } catch (error) {
    console.error('Error getting orders:', error);
    throw error;
  }
};

const createOrder = async (event, tenantId, user) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { patronId, items } = body;

    if (!patronId || !items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(400, 'PatronId and items are required');
    }

    // Validate patron exists and belongs to user
    const patron = await getItem(TABLE_NAME, {
      pk: tenantId,
      sk: `PATRON#${patronId}`,
    });

    if (!patron) {
      return errorResponse(404, 'Patron not found');
    }

    // Validate and calculate total
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.menuId || !item.quantity || item.quantity <= 0) {
        return errorResponse(400, 'Invalid item format');
      }

      // Get menu item details
      const menuItem = await getItem(TABLE_NAME, {
        pk: 'TENANT#PUBLIC',
        sk: `MENU#${item.menuId}`,
      });

      if (!menuItem || !menuItem.isActive) {
        return errorResponse(400, `Menu item ${item.menuId} not found or inactive`);
      }

      const itemTotal = menuItem.price * item.quantity;
      total += itemTotal;

      validatedItems.push({
        menuId: item.menuId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal: itemTotal,
        remarks: item.remarks || '',
      });
    }

    const orderId = generateId();
    const now = getCurrentTimestamp();

    const order = {
      pk: tenantId,
      sk: `ORDER#${orderId}`,
      gsi2pk: `${tenantId}#PATRON#${patronId}`,
      gsi2sk: now,
      tenantId,
      orderId,
      patronId,
      patronName: patron.name,
      items: validatedItems,
      total,
      status: 'pending',
      createdAt: now,
    };

    await putItem(TABLE_NAME, order);

    // Send Slack notification
    try {
      await sendSlackNotification({
        orderId,
        userId: user.sub,
        userEmail: user.email,
        patronName: patron.name,
        items: validatedItems,
        total,
        createdAt: now,
      });
    } catch (slackError) {
      console.error('Slack notification failed:', slackError);
      // Don't fail the order creation if Slack fails
    }

    return response(201, {
      order: {
        id: orderId,
        patronId,
        patronName: patron.name,
        items: validatedItems,
        total,
        status: 'pending',
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

const sendSlackNotification = async (orderData) => {
  try {
    const webhookUrl = await getSSMParameter(SLACK_WEBHOOK_PARAM);
    
    if (!webhookUrl || webhookUrl === 'PLACEHOLDER_WEBHOOK_URL') {
      console.log('Slack webhook URL not configured, skipping notification');
      return;
    }

    const itemsText = orderData.items
      .map(item => `• ${item.name} x${item.quantity} (¥${item.subtotal.toLocaleString()})${item.remarks ? ` - ${item.remarks}` : ''}`)
      .join('\n');

    const message = {
      text: `🍺 新しい注文が入りました！`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🍺 新しい注文',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*注文ID:*\n${orderData.orderId}`,
            },
            {
              type: 'mrkdwn',
              text: `*注文者:*\n${orderData.patronName}`,
            },
            {
              type: 'mrkdwn',
              text: `*ユーザー:*\n${orderData.userEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*注文時刻:*\n${new Date(orderData.createdAt).toLocaleString('ja-JP')}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*注文内容:*\n${itemsText}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*合計金額: ¥${orderData.total.toLocaleString()}*`,
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }

    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    throw error;
  }
};