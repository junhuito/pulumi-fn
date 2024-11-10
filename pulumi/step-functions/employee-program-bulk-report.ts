export default {
  StartAt: "EmployeeProgramBulkReport",
  States: {
    EmployeeProgramBulkReport: {
      Next: "CheckEmployeeProgramBulkReportIsEmptyOutput",
      Type: "Map",
      ItemsPath: "$",
      ItemProcessor: {
        ProcessorConfig: {
          Mode: "DISTRIBUTED",
          ExecutionType: "EXPRESS",
        },
        StartAt: "RenderProgramReport",
        States: {
          RenderProgramReport: {
            Type: "Task",
            Resource: "arn:aws:states:::lambda:invoke",
            OutputPath: "$.Payload",
            Parameters: {
              "Payload.$": "$",
              FunctionName:
                "arn:aws:lambda:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:function:pulumi-spike-function-v2-{{AWS_REGION_ABBR}}:$LATEST",
            },
            Retry: [
              {
                ErrorEquals: ["Lambda.TooManyRequestsException"],
                IntervalSeconds: 10,
                MaxAttempts: 6,
                BackoffRate: 2,
              },
              {
                ErrorEquals: ["States.ALL"],
                IntervalSeconds: 2,
                MaxAttempts: 6,
                BackoffRate: 2,
              },
            ],
            End: true,
          },
        },
      },
      Label: "DistributedMap",
      ItemBatcher: {
        MaxItemsPerBatch: 3,
        BatchInput: {
          "Key.$": "$.key",
        },
      },
      ItemReader: {
        Resource: "arn:aws:states:::s3:getObject",
        ReaderConfig: {
          InputType: "JSON",
        },
        Parameters: {
          "Bucket.$": "$.bucket",
          "Key.$": "$.key",
        },
      },
      ResultSelector: {
        "data.$": "$.[0]",
      },
    },
    CheckEmployeeProgramBulkReportIsEmptyOutput: {
      Type: "Choice",
      Choices: [
        {
          Variable: "$.data",
          IsNull: false,
          Next: "ProcessOutputResult",
        },
      ],
      Default: "EndEmployeeProgramBulkReport",
    },
    EndEmployeeProgramBulkReport: {
      Type: "Pass",
      End: true,
    },
    ProcessOutputResult: {
      Next: "ReportReadyNotification",
      Type: "Pass",
      Parameters: {
        "report_uploaded_path.$": "$.data.key",
        "download_zip_file_name.$": "$.data.download_zip_file_name",
        "user_email.$": "$.data.user_email",
        "user_account_id.$": "$.data.user_account_id",
        "email_communication_type.$": "$.data.email_communication_type",
        "company_id.$": "$.data.company_id",
        "first_name.$": "$.data.user_first_name",
        "notification_type.$": "$.data.notification_type",
        "participant_id.$": "$.data.participant_id",
      },
    },
    ReportReadyNotification: {
      End: true,
      Type: "Task",
      Resource: "arn:aws:states:::lambda:invoke",
      OutputPath: "$",
      Parameters: {
        "Payload.$": "$",
        FunctionName:
          "arn:aws:lambda:{{AWS_REGION}}:{{AWS_ACCOUNT_ID}}:function:pulumi-spike-function-{{AWS_REGION_ABBR}}:$LATEST",
      },
      Retry: [
        {
          ErrorEquals: ["States.ALL"],
          IntervalSeconds: 2,
          MaxAttempts: 3,
          BackoffRate: 2,
        },
      ],
    },
  },
};
