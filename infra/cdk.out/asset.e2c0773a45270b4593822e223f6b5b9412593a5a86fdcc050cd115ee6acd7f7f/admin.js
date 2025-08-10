const { 
  response, 
  errorResponse, 
  getUserFromEvent,
  getTenantId,
  isAdmin,
  queryItems,
  batchWrite
} = require('/opt/nodejs/utils');

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return response(200, {});
    }

    const user = getUserFromEvent(event);

    if (!isAdmin(user)) {
      return errorResponse(403, 'Admin access required');
    }

    switch (event.httpMethod) {
      case 'POST':
        if (event.resource === '/admin/reset') {
          return await resetUserData(event);
        } else if (event.resource === '/admin/reset-all') {
          return await resetAllOrders(event);
        }
        return errorResponse(404, 'Resource not found');
      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

const resetUserData = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { tenantId } = body;

    if (!tenantId) {
      return errorResponse(400, 'TenantId is required');
    }

    // Get all patrons and orders for the tenant
    const patronsAndOrders = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk',
      names: { '#pk': 'pk' },
      values: { ':pk': tenantId },
    });

    if (patronsAndOrders.length === 0) {
      return response(200, { message: 'No data found to reset', deletedCount: 0 });
    }

    // Delete items in batches (DynamoDB batch limit is 25 items)
    const batchSize = 25;
    let deletedCount = 0;

    for (let i = 0; i < patronsAndOrders.length; i += batchSize) {
      const batch = patronsAndOrders.slice(i, i + batchSize);
      const deleteKeys = batch.map(item => ({
        pk: item.pk,
        sk: item.sk,
      }));

      await batchWrite(TABLE_NAME, deleteKeys, 'DELETE');
      deletedCount += deleteKeys.length;
    }

    return response(200, { 
      message: 'User data reset successfully', 
      deletedCount,
      tenantId 
    });
  } catch (error) {
    console.error('Error resetting user data:', error);
    throw error;
  }
};

const resetAllOrders = async (event) => {
  try {
    const user = getUserFromEvent(event);
    const currentTenantId = getTenantId(user.sub);
    
    // Get all patrons and orders for the current tenant
    const patronsAndOrders = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk',
      names: { '#pk': 'pk' },
      values: { ':pk': currentTenantId },
    });

    if (patronsAndOrders.length === 0) {
      return response(200, { message: 'No orders found to reset', deletedCount: 0 });
    }

    // Delete items in batches (DynamoDB batch limit is 25 items)
    const batchSize = 25;
    let deletedCount = 0;

    for (let i = 0; i < patronsAndOrders.length; i += batchSize) {
      const batch = patronsAndOrders.slice(i, i + batchSize);
      const deleteKeys = batch.map(item => ({
        pk: item.pk,
        sk: item.sk,
      }));

      await batchWrite(TABLE_NAME, deleteKeys, 'DELETE');
      deletedCount += deleteKeys.length;
    }

    return response(200, { 
      message: 'All orders and patrons reset successfully', 
      deletedCount 
    });
  } catch (error) {
    console.error('Error resetting all orders:', error);
    throw error;
  }
};