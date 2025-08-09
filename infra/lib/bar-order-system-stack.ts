import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class BarOrderSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'BarAppTable', {
      tableName: 'bar_app',
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // GSI1: Patron list
    table.addGlobalSecondaryIndex({
      indexName: 'gsi1',
      partitionKey: { name: 'gsi1pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: dynamodb.AttributeType.STRING },
    });

    // GSI2: Order history
    table.addGlobalSecondaryIndex({
      indexName: 'gsi2',
      partitionKey: { name: 'gsi2pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'gsi2sk', type: dynamodb.AttributeType.STRING },
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'BarAppUserPool', {
      userPoolName: 'bar-app-user-pool',
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Admin Group
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'admin',
      description: 'Administrator group',
    });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'BarAppUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // SSM Parameter for Slack Webhook URL
    const slackWebhookParam = new ssm.StringParameter(this, 'SlackWebhookUrl', {
      parameterName: '/bar-app/slack/webhook-url',
      stringValue: 'PLACEHOLDER_WEBHOOK_URL',
      description: 'Slack webhook URL for order notifications',
    });

    // Lambda Layer for shared code
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset('../services/layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Shared utilities and AWS SDK v3',
    });

    // Lambda execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
              ],
              resources: [
                table.tableArn,
                `${table.tableArn}/index/*`,
              ],
            }),
          ],
        }),
        SSMAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter'],
              resources: [slackWebhookParam.parameterArn],
            }),
          ],
        }),
      },
    });

    // Lambda Functions
    const menusFunction = new lambda.Function(this, 'MenusFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'menus.handler',
      code: lambda.Code.fromAsset('../services/functions'),
      layers: [sharedLayer],
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const patronsFunction = new lambda.Function(this, 'PatronsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'patrons.handler',
      code: lambda.Code.fromAsset('../services/functions'),
      layers: [sharedLayer],
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const ordersFunction = new lambda.Function(this, 'OrdersFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'orders.handler',
      code: lambda.Code.fromAsset('../services/functions'),
      layers: [sharedLayer],
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
        SLACK_WEBHOOK_PARAM: slackWebhookParam.parameterName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    const adminFunction = new lambda.Function(this, 'AdminFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'admin.handler',
      code: lambda.Code.fromAsset('../services/functions'),
      layers: [sharedLayer],
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName,
        USER_POOL_ID: userPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'BarAppApi', {
      restApiName: 'bar-app-api',
      description: 'Bar Order System API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // API Routes
    const menusResource = api.root.addResource('menus');
    menusResource.addMethod('GET', new apigateway.LambdaIntegration(menusFunction), {
      authorizer,
    });

    const patronsResource = api.root.addResource('patrons');
    patronsResource.addMethod('GET', new apigateway.LambdaIntegration(patronsFunction), {
      authorizer,
    });
    patronsResource.addMethod('POST', new apigateway.LambdaIntegration(patronsFunction), {
      authorizer,
    });
    
    const patronResource = patronsResource.addResource('{patronId}');
    patronResource.addMethod('PATCH', new apigateway.LambdaIntegration(patronsFunction), {
      authorizer,
    });

    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod('GET', new apigateway.LambdaIntegration(ordersFunction), {
      authorizer,
    });
    ordersResource.addMethod('POST', new apigateway.LambdaIntegration(ordersFunction), {
      authorizer,
    });

    const adminResource = api.root.addResource('admin');
    const resetResource = adminResource.addResource('reset');
    resetResource.addMethod('POST', new apigateway.LambdaIntegration(adminFunction), {
      authorizer,
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });
  }
}