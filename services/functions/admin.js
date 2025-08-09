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
    const user = getUserFromEvent(event);

    if (!isAdmin(user)) {
      return errorResponse(403, 'Admin access required');
    }

    switch (event.httpMethod) {
      case 'POST':
        return await resetUserData(event);
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