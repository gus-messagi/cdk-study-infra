import { Construct } from '@aws-cdk/core';

interface IContext {
    environment: string,
}

function getContext(app: Construct): IContext {
    return {
        environment: app.node.tryGetContext("environment"),
    }
}

export default getContext;