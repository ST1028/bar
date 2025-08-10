const { 
  response, 
  errorResponse, 
  queryItems 
} = require('/opt/nodejs/utils');

const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return response(200, {});
    }
    
    if (event.httpMethod === 'GET') {
      return await getMenus();
    }

    return errorResponse(405, 'Method not allowed');
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, 'Internal server error');
  }
};

const getMenus = async () => {
  try {
    console.log('Getting menus from DynamoDB...');
    
    // Get menu categories
    const categories = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'CATEGORY#' },
    });

    console.log(`Found ${categories.length} categories`);

    // Get all menu items
    const menuItems = await queryItems(TABLE_NAME, {
      expression: '#pk = :pk AND begins_with(#sk, :sk)',
      names: { '#pk': 'pk', '#sk': 'sk' },
      values: { ':pk': 'TENANT#PUBLIC', ':sk': 'MENU#' },
    });

    // Group menu items by category
    const menusByCategory = categories.map(category => ({
      id: category.categoryId,
      name: category.name,
      order: category.order,
      thumbnail: category.thumbnail,
      isActive: category.isActive,
      items: menuItems
        .filter(item => item.categoryId === category.categoryId && item.isActive)
        .map(item => ({
          id: item.menuId,
          name: item.name,
          price: item.price,
          description: item.description,
          recipe: item.recipe,
          thumbnail: item.thumbnail,
          isRemarksRequired: item.isRemarksRequired,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter(category => category.isActive)
    .sort((a, b) => a.order - b.order);

    return response(200, { categories: menusByCategory });
  } catch (error) {
    console.error('Error getting menus:', error);
    throw error;
  }
};