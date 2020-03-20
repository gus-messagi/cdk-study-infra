import { 
    App, Stack, StackProps, RemovalPolicy
} from '@aws-cdk/core';

import Api from './construct/api';
import CdkApp from './construct/app';
import { Bucket } from '@aws-cdk/aws-s3';

export class CdkStudyInfraStack extends Stack {
    constructor(scope: App, id: string, props?: StackProps) {
        super(scope, id, props);

        const bucket: Bucket = new Bucket(this, 'Bucket', {
            bucketName: 'cdk-study-pipeline-bucket',
            removalPolicy: RemovalPolicy.DESTROY
        });

        new CdkApp(this, 'CdkApp', {
            ArtifactBucket: bucket,
        });

        new Api(this, 'CdkApi', {
            ArtifactsBucket: bucket,
        });
    }
}
