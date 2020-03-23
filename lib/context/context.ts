import { Construct } from '@aws-cdk/core';

interface IContext {
    environment: string,
    appUrl: string,
}

function getContext(app: Construct): IContext {
    return {
        environment: app.node.tryGetContext("environment"),
        appUrl: app.node.tryGetContext("appUrl"),
    }
}

export default getContext;