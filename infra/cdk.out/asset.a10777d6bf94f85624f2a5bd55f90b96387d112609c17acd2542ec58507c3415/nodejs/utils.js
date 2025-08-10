const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { v4: uuidv4 } = require('uuid');

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });

const response = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers,
  },
  body: JSON.stringify(body),
});

const errorResponse = (statusCode, message, code = null) => 
  response(statusCode, { message, ...(code && { code }) });

const getUserFromEvent = (event) => {
  const claims = event.requestContext.authorizer.claims;
  return {
    sub: claims.sub,
    email: claims.email,
    groups: claims['cognito:groups'] ? claims['cognito:groups'].split(',') : [],
  };
};

const getTenantId = (sub) => `USER#${sub}`;

const isAdmin = (user) => user.groups.includes('admin');

const generateId = () => uuidv4();

const getCurrentTimestamp = () => new Date().toISOString();

const putItem = async (tableName, item) => {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  return docClient.send(command);
};

const getItem = async (tableName, key) => {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  const result = await docClient.send(command);
  return result.Item;
};

const queryItems = async (tableName, keyCondition, options = {}) => {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyCondition.expression,
    ExpressionAttributeNames: keyCondition.names,
    ExpressionAttributeValues: keyCondition.values,
    ...options,
  });
  const result = await docClient.send(command);
  return result.Items || [];
};

const updateItem = async (tableName, key, updateExpression, attributeValues, attributeNames = {}) => {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: attributeValues,
    ...(Object.keys(attributeNames).length > 0 && { ExpressionAttributeNames: attributeNames }),
    ReturnValues: 'ALL_NEW',
  });
  const result = await docClient.send(command);
  return result.Attributes;
};

const deleteItem = async (tableName, key) => {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });
  return docClient.send(command);
};

const batchWrite = async (tableName, items, operation = 'PUT') => {
  const requestItems = items.map(item => ({
    [operation === 'PUT' ? 'PutRequest' : 'DeleteRequest']: 
      operation === 'PUT' ? { Item: item } : { Key: item }
  }));

  const command = new BatchWriteCommand({
    RequestItems: {
      [tableName]: requestItems,
    },
  });
  return docClient.send(command);
};

const getSSMParameter = async (parameterName) => {
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });
  const result = await ssmClient.send(command);
  return result.Parameter.Value;
};

module.exports = {
  response,
  errorResponse,
  getUserFromEvent,
  getTenantId,
  isAdmin,
  generateId,
  getCurrentTimestamp,
  putItem,
  getItem,
  queryItems,
  updateItem,
  deleteItem,
  batchWrite,
  getSSMParameter,
};