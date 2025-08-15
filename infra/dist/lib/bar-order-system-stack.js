"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarOrderSystemStack = void 0;
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const ssm = require("aws-cdk-lib/aws-ssm");
const iam = require("aws-cdk-lib/aws-iam");
const s3 = require("aws-cdk-lib/aws-s3");
class BarOrderSystemStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        // S3 Bucket for static assets (logos, images)
        const assetsBucket = new s3.Bucket(this, 'BarAppAssets', {
            bucketName: `bar-app-assets-${this.account}-${this.region}`,
            publicReadAccess: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                    maxAge: 3000,
                },
            ],
            removalPolicy: cdk.RemovalPolicy.RETAIN,
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
                adminUserPassword: true,
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
                                'dynamodb:Scan',
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
        menusResource.addMethod('GET', new apigateway.LambdaIntegration(menusFunction));
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
        const resetAllResource = adminResource.addResource('reset-all');
        resetAllResource.addMethod('POST', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        // Admin Menu Management Routes
        const adminMenuItemsResource = adminResource.addResource('menu-items');
        adminMenuItemsResource.addMethod('GET', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        adminMenuItemsResource.addMethod('POST', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        const adminMenuItemResource = adminMenuItemsResource.addResource('{id}');
        adminMenuItemResource.addMethod('PATCH', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        adminMenuItemResource.addMethod('DELETE', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        // Admin Category Management Routes
        const adminCategoriesResource = adminResource.addResource('categories');
        adminCategoriesResource.addMethod('GET', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        adminCategoriesResource.addMethod('POST', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        const adminCategoryResource = adminCategoriesResource.addResource('{id}');
        adminCategoryResource.addMethod('PATCH', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        adminCategoryResource.addMethod('DELETE', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        // Admin Blend Management Routes
        const adminBlendsResource = adminResource.addResource('blends');
        adminBlendsResource.addMethod('GET', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        adminBlendsResource.addMethod('POST', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        const adminBlendResource = adminBlendsResource.addResource('{id}');
        adminBlendResource.addMethod('PATCH', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        adminBlendResource.addMethod('DELETE', new apigateway.LambdaIntegration(adminFunction), {
            authorizer,
        });
        // Note: Amplify hosting setup requires GitHub token and manual configuration
        // For now, commented out to avoid deployment issues
        // Users can manually set up Amplify Hosting via AWS Console
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
        new cdk.CfnOutput(this, 'AssetsBucketName', {
            value: assetsBucket.bucketName,
            description: 'S3 Assets Bucket Name',
        });
        new cdk.CfnOutput(this, 'AssetsBucketUrl', {
            value: assetsBucket.bucketWebsiteUrl,
            description: 'S3 Assets Bucket URL',
        });
        // Note: Amplify App URL will be available after manual setup
    }
}
exports.BarOrderSystemStack = BarOrderSystemStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFyLW9yZGVyLXN5c3RlbS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9iYXItb3JkZXItc3lzdGVtLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyxtREFBbUQ7QUFDbkQscURBQXFEO0FBQ3JELGlEQUFpRDtBQUNqRCx5REFBeUQ7QUFDekQsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx5Q0FBeUM7QUFJekMsTUFBYSxtQkFBb0IsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNoRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGlCQUFpQjtRQUNqQixNQUFNLEtBQUssR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNwRCxTQUFTLEVBQUUsU0FBUztZQUNwQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUM1RCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07U0FDeEMsQ0FBQyxDQUFDO1FBRUgsb0JBQW9CO1FBQ3BCLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQztZQUM1QixTQUFTLEVBQUUsTUFBTTtZQUNqQixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVB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LENBQUMsZ0JBQWdCO1lBQ3RDLFdBQVcsRUFBRSw2QkFBNkI7U0FDM0MsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHO1lBQ2QsV0FBVyxFQUFFLGlCQUFpQjtTQUMvQixDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNuQyxLQUFLLEVBQUUsS0FBSyxDQUFDLFNBQVM7WUFDdEIsV0FBVyxFQUFFLHFCQUFxQjtTQUNuQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFDLEtBQUssRUFBRSxZQUFZLENBQUMsVUFBVTtZQUM5QixXQUFXLEVBQUUsdUJBQXVCO1NBQ3JDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDekMsS0FBSyxFQUFFLFlBQVksQ0FBQyxnQkFBZ0I7WUFDcEMsV0FBVyxFQUFFLHNCQUFzQjtTQUNwQyxDQUFDLENBQUM7UUFFSCw2REFBNkQ7SUFDL0QsQ0FBQztDQUNGO0FBOVVELGtEQThVQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIHNzbSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3NtJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgKiBhcyBhbXBsaWZ5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hbXBsaWZ5JztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgQmFyT3JkZXJTeXN0ZW1TdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIER5bmFtb0RCIFRhYmxlXG4gICAgY29uc3QgdGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0JhckFwcFRhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiAnYmFyX2FwcCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3BrJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ3NrJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgfSk7XG5cbiAgICAvLyBHU0kxOiBQYXRyb24gbGlzdFxuICAgIHRhYmxlLmFkZEdsb2JhbFNlY29uZGFyeUluZGV4KHtcbiAgICAgIGluZGV4TmFtZTogJ2dzaTEnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdnc2kxcGsnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiAnZ3NpMXNrJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICB9KTtcblxuICAgIC8vIEdTSTI6IE9yZGVyIGhpc3RvcnlcbiAgICB0YWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdnc2kyJyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnZ3NpMnBrJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2dzaTJzaycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgfSk7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIHN0YXRpYyBhc3NldHMgKGxvZ29zLCBpbWFnZXMpXG4gICAgY29uc3QgYXNzZXRzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQmFyQXBwQXNzZXRzJywge1xuICAgICAgYnVja2V0TmFtZTogYGJhci1hcHAtYXNzZXRzLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiB0cnVlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FDTFMsXG4gICAgICBjb3JzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogW3MzLkh0dHBNZXRob2RzLkdFVCwgczMuSHR0cE1ldGhvZHMuSEVBRF0sXG4gICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnKiddLFxuICAgICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgICAgICBtYXhBZ2U6IDMwMDAsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgLy8gQ29nbml0byBVc2VyIFBvb2xcbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdCYXJBcHBVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogJ2Jhci1hcHAtdXNlci1wb29sJyxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICB9LFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogZmFsc2UsXG4gICAgICB9LFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgLy8gQWRtaW4gR3JvdXBcbiAgICBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsICdBZG1pbkdyb3VwJywge1xuICAgICAgdXNlclBvb2xJZDogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGdyb3VwTmFtZTogJ2FkbWluJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWRtaW5pc3RyYXRvciBncm91cCcsXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIFBvb2wgQ2xpZW50XG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCAnQmFyQXBwVXNlclBvb2xDbGllbnQnLCB7XG4gICAgICB1c2VyUG9vbCxcbiAgICAgIGF1dGhGbG93czoge1xuICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIHVzZXJTcnA6IHRydWUsXG4gICAgICAgIGFkbWluVXNlclBhc3N3b3JkOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGdlbmVyYXRlU2VjcmV0OiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIFNTTSBQYXJhbWV0ZXIgZm9yIFNsYWNrIFdlYmhvb2sgVVJMXG4gICAgY29uc3Qgc2xhY2tXZWJob29rUGFyYW0gPSBuZXcgc3NtLlN0cmluZ1BhcmFtZXRlcih0aGlzLCAnU2xhY2tXZWJob29rVXJsJywge1xuICAgICAgcGFyYW1ldGVyTmFtZTogJy9iYXItYXBwL3NsYWNrL3dlYmhvb2stdXJsJyxcbiAgICAgIHN0cmluZ1ZhbHVlOiAnUExBQ0VIT0xERVJfV0VCSE9PS19VUkwnLFxuICAgICAgZGVzY3JpcHRpb246ICdTbGFjayB3ZWJob29rIFVSTCBmb3Igb3JkZXIgbm90aWZpY2F0aW9ucycsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgTGF5ZXIgZm9yIHNoYXJlZCBjb2RlXG4gICAgY29uc3Qgc2hhcmVkTGF5ZXIgPSBuZXcgbGFtYmRhLkxheWVyVmVyc2lvbih0aGlzLCAnU2hhcmVkTGF5ZXInLCB7XG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL3NlcnZpY2VzL2xheWVyJyksXG4gICAgICBjb21wYXRpYmxlUnVudGltZXM6IFtsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWF0sXG4gICAgICBkZXNjcmlwdGlvbjogJ1NoYXJlZCB1dGlsaXRpZXMgYW5kIEFXUyBTREsgdjMnLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIGV4ZWN1dGlvbiByb2xlXG4gICAgY29uc3QgbGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnTGFtYmRhRXhlY3V0aW9uUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpLFxuICAgICAgXSxcbiAgICAgIGlubGluZVBvbGljaWVzOiB7XG4gICAgICAgIER5bmFtb0RCQWNjZXNzOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpHZXRJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6UHV0SXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlVwZGF0ZUl0ZW0nLFxuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpEZWxldGVJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6UXVlcnknLFxuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpTY2FuJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6QmF0Y2hHZXRJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6QmF0Y2hXcml0ZUl0ZW0nLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAgICB0YWJsZS50YWJsZUFybixcbiAgICAgICAgICAgICAgICBgJHt0YWJsZS50YWJsZUFybn0vaW5kZXgvKmAsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgU1NNQWNjZXNzOiBuZXcgaWFtLlBvbGljeURvY3VtZW50KHtcbiAgICAgICAgICBzdGF0ZW1lbnRzOiBbXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICAgICAgYWN0aW9uczogWydzc206R2V0UGFyYW1ldGVyJ10sXG4gICAgICAgICAgICAgIHJlc291cmNlczogW3NsYWNrV2ViaG9va1BhcmFtLnBhcmFtZXRlckFybl0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgRnVuY3Rpb25zXG4gICAgY29uc3QgbWVudXNGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ01lbnVzRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdtZW51cy5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vc2VydmljZXMvZnVuY3Rpb25zJyksXG4gICAgICBsYXllcnM6IFtzaGFyZWRMYXllcl0sXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgICBVU0VSX1BPT0xfSUQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgIH0pO1xuXG4gICAgY29uc3QgcGF0cm9uc0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnUGF0cm9uc0Z1bmN0aW9uJywge1xuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAncGF0cm9ucy5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vc2VydmljZXMvZnVuY3Rpb25zJyksXG4gICAgICBsYXllcnM6IFtzaGFyZWRMYXllcl0sXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgICBVU0VSX1BPT0xfSUQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb3JkZXJzRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdPcmRlcnNGdW5jdGlvbicsIHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ29yZGVycy5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vc2VydmljZXMvZnVuY3Rpb25zJyksXG4gICAgICBsYXllcnM6IFtzaGFyZWRMYXllcl0sXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgICBVU0VSX1BPT0xfSUQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICAgIFNMQUNLX1dFQkhPT0tfUEFSQU06IHNsYWNrV2ViaG9va1BhcmFtLnBhcmFtZXRlck5hbWUsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWRtaW5GdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FkbWluRnVuY3Rpb24nLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdhZG1pbi5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vc2VydmljZXMvZnVuY3Rpb25zJyksXG4gICAgICBsYXllcnM6IFtzaGFyZWRMYXllcl0sXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgICBVU0VSX1BPT0xfSUQ6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICB9LFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogMTI4LFxuICAgIH0pO1xuXG4gICAgLy8gQ29nbml0byBBdXRob3JpemVyXG4gICAgY29uc3QgYXV0aG9yaXplciA9IG5ldyBhcGlnYXRld2F5LkNvZ25pdG9Vc2VyUG9vbHNBdXRob3JpemVyKHRoaXMsICdDb2duaXRvQXV0aG9yaXplcicsIHtcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFt1c2VyUG9vbF0sXG4gICAgfSk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0JhckFwcEFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnYmFyLWFwcC1hcGknLFxuICAgICAgZGVzY3JpcHRpb246ICdCYXIgT3JkZXIgU3lzdGVtIEFQSScsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHN0YWdlTmFtZTogJ3Byb2QnLFxuICAgICAgICB0aHJvdHRsaW5nUmF0ZUxpbWl0OiAxMDAsXG4gICAgICAgIHRocm90dGxpbmdCdXJzdExpbWl0OiAyMDAsXG4gICAgICB9LFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdYLUFtei1EYXRlJywgJ0F1dGhvcml6YXRpb24nLCAnWC1BcGktS2V5J10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQVBJIFJvdXRlc1xuICAgIGNvbnN0IG1lbnVzUmVzb3VyY2UgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnbWVudXMnKTtcbiAgICBtZW51c1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24obWVudXNGdW5jdGlvbikpO1xuXG4gICAgY29uc3QgcGF0cm9uc1Jlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ3BhdHJvbnMnKTtcbiAgICBwYXRyb25zUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihwYXRyb25zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIHBhdHJvbnNSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihwYXRyb25zRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIFxuICAgIGNvbnN0IHBhdHJvblJlc291cmNlID0gcGF0cm9uc1Jlc291cmNlLmFkZFJlc291cmNlKCd7cGF0cm9uSWR9Jyk7XG4gICAgcGF0cm9uUmVzb3VyY2UuYWRkTWV0aG9kKCdQQVRDSCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHBhdHJvbnNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBvcmRlcnNSZXNvdXJjZSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdvcmRlcnMnKTtcbiAgICBvcmRlcnNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKG9yZGVyc0Z1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICB9KTtcbiAgICBvcmRlcnNSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihvcmRlcnNGdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBhZG1pblJlc291cmNlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2FkbWluJyk7XG4gICAgY29uc3QgcmVzZXRSZXNvdXJjZSA9IGFkbWluUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3Jlc2V0Jyk7XG4gICAgcmVzZXRSZXNvdXJjZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhZG1pbkZ1bmN0aW9uKSwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc2V0QWxsUmVzb3VyY2UgPSBhZG1pblJlc291cmNlLmFkZFJlc291cmNlKCdyZXNldC1hbGwnKTtcbiAgICByZXNldEFsbFJlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFkbWluRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWRtaW4gTWVudSBNYW5hZ2VtZW50IFJvdXRlc1xuICAgIGNvbnN0IGFkbWluTWVudUl0ZW1zUmVzb3VyY2UgPSBhZG1pblJlc291cmNlLmFkZFJlc291cmNlKCdtZW51LWl0ZW1zJyk7XG4gICAgYWRtaW5NZW51SXRlbXNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFkbWluRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGFkbWluTWVudUl0ZW1zUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgYWRtaW5NZW51SXRlbVJlc291cmNlID0gYWRtaW5NZW51SXRlbXNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2lkfScpO1xuICAgIGFkbWluTWVudUl0ZW1SZXNvdXJjZS5hZGRNZXRob2QoJ1BBVENIJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgYWRtaW5NZW51SXRlbVJlc291cmNlLmFkZE1ldGhvZCgnREVMRVRFJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBBZG1pbiBDYXRlZ29yeSBNYW5hZ2VtZW50IFJvdXRlc1xuICAgIGNvbnN0IGFkbWluQ2F0ZWdvcmllc1Jlc291cmNlID0gYWRtaW5SZXNvdXJjZS5hZGRSZXNvdXJjZSgnY2F0ZWdvcmllcycpO1xuICAgIGFkbWluQ2F0ZWdvcmllc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgYWRtaW5DYXRlZ29yaWVzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgYWRtaW5DYXRlZ29yeVJlc291cmNlID0gYWRtaW5DYXRlZ29yaWVzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBhZG1pbkNhdGVnb3J5UmVzb3VyY2UuYWRkTWV0aG9kKCdQQVRDSCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFkbWluRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGFkbWluQ2F0ZWdvcnlSZXNvdXJjZS5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFkbWluRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuXG4gICAgLy8gQWRtaW4gQmxlbmQgTWFuYWdlbWVudCBSb3V0ZXNcbiAgICBjb25zdCBhZG1pbkJsZW5kc1Jlc291cmNlID0gYWRtaW5SZXNvdXJjZS5hZGRSZXNvdXJjZSgnYmxlbmRzJyk7XG4gICAgYWRtaW5CbGVuZHNSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFkbWluRnVuY3Rpb24pLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgIH0pO1xuICAgIGFkbWluQmxlbmRzUmVzb3VyY2UuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgXG4gICAgY29uc3QgYWRtaW5CbGVuZFJlc291cmNlID0gYWRtaW5CbGVuZHNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2lkfScpO1xuICAgIGFkbWluQmxlbmRSZXNvdXJjZS5hZGRNZXRob2QoJ1BBVENIJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG4gICAgYWRtaW5CbGVuZFJlc291cmNlLmFkZE1ldGhvZCgnREVMRVRFJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWRtaW5GdW5jdGlvbiksIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgfSk7XG5cbiAgICAvLyBOb3RlOiBBbXBsaWZ5IGhvc3Rpbmcgc2V0dXAgcmVxdWlyZXMgR2l0SHViIHRva2VuIGFuZCBtYW51YWwgY29uZmlndXJhdGlvblxuICAgIC8vIEZvciBub3csIGNvbW1lbnRlZCBvdXQgdG8gYXZvaWQgZGVwbG95bWVudCBpc3N1ZXNcbiAgICAvLyBVc2VycyBjYW4gbWFudWFsbHkgc2V0IHVwIEFtcGxpZnkgSG9zdGluZyB2aWEgQVdTIENvbnNvbGVcblxuICAgIC8vIFN0YWNrIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBJRCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xDbGllbnRJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSUQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUdhdGV3YXlVcmwnLCB7XG4gICAgICB2YWx1ZTogYXBpLnVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgVVJMJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdEeW5hbW9EQiBUYWJsZSBOYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBc3NldHNCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IGFzc2V0c0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdTMyBBc3NldHMgQnVja2V0IE5hbWUnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Fzc2V0c0J1Y2tldFVybCcsIHtcbiAgICAgIHZhbHVlOiBhc3NldHNCdWNrZXQuYnVja2V0V2Vic2l0ZVVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnUzMgQXNzZXRzIEJ1Y2tldCBVUkwnLFxuICAgIH0pO1xuXG4gICAgLy8gTm90ZTogQW1wbGlmeSBBcHAgVVJMIHdpbGwgYmUgYXZhaWxhYmxlIGFmdGVyIG1hbnVhbCBzZXR1cFxuICB9XG59Il19