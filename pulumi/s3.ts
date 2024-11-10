import * as aws from "@pulumi/aws";
import { S3EventsNotificationConfig } from "./interfaces/config-interface";
import { NodeJSFunction } from "./utils/esbuild";
import { omit, uniqBy } from "lodash";

type S3EventNotificationsCollection = (aws.types.input.s3.BucketNotificationLambdaFunction & { lambdaName: string, lambdaFunction: NodeJSFunction });

const s3EventNotificationsCollection: Record<string, S3EventNotificationsCollection[]> = {};

export const addS3EventsNotificationsToNotificationsCollection = (
  s3EventsNotificationsConfigs: S3EventsNotificationConfig[],
  lambdaFunction: NodeJSFunction,
  lambdaName: string,
) => {
  s3EventsNotificationsConfigs.forEach((s3EventsNotificationsConfig) => {
    const bucketNameKey = s3EventsNotificationsConfig.bucket_name;

    s3EventsNotificationsConfig.notifications.forEach((notification) => {

      const bucketNotification: S3EventNotificationsCollection = {
        lambdaFunctionArn: lambdaFunction.arn,
        events: notification.events,
        filterPrefix: notification.filter_prefix,
        filterSuffix: notification.filter_suffix,
        lambdaName,
        lambdaFunction,
      };

      if (!s3EventNotificationsCollection[bucketNameKey]) {
        s3EventNotificationsCollection[bucketNameKey] = []
      }

      s3EventNotificationsCollection[bucketNameKey].push(bucketNotification);
    });
  });
};

export const provisionS3Events = () => {
  for (const [bucketName, s3EventNotifications] of Object.entries(s3EventNotificationsCollection)) {
    const s3Bucket = aws.s3.Bucket.get(
      `${bucketName}-id`,
      bucketName
    );

    /**
     * Ensure all Lambda functions within the same S3 event notification collection are unique 
     * to prevent provisioning duplicate Lambda permissions for a single bucket.
     */
    const uniqueLambdaS3EventNotifications = uniqBy(s3EventNotifications, (s3EventNotification) => s3EventNotification.lambdaName);

    const permissions = uniqueLambdaS3EventNotifications.map((uniqueLambdaS3EventNotification) => {
      return new aws.lambda.Permission(`${bucketName}-${uniqueLambdaS3EventNotification.lambdaName}-permission`, {
        action: "lambda:InvokeFunction",
        function: uniqueLambdaS3EventNotification.lambdaFunctionArn!,
        principal: "s3.amazonaws.com",
        sourceArn: s3Bucket.arn,
      }, { dependsOn: uniqueLambdaS3EventNotification.lambdaFunction });
    });

    new aws.s3.BucketNotification(`${bucketName}-notification`, {
      bucket: s3Bucket.id,
      lambdaFunctions: s3EventNotifications.map((notification) => {
        const s3EventNotification = omit(notification, ['lambdaName', 'lambdaFunction']);
        
        return s3EventNotification;
      }),
    }, { dependsOn: permissions });
  }
};