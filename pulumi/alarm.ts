import * as aws from "@pulumi/aws";

import { CommonConfig } from "./interfaces/config-interface";
import { getResourceTags } from "./utils/get-pulsifi-config";
import { ResourceTag } from "./constants";

export const provisionErrorAlarm = (
  commonConfig: CommonConfig,
  lambdaName: string,
) => {
  const alarmCommonConfig = commonConfig.aws.lambda_function.alarm;
  const alarmName = `${lambdaName}-error-alarm`;
  const healthTopic = aws.sns.Topic.get(`${lambdaName}-health-topic`, alarmCommonConfig.health_topic);

  new aws.cloudwatch.MetricAlarm(alarmName, {
    name: alarmName,
    metricName: alarmCommonConfig.metric_name,
    namespace: alarmCommonConfig.namespace,
    dimensions: { FunctionName: lambdaName },
    threshold: alarmCommonConfig.threshold,
    comparisonOperator: alarmCommonConfig.comparison_operator,
    evaluationPeriods: alarmCommonConfig.evaluation_periods,
    datapointsToAlarm: alarmCommonConfig.datapoints_to_alarm,
    treatMissingData: alarmCommonConfig.treat_missing_data,
    statistic: alarmCommonConfig.statistic,
    period: 60,
    alarmActions: [healthTopic.arn],
    tags: getResourceTags(commonConfig, alarmName, ResourceTag.ALARM),
  });
};
