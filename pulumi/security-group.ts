import * as aws from "@pulumi/aws";
import { getResourceTags } from "./utils/get-pulsifi-config";
import { CommonConfig, EnvironmentConfig, SecurityGroupConfig } from "./interfaces";
import { ResourceTag } from "./constants";

export const provisionSecurityGroup = (
  commonConfigs: CommonConfig,
  environmentConfigs: EnvironmentConfig
) => {
  const securityGroupConfig = environmentConfigs.aws.security_group;
  const securityGroupName = `${securityGroupConfig.name}-${commonConfigs.aws.aws_region_abbr}`;
  
  const vpcId = aws.ssm.Parameter.get("VPC", "/configs/VPCID").value;

  const securityGroup = new aws.ec2.SecurityGroup(
    `${securityGroupConfig.id}-${commonConfigs.aws.aws_region_abbr}`,
    {
      name: securityGroupName,
      vpcId: vpcId,
      egress: securityGroupConfig.outbound_rules?.map((outbound_rule) => ({
        description: outbound_rule.description,
        protocol: outbound_rule.protocol,
        fromPort: outbound_rule.from_port,
        toPort: outbound_rule.to_port,
        cidrBlocks: outbound_rule.cidr_blocks,
      })),
      ingress: securityGroupConfig.inbound_rules?.map((inbound_rule) => ({
        description: inbound_rule.description,
        protocol: inbound_rule.protocol,
        fromPort: inbound_rule.from_port,
        toPort: inbound_rule.to_port,
        self: inbound_rule.self,
      })),
      tags: getResourceTags(
        commonConfigs,
        securityGroupName,
        ResourceTag.SECURITY_GROUP
      ),
    }
  );

  return securityGroup;
};
