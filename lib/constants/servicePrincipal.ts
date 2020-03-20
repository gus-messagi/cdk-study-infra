import { ServicePrincipal } from '@aws-cdk/aws-iam';

export default {
    CODEPIPELINE: new ServicePrincipal('codepipeline.amazonaws.com'),
    CLOUDFORMATION: new ServicePrincipal('cloudformation.amazonaws.com'),
    CODEBUILD: new ServicePrincipal('codebuild.amazonaws.com')
}