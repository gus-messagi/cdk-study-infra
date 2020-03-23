import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import CdkStudyInfra = require('../lib/index');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkStudyInfra.CdkStudyInfraStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
