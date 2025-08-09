#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BarOrderSystemStack } from '../lib/bar-order-system-stack';

const app = new cdk.App();
new BarOrderSystemStack(app, 'BarOrderSystemStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
});