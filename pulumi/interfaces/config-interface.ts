import type esbuild from "esbuild";

export interface IamRoleConfig {
  id: string;
  name: string;
  assume_role_policy: Record<string, unknown>;
  customer_managed_policies: {
    policy_name: string;
    policy_statement: Record<string, unknown>;
  }[];
  aws_managed_policies: string[];
};

export interface LambdaFunctionEnvironmentVariables {
  name: string;
  value: string | null;
  ssm_parameter_name: string | null;
};

export interface NodeJsFunctionConfig {
  id: string;
  entry: string;
  handler: string;
  name: string;
  environment_variables: LambdaFunctionEnvironmentVariables[];
  skip_destroy?: boolean;
  s3_events_notifications?: S3EventsNotificationConfig[];
  memory_size?: number;
  architectures?: string[];
  timeout?: number;
  runtime: string;
  description: string;
  sqs?: SqsConfig[];
}

export interface S3EventsNotificationConfig {
  bucket_name: string;
  notifications: {
    events: string[];
    filter_prefix?: string;
    filter_suffix?: string;
  }[];
}

export interface AlarmConfig {
  metric_name: string;
  namespace: string;
  threshold: number;
  comparison_operator: string;
  evaluation_periods: number;
  datapoints_to_alarm: number;
  treat_missing_data: string;
  statistic: string;
  health_topic: string;
}

export interface LogGroupConfig {
  log_retention_days: {
    sandbox: number;
    staging: number;
    production: number;
  };
  skip_destroy?: boolean;
}

export interface SqsConfig {
  id: string;
  name: string;
  fifo_queue?: boolean;
  content_based_deduplication?: boolean;
  delay_seconds?: number;
  visibility_timeout_seconds?: number;
  message_retention_seconds?: number;
  dlq_max_receive_count?: number;
  deduplication_scope?: string;
  fifo_throughput_limit?: string;
  access_policy: {
    id: string;
    statements: {
      effect: string;
      principals: {
        type: string;
        identifiers: string[];
      }[];
      actions: string[];
      conditions: {
        test: string;
        variable: string;
        values: string[];
      }[];
    }[];
  };
  sns_subscriptions?: {
    id: string;
    topic_arn: string;
    filter_policy: {
      event_type: {
        allowlist: string[];
      };
    };
    filter_policy_scope: string;
  }[];
}

export interface LayerConfig {
  id: string;
  entry: string;
  name: string;
  compatible_runtimes: string[];
}

export interface SecurityGroupConfig {
  id: string;
  name: string;
  security_group_name: string;
  outbound_rules: {
    name: string;
    type: string;
    to_port: number;
    protocol: string;
    cidr_blocks?: string[];
    from_port: number;
    description: string;
  }[];
  inbound_rules?: {
    description?: string;
    protocol: string;
    from_port: number;
    to_port: number;
    self?: boolean;
  }[];
}

export interface AWSCommonConfig {
  aws_region: string;
  aws_region_abbr: string;
  aws_environment: string;
  resource_owner: string;
  build_version: string;
  aws_account_id: string;
  lambda_function: LambdaFunctionCommonConfig;
}

export interface LambdaFunctionCommonConfig {
  runtime: string;
  architectures: string[];
  environment_variables: LambdaFunctionEnvironmentVariables[];
  esbuild: esbuild.BuildOptions;
  alarm: AlarmConfig;
}


export interface CommonConfig {
  aws: AWSCommonConfig;
}

export interface StepFunctionConfig {
  id: string;
  name: string;
  definition: string;
}

export interface EnvironmentConfig {
  aws: {
    iam: IamRoleConfig;
    lambda_functions: NodeJsFunctionConfig[];
    lambda_log_group: LogGroupConfig;
    layers: LayerConfig[];
    security_group: SecurityGroupConfig;
    step_functions: StepFunctionConfig[];
  }
}
