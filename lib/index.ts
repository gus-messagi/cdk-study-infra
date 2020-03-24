import { 
    App, Stack, StackProps, RemovalPolicy
} from '@aws-cdk/core';

import {
    CfnUserPoolClient,
    CfnUserPool,
} from '@aws-cdk/aws-cognito';
import UserPoolSchema from './schemas/userPool';
import Api from './construct/api';
import CdkApp from './construct/app';
import { Bucket } from '@aws-cdk/aws-s3';
import context from './context/';

export class CdkStudyInfraStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const {
            appUrl,
        } = context(this);

        const bucket: Bucket = new Bucket(this, 'Bucket', {
            bucketName: 'cdk-study-pipeline-bucket',
            removalPolicy: RemovalPolicy.DESTROY
        });

        const userPool: CfnUserPool = new CfnUserPool(this, 'UserPool', {
            userPoolName: 'studyUserPool',
            autoVerifiedAttributes: ['email'],
            usernameAttributes: ['email'],
            schema: UserPoolSchema.schema,
        }); 

        new CfnUserPoolClient(this, 'UserPoolClient', {
            userPoolId: userPool.ref,
            allowedOAuthFlows: [
                'implicit',
            ],
            allowedOAuthFlowsUserPoolClient: true,
            allowedOAuthScopes: [
                'email',
                'openid',
            ],
            callbackUrLs: [
                'http://localhost:3000',
                `https://${appUrl}`,
            ],  
            clientName: 'cdkUserPoolClient',
            generateSecret: false,
            supportedIdentityProviders: [
                'COGNITO',
            ],
            writeAttributes: UserPoolSchema.clientWriteAttributes,
            readAttributes: UserPoolSchema.clientReadAttributes,
        });

        new CdkApp(this, 'CdkApp', {
            ArtifactBucket: bucket,
        });

        new Api(this, 'CdkApi', {
            ArtifactsBucket: bucket,
            CognitoUserPoolArn: userPool.attrArn,
            CognitoUserPoolId: userPool.ref,
        });
    }
}
