const { 
  response, 
  errorResponse, 
  getUserFromEvent,
  getTenantId,
  generateId,
  getCurrentTimestamp,
  putItem,
  queryItems,
  updateItem,
  getItem
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
    const tenantId = getTenantId(user.sub);

    switch (event.httpMethod) {
      case 'GET':
        return await getPatrons(tenantId);
      case 'POST':
        return await createPatron(event, tenantId);
      case 'PATCH':
        return await updatePatron(event, tenantId);
      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

const getPatrons = async (tenantId) => {
  try {
    const patrons = await queryItems(TABLE_NAME, {
      expression: '#gsi1pk = :gsi1pk',
      names: { '#gsi1pk': 'gsi1pk' },
      values: { ':gsi1pk': `${tenantId}#PATRON` },
    }, {
      IndexName: 'gsi1',
    });

    const result = patrons.map(patron => ({
      id: patron.patronId,
      name: patron.name,
      createdAt: patron.createdAt,
    })).sort((a, b) => a.name.localeCompare(b.name));

    return response(200, { patrons: result });
  } catch (error) {
    console.error('Error getting patrons:', error);
    throw error;
  }
};

const createPatron = async (event, tenantId) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse(400, 'Name is required');
    }

    const patronId = generateId();
    const now = getCurrentTimestamp();

    const patron = {
      pk: tenantId,
      sk: `PATRON#${patronId}`,
      gsi1pk: `${tenantId}#PATRON`,
      gsi1sk: name.trim(),
      tenantId,
      patronId,
      name: name.trim(),
      createdAt: now,
    };

    await putItem(TABLE_NAME, patron);

    return response(201, {
      patron: {
        id: patronId,
        name: name.trim(),
        createdAt: now,
      },
    });
  } catch (error) {
    console.error('Error creating patron:', error);
    throw error;
  }
};

const updatePatron = async (event, tenantId) => {
  try {
    const patronId = event.pathParameters?.patronId;
    const body = JSON.parse(event.body || '{}');
    const { name } = body;

    if (!patronId) {
      return errorResponse(400, 'Patron ID is required');
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse(400, 'Name is required');
    }

    // Check if patron exists and belongs to user
    const existingPatron = await getItem(TABLE_NAME, {
      pk: tenantId,
      sk: `PATRON#${patronId}`,
    });

    if (!existingPatron) {
      return errorResponse(404, 'Patron not found');
    }

    const updatedPatron = await updateItem(
      TABLE_NAME,
      { pk: tenantId, sk: `PATRON#${patronId}` },
      'SET #name = :name, #gsi1sk = :name',
      { ':name': name.trim() },
      { '#name': 'name', '#gsi1sk': 'gsi1sk' }
    );

    return response(200, {
      patron: {
        id: patronId,
        name: updatedPatron.name,
        createdAt: updatedPatron.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating patron:', error);
    throw error;
  }
};