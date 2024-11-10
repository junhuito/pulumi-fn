import * as aws from "@pulumi/aws";
import { CommonConfig, EnvironmentConfig } from "./interfaces/config-interface";

export const provisionLogGroups = (
  commonConfigs: CommonConfig,
  environmentConfigs: EnvironmentConfig,
  lambdaFunctionName: string
) => {
  const logGroupConfig = environmentConfigs.aws.lambda_log_group;

  const retentionInDays =
    logGroupConfig.log_retention_days[
      commonConfigs.aws.aws_environment as keyof typeof logGroupConfig.log_retention_days
    ];

  new aws.cloudwatch.LogGroup(`${lambdaFunctionName}-log-group`, {
    name: `/aws/lambda/${lambdaFunctionName}`,
    skipDestroy: logGroupConfig.skip_destroy,
    retentionInDays,
    tags: {
      environment: commonConfigs.aws.aws_environment,
      build_version: commonConfigs.aws.build_version,
      owner: commonConfigs.aws.resource_owner,
    },
  });
};
