#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkStudyInfraStack } from '../lib/cdk-study-infra-stack';

const app = new cdk.App();
new CdkStudyInfraStack(app, 'cdkInfraStudy');

app.synth();
