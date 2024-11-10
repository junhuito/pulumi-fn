import mustache from "mustache";

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import {
  CommonConfig,
  EnvironmentConfig,
  LambdaFunctionEnvironmentVariables,
} from "../interfaces";

export const placeholderValues = {
  NODE_ENV: process.env.NODE_ENV ?? 'sandbox',
  AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID ?? '361081796204', // TODO: for spike purpose, need to remove this default account id
  BUILD_TAG: process.env.BUILD_TAG ?? 'latest',
  AWS_REGION: process.env.AWS_REGION ?? 'ap-southeast-1',
  AWS_REGION_ABBR: process.env.AWS_REGION_ABBR ?? 'sg',
};

const commonConfigs: CommonConfig = new pulumi.Config("common").requireObject(
  "config"
);

const environmentConfigs: EnvironmentConfig = new pulumi.Config(
  `${placeholderValues.NODE_ENV}`
).requireObject("config");

// Helper function to parse and replace placeholders using mustache
export const parseAndReplacePlaceholders = (
  configObject: object | string,
  values: { [key: string]: string | undefined }
) => {
  const configJsonString = JSON.stringify(configObject);
  const rendered = mustache.render(configJsonString, values);
  return JSON.parse(rendered);
};

// Prepare configurations with placeholders replaced
export const getConfigs = () => {
  const parsedCommonConfigs: CommonConfig = parseAndReplacePlaceholders(
    commonConfigs,
    placeholderValues
  );
  const parsedEnvironmentConfigs: EnvironmentConfig = parseAndReplacePlaceholders(
    environmentConfigs,
    placeholderValues
  );

  return {
    commonConfigs: parsedCommonConfigs,
    environmentConfigs: parsedEnvironmentConfigs,
  };
};

// Get resource tags
export const getResourceTags = (
  commonConfig: CommonConfig,
  resourceName: string,
  resourceType: string
) => {
  const resourceTags = {
    Environment: commonConfig.aws.aws_environment,
    Name: resourceName,
    Owner: commonConfig.aws.resource_owner,
    Type: resourceType,
  };

  return resourceTags;
};

// Get lambda environment variables
export const getLambdaFunctionEnvironmentVariables = (
  lambdaFunctionEnvironmentVariables: LambdaFunctionEnvironmentVariables[]
) => {
  const environmentVariables: Record<string, pulumi.Output<string> | string> = {};

  for (const lambdaFunctionEnvironmentVariable of lambdaFunctionEnvironmentVariables) {
    const environmentKey = lambdaFunctionEnvironmentVariable.name;
    if (lambdaFunctionEnvironmentVariable.ssm_parameter_name !== null) {
      const ssm = aws.ssm.getParameterOutput({
        name: lambdaFunctionEnvironmentVariable.ssm_parameter_name
      });

      environmentVariables[environmentKey] = ssm.value;
    }

    if (lambdaFunctionEnvironmentVariable.value !== null) {
      environmentVariables[environmentKey] = lambdaFunctionEnvironmentVariable.value;
    }

    if (!environmentVariables.hasOwnProperty(environmentKey)) {
      environmentVariables[environmentKey] = "";
    }
  }

  return environmentVariables;
};