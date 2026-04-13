#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LoresteadStack } from '../lib/lorestead-stack';

const app = new cdk.App();
new LoresteadStack(app, 'LoresteadStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
  },
});
