const { 
  response, 
  errorResponse, 
  getUserFromEvent,
  getTenantId,
  isAdmin,
  queryItems,
  batchWrite,
  putItem,
  updateItem,
  deleteItem
} = require('/opt/nodejs/utils');
const { v4: uuidv4 } = require('uuid');

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

    const { httpMethod, resource } = event;
    console.log(`Processing request: ${httpMethod} ${resource}`);

    switch (httpMethod) {
      case 'GET':
        if (resource === '/admin/menu-items') {
          return await getMenuItems();
        } else if (resource === '/admin/categories') {
          return await getCategories();
        } else if (resource === '/admin/blends') {
          return await getBlends();
        }
        console.error(`GET route not found: ${resource}`);
        return errorResponse(404, 'Resource not found');
      case 'POST':
        if (resource === '/admin/reset') {
          return await resetUserData(event);
        } else if (resource === '/admin/reset-all') {
          return await resetAllOrders(event);
        } else if (resource === '/admin/menu-items') {
          return await createMenuItem(event);
        } else if (resource === '/admin/categories') {
          return await createCategory(event);
        } else if (resource === '/admin/blends') {
          return await createBlend(event);
        }
        console.error(`POST route not found: ${resource}`);
        return errorResponse(404, 'Resource not found');
      case 'PATCH':
        if (resource === '/admin/menu-items/{id}') {
          return await updateMenuItem(event);
        } else if (resource === '/admin/categories/{id}') {
          return await updateCategory(event);
        } else if (resource === '/admin/blends/{id}') {
          return await updateBlend(event);
        }
        console.error(`PATCH route not found: ${resource}`);
        return errorResponse(404, 'Resource not found');
      case 'DELETE':
        if (resource === '/admin/menu-items/{id}') {
          return await deleteMenuItem(event);
        } else if (resource === '/admin/categories/{id}') {
          return await deleteCategory(event);
        } else if (resource === '/admin/blends/{id}') {
          return await deleteBlend(event);
        }
        console.error(`DELETE route not found: ${resource}`);
        return errorResponse(404, 'Resource not found');
      default:
        console.error(`Method not allowed: ${httpMethod}`);
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

// Menu Items CRUD
const getMenuItems = async () => {
  try {
    const menuItems = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'MENU#' },
    });

    const items = menuItems.map(item => ({
      id: item.menuId,
      name: item.name,
      price: item.price,
      description: item.description,
      recipe: item.recipe,
      categoryId: item.categoryId,
      availableBlends: item.availableBlends || [],
      isActive: item.isActive,
    }));

    return response(200, { items });
  } catch (error) {
    console.error('Error getting menu items:', error);
    throw error;
  }
};

const createMenuItem = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, price, description, categoryId, recipe, availableBlends } = body;

    if (!name || !price || !categoryId) {
      return errorResponse(400, 'Name, price, and categoryId are required');
    }

    const menuId = uuidv4();
    const timestamp = new Date().toISOString();

    const item = {
      pk: 'TENANT#PUBLIC',
      sk: `MENU#${menuId}`,
      menuId,
      name,
      price: Number(price),
      description: description || '',
      recipe: recipe || '',
      categoryId,
      availableBlends: availableBlends || [],
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await putItem(TABLE_NAME, item);

    return response(201, {
      item: {
        id: menuId,
        name,
        price: Number(price),
        description: description || '',
        recipe: recipe || '',
        categoryId,
        availableBlends: availableBlends || [],
        isActive: true,
      }
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
};

const updateMenuItem = async (event) => {
  try {
    const menuId = event.pathParameters?.id;
    if (!menuId) {
      return errorResponse(400, 'Menu item ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    console.log('Update menu item request body:', JSON.stringify(body, null, 2));
    const { name, price, description, categoryId, recipe, isActive, availableBlends } = body;

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name !== undefined) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (price !== undefined) {
      updateExpression.push('#price = :price');
      expressionAttributeNames['#price'] = 'price';
      expressionAttributeValues[':price'] = Number(price);
    }

    if (description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (recipe !== undefined) {
      updateExpression.push('#recipe = :recipe');
      expressionAttributeNames['#recipe'] = 'recipe';
      expressionAttributeValues[':recipe'] = recipe;
    }

    if (categoryId !== undefined) {
      updateExpression.push('#categoryId = :categoryId');
      expressionAttributeNames['#categoryId'] = 'categoryId';
      expressionAttributeValues[':categoryId'] = categoryId;
    }

    if (isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = isActive;
    }

    if (availableBlends !== undefined) {
      updateExpression.push('#availableBlends = :availableBlends');
      expressionAttributeNames['#availableBlends'] = 'availableBlends';
      expressionAttributeValues[':availableBlends'] = availableBlends || [];
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await updateItem(
      TABLE_NAME,
      {
        pk: 'TENANT#PUBLIC',
        sk: `MENU#${menuId}`
      },
      `SET ${updateExpression.join(', ')}`,
      expressionAttributeValues,
      expressionAttributeNames
    );

    return response(200, {
      item: {
        id: menuId,
        name,
        price: Number(price),
        description,
        recipe,
        categoryId,
        availableBlends,
        isActive
      }
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
};

const deleteMenuItem = async (event) => {
  try {
    const menuId = event.pathParameters?.id;
    if (!menuId) {
      return errorResponse(400, 'Menu item ID is required');
    }

    await deleteItem(TABLE_NAME, {
      pk: 'TENANT#PUBLIC',
      sk: `MENU#${menuId}`
    });

    return response(200, { message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
};

// Categories CRUD
const getCategories = async () => {
  try {
    const categories = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'CATEGORY#' },
    });

    const items = categories.map(cat => ({
      id: cat.categoryId,
      name: cat.name,
      description: cat.description,
      visible: cat.isActive !== false,
      order: cat.order,
    }));

    return response(200, { categories: items });
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

const createCategory = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, description, visible } = body;

    if (!name) {
      return errorResponse(400, 'Name is required');
    }

    const categoryId = uuidv4();
    const timestamp = new Date().toISOString();

    // Get max order for new category
    const categories = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'CATEGORY#' },
    });

    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order || 0)) : 0;

    const item = {
      pk: 'TENANT#PUBLIC',
      sk: `CATEGORY#${categoryId}`,
      categoryId,
      name,
      description: description || '',
      isActive: visible !== false,
      order: maxOrder + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await putItem(TABLE_NAME, item);

    return response(201, {
      category: {
        id: categoryId,
        name,
        description: description || '',
        visible: visible !== false,
        order: maxOrder + 1,
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

const updateCategory = async (event) => {
  try {
    const categoryId = event.pathParameters?.id;
    if (!categoryId) {
      return errorResponse(400, 'Category ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    console.log('Update category request body:', JSON.stringify(body, null, 2));
    const { name, description, visible, order } = body;

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name !== undefined) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (visible !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = visible;
    }

    if (order !== undefined) {
      updateExpression.push('#order = :order');
      expressionAttributeNames['#order'] = 'order';
      expressionAttributeValues[':order'] = Number(order);
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateParams = {
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    console.log('DynamoDB update parameters:', JSON.stringify(updateParams, null, 2));

    await updateItem(
      TABLE_NAME,
      {
        pk: 'TENANT#PUBLIC',
        sk: `CATEGORY#${categoryId}`
      },
      updateParams.UpdateExpression,
      updateParams.ExpressionAttributeValues,
      updateParams.ExpressionAttributeNames
    );

    return response(200, {
      category: {
        id: categoryId,
        name,
        description,
        visible,
        order
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

const deleteCategory = async (event) => {
  try {
    const categoryId = event.pathParameters?.id;
    if (!categoryId) {
      return errorResponse(400, 'Category ID is required');
    }

    // Check if category has menu items
    const menuItems = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'MENU#' },
    });

    const categoryMenuItems = menuItems.filter(item => item.categoryId === categoryId);
    
    if (categoryMenuItems.length > 0) {
      return errorResponse(400, 'Cannot delete category that contains menu items');
    }

    await deleteItem(TABLE_NAME, {
      pk: 'TENANT#PUBLIC',
      sk: `CATEGORY#${categoryId}`
    });

    return response(200, { message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Blends CRUD
const getBlends = async () => {
  try {
    const blends = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'BLEND#' },
    });

    const items = blends.map(blend => ({
      id: blend.blendId,
      name: blend.name,
      description: blend.description,
      isActive: blend.isActive !== false,
      order: blend.order,
    }));

    return response(200, { blends: items });
  } catch (error) {
    console.error('Error getting blends:', error);
    throw error;
  }
};

const createBlend = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { name, description, isActive } = body;

    if (!name) {
      return errorResponse(400, 'Name is required');
    }

    const blendId = uuidv4();
    const timestamp = new Date().toISOString();

    // Get max order for new blend
    const blends = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'BLEND#' },
    });

    const maxOrder = blends.length > 0 ? Math.max(...blends.map(b => b.order || 0)) : 0;

    const item = {
      pk: 'TENANT#PUBLIC',
      sk: `BLEND#${blendId}`,
      blendId,
      name,
      description: description || '',
      isActive: isActive !== false,
      order: maxOrder + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await putItem(TABLE_NAME, item);

    return response(201, {
      blend: {
        id: blendId,
        name,
        description: description || '',
        isActive: isActive !== false,
        order: maxOrder + 1,
      }
    });
  } catch (error) {
    console.error('Error creating blend:', error);
    throw error;
  }
};

const updateBlend = async (event) => {
  try {
    const blendId = event.pathParameters?.id;
    if (!blendId) {
      return errorResponse(400, 'Blend ID is required');
    }

    const body = JSON.parse(event.body || '{}');
    console.log('Update blend request body:', JSON.stringify(body, null, 2));
    const { name, description, isActive, order } = body;

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name !== undefined) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = description;
    }

    if (isActive !== undefined) {
      updateExpression.push('#isActive = :isActive');
      expressionAttributeNames['#isActive'] = 'isActive';
      expressionAttributeValues[':isActive'] = isActive;
    }

    if (order !== undefined) {
      updateExpression.push('#order = :order');
      expressionAttributeNames['#order'] = 'order';
      expressionAttributeValues[':order'] = Number(order);
    }

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateParams = {
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    console.log('DynamoDB update parameters:', JSON.stringify(updateParams, null, 2));

    await updateItem(
      TABLE_NAME,
      {
        pk: 'TENANT#PUBLIC',
        sk: `BLEND#${blendId}`
      },
      updateParams.UpdateExpression,
      updateParams.ExpressionAttributeValues,
      updateParams.ExpressionAttributeNames
    );

    return response(200, {
      blend: {
        id: blendId,
        name,
        description,
        isActive,
        order
      }
    });
  } catch (error) {
    console.error('Error updating blend:', error);
    throw error;
  }
};

const deleteBlend = async (event) => {
  try {
    const blendId = event.pathParameters?.id;
    if (!blendId) {
      return errorResponse(400, 'Blend ID is required');
    }

    // Check if blend is used in menu items
    const menuItems = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'MENU#' },
    });

    const menuItemsUsingBlend = menuItems.filter(item => 
      item.availableBlends && item.availableBlends.includes(blendId)
    );
    
    if (menuItemsUsingBlend.length > 0) {
      return errorResponse(400, 'Cannot delete blend that is used in menu items');
    }

    await deleteItem(TABLE_NAME, {
      pk: 'TENANT#PUBLIC',
      sk: `BLEND#${blendId}`
    });

    return response(200, { message: 'Blend deleted successfully' });
  } catch (error) {
    console.error('Error deleting blend:', error);
    throw error;
  }
};