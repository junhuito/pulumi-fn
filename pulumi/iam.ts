import * as aws from "@pulumi/aws";

import * as pulumi from "@pulumi/pulumi";
import { CommonConfig, EnvironmentConfig } from "./interfaces/config-interface";
import { getResourceTags } from "./utils/get-config";
import { ResourceTag } from "./constants";


export const provisionIam = (
  commonConfig: CommonConfig,
  environmentConfig: EnvironmentConfig,
) => {
  const iamConfig = environmentConfig.aws.iam;
  const iamRoleName = `${iamConfig.name}-${commonConfig.aws.aws_region_abbr}`;

  const awsManagedPolicyArns = iamConfig.aws_managed_policies;

  const customerManagedPolicies =
    iamConfig.customer_managed_policies.map((policyConfig) => {
      return new aws.iam.Policy(policyConfig.policy_name, {
        name: `${policyConfig.policy_name}-${commonConfig.aws.aws_region_abbr}`,
        policy: JSON.stringify(policyConfig.policy_statement),
      });
    });

  const iamRole = new aws.iam.Role(iamConfig.id, {
    name: iamRoleName,
    assumeRolePolicy: pulumi.jsonStringify(iamConfig.assume_role_policy),
    managedPolicyArns: [...awsManagedPolicyArns, ...customerManagedPolicies.map((policy) => policy.arn)],
    tags: getResourceTags(commonConfig, iamRoleName, ResourceTag.IAM),
  }, {
    dependsOn: customerManagedPolicies
  });

  return iamRole;
};
