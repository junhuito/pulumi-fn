import * as aws from "@pulumi/aws";

import { CommonConfig, EnvironmentConfig } from "./interfaces/config-interface";
import { NodeJSFunction } from "./utils/esbuild";
import { provisionLogGroups } from "./log-group";
import { addS3EventsNotificationsToNotificationsCollection } from "./s3";
import { provisionSqs } from "./sqs";
import { esbuildDecorators } from "esbuild-plugin-typescript-decorators";
import { esbuildOutputFolderPath, ResourceTag } from "./constants";
import { getLambdaFunctionEnvironmentVariables, getResourceTags } from "./utils/get-pulsifi-config";
import { provisionErrorAlarm } from "./alarm";

export const provisionLambdaFunctions = (
  commonConfigs: CommonConfig,
  environmentConfigs: EnvironmentConfig,
  lambdaDependencies: {
    iamRole: aws.iam.Role,
    securityGroup: aws.ec2.SecurityGroup,
    layers: aws.lambda.LayerVersion[],
  }
) => {
  const lambdaFunctionsConfig = environmentConfigs.aws.lambda_functions;
  const { iamRole, securityGroup, layers } = lambdaDependencies;

  const lambdaFunctions: NodeJSFunction[] = [];

  /* VPC */
  const vpcPrivateSubnetIds = aws.ssm.Parameter.get(
    "VPC-private-subnet-ids",
    "/configs/VPC_PRIVATE_SUBNET_IDS"
  ).value.apply((subnets) => subnets.split(","));

  for (const lambdaFunctionConfig of lambdaFunctionsConfig) {
    const lambdaFunctionName = `${lambdaFunctionConfig.name}-${commonConfigs.aws.aws_region_abbr}`;

    const commonLambdaEnvironmentVariables =
      getLambdaFunctionEnvironmentVariables(
        commonConfigs.aws.lambda_function.environment_variables
      );
    const lambdaEnvironmentVariables = getLambdaFunctionEnvironmentVariables(
      lambdaFunctionConfig.environment_variables
    );

    const lambdaFunction = new NodeJSFunction(
      lambdaFunctionConfig.id,
      {
        entry: lambdaFunctionConfig.entry,
        handler: lambdaFunctionConfig.handler,
        role: iamRole.arn,
        name: lambdaFunctionName,
        description: lambdaFunctionConfig.description,
        // vpcConfig: {
        //   securityGroupIds: [securityGroup.id],
        //   subnetIds: vpcPrivateSubnetIds,
        // },
        environment: {
          variables: {
            ...commonLambdaEnvironmentVariables,
            ...lambdaEnvironmentVariables,
          },
        },
        layers: layers.map((layer) => layer.arn),
        tags: getResourceTags(commonConfigs, lambdaFunctionName, ResourceTag.LAMBDA),
        memorySize: lambdaFunctionConfig.memory_size,
        architectures: lambdaFunctionConfig.architectures ?? commonConfigs.aws.lambda_function.architectures,
        timeout: lambdaFunctionConfig.timeout,
        runtime: lambdaFunctionConfig.runtime ?? commonConfigs.aws.lambda_function.runtime,
        esbuild: {
          ...commonConfigs.aws.lambda_function.esbuild,
          outdir: esbuildOutputFolderPath,
          plugins: [
            esbuildDecorators(),
          ]
        }
      },
      { dependsOn: [iamRole, securityGroup, ...layers] }
    );

    /* LOG GROUP */ 
    provisionLogGroups(commonConfigs, environmentConfigs, lambdaFunctionName);

    /* SQS */ 
    const sqsConfigs = lambdaFunctionConfig.sqs ?? [];

    if (sqsConfigs.length) {
      provisionSqs(commonConfigs, sqsConfigs, lambdaFunction, lambdaFunctionName);
    };

    /* S3 EVENTS */ 
    const s3EventsNotificationsConfig = lambdaFunctionConfig.s3_events_notifications ?? [];

    if (s3EventsNotificationsConfig.length) {
      addS3EventsNotificationsToNotificationsCollection(s3EventsNotificationsConfig, lambdaFunction, lambdaFunctionName);
    }

    /* ALARM */
    provisionErrorAlarm(commonConfigs, lambdaFunctionName)

    lambdaFunctions.push(lambdaFunction);
  };


  return lambdaFunctions;
}
