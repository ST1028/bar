const fs = require('fs');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = 'bar_app';

const parseSQLFile = (sqlFilePath) => {
  console.log('Parsing SQL file:', sqlFilePath);
  
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  const categories = [];
  const menus = [];

  // Extract menu categories
  const categoryMatch = sqlContent.match(/INSERT INTO `menu_categories`[^;]+;/s);
  if (categoryMatch) {
    const categoryInsert = categoryMatch[0];
    const categoryValues = categoryInsert.match(/\([^)]+\)/g);
    
    if (categoryValues) {
      categoryValues.forEach((value) => {
        const match = value.match(/\((\d+),'([^']+)',(\d+),'([^']+)','([^']*)',([01]),'[^']*','[^']*',[^)]*\)/);
        if (match) {
          const [, id, name, order, thumbnail, defaultThumbnail, isActive] = match;
          categories.push({
            id: parseInt(id),
            name: name,
            order: parseInt(order),
            thumbnail: thumbnail,
            defaultThumbnail: defaultThumbnail,
            isActive: parseInt(isActive) === 1,
          });
        }
      });
    }
  }

  // Extract menus
  const menuMatch = sqlContent.match(/INSERT INTO `menus`[^;]+;/s);
  if (menuMatch) {
    const menuInsert = menuMatch[0];
    const menuValues = menuInsert.match(/\([^)]+\)/g);
    
    if (menuValues) {
      menuValues.forEach((value) => {
        // More flexible regex to handle various quote patterns
        const match = value.match(/\((\d+),(\d+),'([^']+)',(\d+),'?([^']*)'?,'?([^']*)'?,([01]),([01]),'?([^']*)'?,[^)]*\)/);
        if (match) {
          const [, id, categoryId, name, price, recipe, description, isActive, isRemarksRequired, thumbnail] = match;
          menus.push({
            id: parseInt(id),
            categoryId: parseInt(categoryId),
            name: name,
            price: parseInt(price),
            recipe: recipe || '',
            description: description || '',
            isActive: parseInt(isActive) === 1,
            isRemarksRequired: parseInt(isRemarksRequired) === 1,
            thumbnail: thumbnail || '',
          });
        }
      });
    }
  }

  console.log(`Found ${categories.length} categories and ${menus.length} menu items`);
  return { categories, menus };
};

const createDynamoDBItems = (categories, menus) => {
  const items = [];

  // Create category items
  categories.forEach((category) => {
    items.push({
      pk: 'TENANT#PUBLIC',
      sk: `CATEGORY#${category.id}`,
      gsi1pk: 'MENU#CATEGORY',
      gsi1sk: category.order.toString().padStart(3, '0'), // Zero-pad for proper sorting
      categoryId: category.id.toString(),
      name: category.name,
      order: category.order,
      thumbnail: category.thumbnail,
      defaultThumbnail: category.defaultThumbnail,
      isActive: category.isActive,
      type: 'category',
    });
  });

  // Create menu items
  menus.forEach((menu) => {
    const category = categories.find(c => c.id === menu.categoryId);
    const categoryName = category ? category.name : 'Unknown';
    
    items.push({
      pk: 'TENANT#PUBLIC',
      sk: `MENU#${menu.id}`,
      gsi1pk: `MENU#CATEGORY#${menu.categoryId}`,
      gsi1sk: menu.name,
      menuId: menu.id.toString(),
      categoryId: menu.categoryId.toString(),
      categoryName: categoryName,
      name: menu.name,
      price: menu.price,
      recipe: menu.recipe,
      description: menu.description,
      isActive: menu.isActive,
      isRemarksRequired: menu.isRemarksRequired,
      thumbnail: menu.thumbnail,
      type: 'menu',
    });
  });

  return items;
};

const batchWriteToDynamoDB = async (items) => {
  const batchSize = 25; // DynamoDB batch limit
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const requestItems = batch.map(item => ({
      PutRequest: { Item: item }
    }));

    try {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: requestItems
        }
      });

      await docClient.send(command);
      console.log(`Batch ${Math.floor(i / batchSize) + 1} completed (${batch.length} items)`);
    } catch (error) {
      console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
      throw error;
    }
  }
};

const saveToJSON = (categories, menus, outputPath) => {
  const data = {
    categories: categories,
    menus: menus,
    exportedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log('Menu data exported to:', outputPath);
};

const main = async () => {
  try {
    const sqlFilePath = process.argv[2] || '/Users/shoun/Downloads/bar_2025-08-09.sql';
    const jsonOutputPath = path.join(__dirname, 'menus.json');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('SQL file not found:', sqlFilePath);
      process.exit(1);
    }

    console.log('Starting menu migration...');
    
    // Parse SQL file
    const { categories, menus } = parseSQLFile(sqlFilePath);
    
    // Save to JSON for backup
    saveToJSON(categories, menus, jsonOutputPath);
    
    // Create DynamoDB items
    const dynamoItems = createDynamoDBItems(categories, menus);
    console.log(`Created ${dynamoItems.length} DynamoDB items`);
    
    // Upload to DynamoDB
    if (process.env.SKIP_DYNAMODB !== 'true') {
      console.log('Uploading to DynamoDB...');
      await batchWriteToDynamoDB(dynamoItems);
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️ Skipping DynamoDB upload (SKIP_DYNAMODB=true)');
    }

    // Display summary
    console.log('\\n📊 Summary:');
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Menu items: ${menus.length}`);
    console.log(`- Active categories: ${categories.filter(c => c.isActive).length}`);
    console.log(`- Active menu items: ${menus.filter(m => m.isActive).length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { parseSQLFile, createDynamoDBItems, saveToJSON };