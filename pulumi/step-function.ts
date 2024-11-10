import * as aws from "@pulumi/aws";
import * as path from "path";
import { CommonConfig, EnvironmentConfig } from "./interfaces";
import { repoRootDirectoryPath } from "./constants";
import { NodeJSFunction } from "./utils/esbuild";
import { parseAndReplacePlaceholders, placeholderValues } from "./utils/get-pulsifi-config";

export const provisionStepFunctions = (
  commonConfig: CommonConfig,
  environmentConfigs: EnvironmentConfig,
  stepFunctionDependencies: {
    iamRole: aws.iam.Role;
    lambdaFunctions: NodeJSFunction[];
  }
) => {
  const stepFunctionConfigs = environmentConfigs.aws.step_functions;

  for (const stepFunctionConfig of stepFunctionConfigs) {
    const { iamRole, lambdaFunctions } = stepFunctionDependencies;

    const definitionFilePath = path.join(repoRootDirectoryPath, stepFunctionConfig.definition);

    import(definitionFilePath).then((module) => {
      if (!module.default) {
        throw new Error(`${definitionFilePath} state machine definition not found`);
      }

      const definition = parseAndReplacePlaceholders(module.default, placeholderValues);

      new aws.sfn.StateMachine(
        stepFunctionConfig.id,
        {
          name: `${stepFunctionConfig.name}`,
          roleArn: iamRole.arn,
          definition: JSON.stringify(definition),
        },
        { dependsOn: [iamRole, ...lambdaFunctions] }
      );
    });
  }
};
