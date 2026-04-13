import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class LoresteadStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ─── Cognito ───────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'LoresteadUserPool', {
      userPoolName: 'lorestead-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'LoresteadUserPoolClient', {
      userPool,
      userPoolClientName: 'lorestead-web-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // ─── DynamoDB ──────────────────────────────────────────────
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'lorestead-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: 'lorestead-sessions',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const worldProgressTable = new dynamodb.Table(this, 'WorldProgressTable', {
      tableName: 'lorestead-world-progress',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'worldId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ─── Lambda共通設定 ────────────────────────────────────────
    const lambdaEnv = {
      USERS_TABLE: usersTable.tableName,
      SESSIONS_TABLE: sessionsTable.tableName,
      WORLD_PROGRESS_TABLE: worldProgressTable.tableName,
      USER_POOL_ID: userPool.userPoolId,
    };

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    usersTable.grantReadWriteData(lambdaRole);
    sessionsTable.grantReadWriteData(lambdaRole);
    worldProgressTable.grantReadWriteData(lambdaRole);

    // ─── Lambda 関数 ───────────────────────────────────────────
    const sessionsHandler = new lambda.Function(this, 'SessionsHandler', {
      functionName: 'lorestead-sessions',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      handler: 'sessions.handler',
      environment: lambdaEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
    });

    const progressHandler = new lambda.Function(this, 'ProgressHandler', {
      functionName: 'lorestead-progress',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      handler: 'progress.handler',
      environment: lambdaEnv,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
    });

    const authHandler = new lambda.Function(this, 'AuthHandler', {
      functionName: 'lorestead-auth',
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      handler: 'auth.handler',
      environment: {
        ...lambdaEnv,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
    });
    // auth Lambda に Cognito 操作権限を追加
    authHandler.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'cognito-idp:InitiateAuth',
        'cognito-idp:SignUp',
        'cognito-idp:ConfirmSignUp',
        'cognito-idp:GetUser',
        'cognito-idp:ForgotPassword',
        'cognito-idp:ConfirmForgotPassword',
      ],
      resources: [userPool.userPoolArn],
    }));

    // ─── API Gateway ───────────────────────────────────────────
    const api = new apigateway.RestApi(this, 'LoresteadApi', {
      restApiName: 'lorestead-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // /auth
    const authResource = api.root.addResource('auth');
    authResource.addMethod('POST', new apigateway.LambdaIntegration(authHandler));

    // /sessions
    const sessionsResource = api.root.addResource('sessions');
    sessionsResource.addMethod('POST', new apigateway.LambdaIntegration(sessionsHandler));
    sessionsResource.addMethod('GET', new apigateway.LambdaIntegration(sessionsHandler));

    // /progress
    const progressResource = api.root.addResource('progress');
    progressResource.addMethod('GET', new apigateway.LambdaIntegration(progressHandler));
    progressResource.addMethod('PUT', new apigateway.LambdaIntegration(progressHandler));

    // ─── Outputs ───────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      exportName: 'LoresteadApiUrl',
    });
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: 'LoresteadUserPoolId',
    });
    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: 'LoresteadUserPoolClientId',
    });
  }
}
