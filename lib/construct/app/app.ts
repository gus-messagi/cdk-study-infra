import { Construct, RemovalPolicy, SecretValue } from '@aws-cdk/core';
import { Bucket } from '@aws-cdk/aws-s3';
import { 
    Role, 
    PolicyStatement, 
    Effect, 
    CompositePrincipal 
} from '@aws-cdk/aws-iam';
import servicePrincipal from '../../constants/servicePrincipal';
import { 
    PipelineProject,
    BuildSpec, 
    LinuxBuildImage, 
    ComputeType, 
    BuildEnvironmentVariableType 
} from '@aws-cdk/aws-codebuild';
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';

interface IAppProps {
    ArtifactBucket: Bucket,
}

export default class CdkApp extends Construct {
    constructor(scope: Construct, id: string, props: IAppProps) {
        super(scope, id);

        const oauthToken: SecretValue = SecretValue.secretsManager('arn:aws:secretsmanager:us-east-1:431351837843:secret:githubtoken-ilcAtG');

        const bucket: Bucket = new Bucket(this, 'AppBucket', {
            bucketName: 'cdk-app-project-bucket',
            websiteIndexDocument: 'index.html',
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const codeBuildRole: Role = new Role(this, 'CodeBuildRole', {
            assumedBy: servicePrincipal.CODEBUILD,
        });

        codeBuildRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:*',
            ],
            resources: ['*'],
        }));    

        const codeBuild: PipelineProject = new PipelineProject(this, 'AppCodeBuildProject', {
            buildSpec: BuildSpec.fromObject({
                version: 0.2, 
                phases: {
                    install: {
                        runtimeVersions: ['node:*'],
                        commands: [
                            'npm i -g yarn',
                            'yarn'
                        ]
                    },
                    build: {
                        commands: [
                            'yarn run build',
                            'aws s3 sync build s3://cdk-app-project-bucket',
                        ],
                    }
                }
            }),
            role: codeBuildRole,
            environment: {
                buildImage: LinuxBuildImage.STANDARD_2_0,
                computeType: ComputeType.SMALL,
                privileged: true,
                environmentVariables: {
                    BucketName: {
                        type: BuildEnvironmentVariableType.PLAINTEXT,
                        value: bucket.bucketName,
                    }
                }
            }
        });

        const pipelineRole: Role = new Role(this, 'AppPipelineRole', {
            assumedBy: new CompositePrincipal(
                servicePrincipal.CODEPIPELINE,
                servicePrincipal.CLOUDFORMATION,
            ),
            path: '/',
        });

        pipelineRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'codebuild:StartBuild',
                'iam:PassRole',
                's3:*',
                'codepipeline:*',
            ],
            resources: ['*'],
        }));

        const sourceOutput: Artifact = new Artifact('SourceArtifact');

        const source: GitHubSourceAction = new GitHubSourceAction({
            actionName: 'GithubWebhook',
            repo: 'cdk-study-front',
            owner: 'gus-messagi',
            oauthToken,
            output: sourceOutput,
            runOrder: 1,
        });

        new Pipeline(this, 'AppPipeline', {
            pipelineName: 'AppStudyPipeline',
            role: pipelineRole,
            artifactBucket: props.ArtifactBucket,
            stages: [
                {
                    stageName: 'SourceAction',
                    actions: [source],
                },
                {
                    stageName: 'BuildAction',
                    actions: [
                        new CodeBuildAction({
                            actionName: 'Build',
                            project: codeBuild,
                            input: new Artifact('SourceArtifact'),
                            outputs: [
                                new Artifact('BuildArtifact'),
                            ],
                            runOrder: 1,
                        })
                    ]
                }
            ]

        });

    }   
}