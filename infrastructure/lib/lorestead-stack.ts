import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
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
    const allowedOrigin = process.env.CORS_ALLOWED_ORIGIN ?? 'https://lorestead.vercel.app';

    const lambdaEnv = {
      USERS_TABLE: usersTable.tableName,
      SESSIONS_TABLE: sessionsTable.tableName,
      WORLD_PROGRESS_TABLE: worldProgressTable.tableName,
      USER_POOL_ID: userPool.userPoolId,
      CORS_ALLOWED_ORIGIN: allowedOrigin,
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
        allowOrigins: [allowedOrigin],
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

    // ─── 動画アセット配信（S3 + CloudFront） ────────────────────
    // 世界の動画・静止画はリポジトリ同梱をやめ、S3に置いてCloudFront経由で配信する。
    // バケットは非公開（CloudFrontのOACからのみ読み取り可）。
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const assetsDistribution = new cloudfront.Distribution(this, 'AssetsDistribution', {
      comment: 'Lorestead world video assets',
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(assetsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
    });

    // ─── Outputs ───────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      exportName: 'LoresteadAssetsBucket',
    });
    new cdk.CfnOutput(this, 'AssetsCdnDomain', {
      value: assetsDistribution.distributionDomainName,
      exportName: 'LoresteadAssetsCdnDomain',
    });
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
