import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { getResourceTags } from "./utils/get-pulsifi-config";
import { CommonConfig, SqsConfig } from "./interfaces";
import { NodeJSFunction } from "./utils/esbuild";
import { ResourceTag } from "./constants";

export const provisionSqs = (
  commonConfigs: CommonConfig,
  sqsConfigs: SqsConfig[],
  nodeJSFunction: NodeJSFunction,
  lambdaName: string
) => {
  for (const sqsConfig of sqsConfigs) {
    const dlqName = `${sqsConfig.name}-dead-queue`;
    const standardSQSName = `${sqsConfig.name}-queue`;
    const fifoSQSName = `${sqsConfig.name}-queue.fifo`;
    const sqsName = sqsConfig.fifo_queue ? fifoSQSName : standardSQSName;

    /* DLQ */
    const deadQueue = new aws.sqs.Queue(`${sqsConfig.id}-dlq`, {
      name: dlqName,
      tags: getResourceTags(commonConfigs, dlqName, ResourceTag.SQS),
    });

    /* SQS */
    const queue = new aws.sqs.Queue(sqsConfig.id, {
      name: sqsName,
      fifoQueue: sqsConfig.fifo_queue,
      contentBasedDeduplication: sqsConfig.content_based_deduplication,
      delaySeconds: sqsConfig.delay_seconds,
      visibilityTimeoutSeconds: sqsConfig.visibility_timeout_seconds,
      redrivePolicy: pulumi.jsonStringify({
        deadLetterTargetArn: deadQueue.arn,
        maxReceiveCount: sqsConfig.dlq_max_receive_count,
      }),
      deduplicationScope: sqsConfig.deduplication_scope,
      fifoThroughputLimit: sqsConfig.fifo_throughput_limit,
      messageRetentionSeconds: sqsConfig.message_retention_seconds,
      tags: getResourceTags(commonConfigs, sqsName, ResourceTag.SQS),
    });

    /* SQS SNS SUBSCRIPTION */
    const snsSubscriptions = sqsConfig.sns_subscriptions;

    if (snsSubscriptions?.length) {
      /* default queue policy */
      const snsTopicsArn = snsSubscriptions.map((snsSubscription) =>
        snsSubscription.topic_arn
      );

      const sqsPolicyStatement = queue.arn.apply((queueArn) =>
        aws.iam.getPolicyDocumentOutput({
          statements: [
            {
              effect: "Allow",
              principals: [
                {
                  type: "AWS",
                  identifiers: ["*"],
                },
              ],
              actions: ["sqs:ReceiveMessage"],
              resources: [queueArn],
              conditions: [
                {
                  test: "ArnLike",
                  variable: "aws:SourceArn",
                  values: snsTopicsArn,
                },
              ],
            },
            {
              effect: "Allow",
              principals: [
                {
                  type: "Service",
                  identifiers: ["sns.amazonaws.com"],
                },
              ],
              resources: [queueArn],
              actions: ["sqs:SendMessage"],
              conditions: [
                {
                  test: "ArnEquals",
                  variable: "aws:SourceArn",
                  values: snsTopicsArn,
                },
              ],
            },
          ],
        })
      );

      new aws.sqs.QueuePolicy(`${lambdaName}-queue-policy`, {
        queueUrl: queue.id,
        policy: sqsPolicyStatement.apply((policy) => policy.json),
      });

      for (const snsSubscription of snsSubscriptions) {
        new aws.sns.TopicSubscription(`${snsSubscription.id}-subscription`, {
          topic: snsSubscription.topic_arn,
          protocol: "sqs",
          endpoint: queue.arn,
          filterPolicy: pulumi.jsonStringify(snsSubscription.filter_policy),
          filterPolicyScope: snsSubscription.filter_policy_scope,
        });
      }
    }

    /* SQS LAMBDA SUBSCRIPTION */
    new aws.lambda.EventSourceMapping(
      `${lambdaName}-event-source-sqs`,
      {
        eventSourceArn: queue.arn,
        functionName: lambdaName,
      },
      { dependsOn: nodeJSFunction }
    );
  }
};
