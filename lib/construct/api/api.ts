import {
    Construct,
    SecretValue,
} from '@aws-cdk/core';

import context from '../../context';

import {
    PipelineProject,
    BuildSpec,
    LinuxBuildImage,
    ComputeType,
    BuildEnvironmentVariableType,
} from '@aws-cdk/aws-codebuild';

import {
    Pipeline,
    Artifact,
} from '@aws-cdk/aws-codepipeline';

import {
    GitHubSourceAction, CodeBuildAction, CloudFormationCreateUpdateStackAction
} from '@aws-cdk/aws-codepipeline-actions';

import servicePrincipal from '../../constants/servicePrincipal';

import {
    Role,
    PolicyStatement,
    Effect,
} from '@aws-cdk/aws-iam';
import { Bucket } from '@aws-cdk/aws-s3';
import { CloudFormationCapabilities } from '@aws-cdk/aws-cloudformation';

interface ApiProps {
    ArtifactsBucket: Bucket,
}

export default class Api extends Construct {
    constructor(scope: Construct, id: string, props: ApiProps) {
        super(scope, id);

        const oauthToken: SecretValue = SecretValue.secretsManager('arn:aws:secretsmanager:us-east-1:431351837843:secret:githubtoken-ilcAtG');

        const codeBuildRole: Role = new Role(this, 'cdkCodeBuildRole', {
            roleName: 'CdkBuildRole',
            assumedBy: servicePrincipal.CODEBUILD
        });

        codeBuildRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                's3:PutObject',
                'apigateway:*',
                'lambda:*',
                'dynamodb:CreateTable',
                'cloudfront:CreateDistribution',
                'mobiletargeting:*',
                'sts:*',
            ],
            resources: ['*'],
        }));

        const codeBuildProject: PipelineProject =
            new PipelineProject(this, 'cdkCodeBuildProject', {
                buildSpec: BuildSpec.fromSourceFilename('buildspec.yml'),
                role: codeBuildRole,
                projectName: 'cdkCodeBuildStudyProject',
                environment: {
                    buildImage: LinuxBuildImage.STANDARD_2_0,
                    computeType: ComputeType.SMALL,
                    privileged: true,
                    environmentVariables: {
                        bucketName: {
                            type: BuildEnvironmentVariableType.PLAINTEXT,
                            value: props.ArtifactsBucket.bucketName,
                        },
                    }
                }
            }); 

        const samDeploymentRole: Role = new Role(this, 'cdkSAMDeploymentRole', {
            roleName: 'CdkSamRole',
            assumedBy: servicePrincipal.CLOUDFORMATION
        });

        samDeploymentRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            resources: ['*'],
            actions: [
                'lambda:*',
                'apigateway:*',
                'dynamodb:*',
                'sqs:*',
                'cloudfront:*',
                'route53:*',
                's3:*',
                'iam:*',
                'cloudformation:*',
                'events:*',
                'sts:AssumeRole',
            ],
        }));

        const codePipelineRole: Role = new Role(this, 'cdkCodePipelineRole', {
            roleName: 'CdkPipelineRole',
            assumedBy: servicePrincipal.CODEPIPELINE,
        });

        codePipelineRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'codebuild:BatchGetBuilds',
                'codebuild:StartBuild',
                'iam:PassRole',
                'cloudwatch:*',
                's3:*',
                'sts:*',
                'codepipeline:*',
                'cloudformation:*',
                'mobiletargeting:*'
            ],
            resources: ['*'],
        }));

        const sourceOutput: Artifact = new Artifact('SourceOutput');
        const buildOutput: Artifact = new Artifact('BuildOutput');

        const source: GitHubSourceAction = new GitHubSourceAction({
            repo: 'cdk-study-api',
            owner: 'gus-messagi',
            output: sourceOutput,
            actionName: 'GitHub',
            oauthToken,
            runOrder: 1,
        });

        new Pipeline(this, 'cdkCodePipeline', {
            pipelineName: 'cdkInfraStudyPipeline',
            role: codePipelineRole,
            artifactBucket: props.ArtifactsBucket,
            stages: [
                {
                    stageName: 'Source',
                    actions: [source],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new CodeBuildAction({
                            actionName: 'BuildAction',
                            project: codeBuildProject,
                            input: sourceOutput,
                            outputs: [buildOutput],
                            runOrder: 1
                        })
                    ],
                },
                {
                    stageName: 'Deploy',
                    actions: [
                        new CloudFormationCreateUpdateStackAction({
                            actionName: 'DeployAction',
                            adminPermissions: true,
                            stackName: 'CdkStudy',
                            templatePath: buildOutput.atPath('sam_output_template.yml'),
                            capabilities: [
                                CloudFormationCapabilities.NAMED_IAM,
                                CloudFormationCapabilities.AUTO_EXPAND
                            ],
                            replaceOnFailure: true,
                            deploymentRole: samDeploymentRole,
                        })
                    ]
                }
            ]
        });
    }
}