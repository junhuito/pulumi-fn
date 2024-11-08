import { NodeJSFunction } from "./core/function";
import * as aws from "@pulumi/aws";

import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

const lambdaRole = new aws.iam.Role(`lambda-role`, {
    managedPolicyArns: [
      aws.iam.ManagedPolicy.IAMReadOnlyAccess
    ],
    assumeRolePolicy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
          Effect: "Allow",
          Sid: "",
        },
      ],
    }),
});

const lambdaPolicy = new aws.iam.Policy(`lambda-policy`, {
    policy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          Resource: "*",
        },
      ],
    }),
});

new aws.iam.RolePolicyAttachment(`lambda-role-policy-attachment`, {
    role: lambdaRole.name,
    policyArn: lambdaPolicy.arn.apply((arn) => arn),
});

type NodeJsFunctionConfig = {
    id: string;
    entry: string;
    handler: string;
    name: string;
    environment: Record<string, string>;
}

const lambdaFunctions = config.requireObject<NodeJsFunctionConfig[]>('functions');

for (const lambdaFunction of lambdaFunctions) {
    const lambda = new NodeJSFunction(lambdaFunction.id, {
        entry: lambdaFunction.entry,
        handler: lambdaFunction.handler,
        role: lambdaRole.arn,
        name: lambdaFunction.name,
        environment: {
            variables: lambdaFunction.environment,
        }
    });
}
