import { provisionIam } from "./iam";
// import { provisionLambdaFunctions } from "./lambda";
// import { getConfigs } from "./utils/get-pulsifi-config";
// import { provisionSecurityGroup } from "./security-group";
// import { provisionLayers } from "./layer";
// import { provisionS3Events } from "./s3";
// import { provisionStepFunctions } from "./step-function";

// const { commonConfigs, environmentConfigs } = getConfigs();

/* IAM */
console.log('Workload info...', process.env.WORKLOAD_INFO)
// provisionIam();

// /* SECURITY GROUP */
// const securityGroup = provisionSecurityGroup(
//   commonConfigs,
//   environmentConfigs
// );

// /* LAYERS */
// const layers = provisionLayers(commonConfigs, environmentConfigs);

// /* LAMBDA */
// const lambdaDependencies = {
//   iamRole,
//   securityGroup,
//   layers,
// };

// const lambdaFunctions = provisionLambdaFunctions(
//   commonConfigs,
//   environmentConfigs,
//   lambdaDependencies,
// );

// /* S3 Events */
// provisionS3Events();

// /* STEP FUNCTIONS */
// const stepFunctionDependencies = {
//   iamRole,
//   lambdaFunctions,
// }

// provisionStepFunctions(commonConfigs, environmentConfigs, stepFunctionDependencies);





const accounts = [
  {
    name: "AccountA",
    region: "us-east-1" as aws.Region,
    awsAccountId: "<ACCOUNT_A_ID>",
    s3Bucket: "pulumi-backend-account-a",
    stackName: "stack-a"
  },
  {
    name: "AccountB",
    region: "us-west-2" as aws.Region,
    awsAccountId: "<ACCOUNT_B_ID>",
    s3Bucket: "pulumi-backend-account-b",
    stackName: "stack-b"
  },
  // Add more accounts as needed
];


import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface TenantConfig {
    account: string;
    region: aws.Region;
    abbr: string;
}

// Function to retrieve tenant configurations from SSM in the parent account
async function getTenantConfigs(): Promise<Array<TenantConfig>> {
    const ssmConfig = aws.ssm.Parameter.get("tenant-configs", "/configs/deployment/sandbox/434343955077-ap-southeast-1").value;
    
    return new Promise((resolve) => ssmConfig.apply((config) => resolve(JSON.parse(config)))) 
}

pulumi.runtime.runInPulumiStack(async () => {
    const tenantConfigs = await getTenantConfigs();

    tenantConfigs.forEach(config => {
        const provider = new aws.Provider(`tenant-provider-${config.account}`, {
            region: config.region,
            assumeRole: {
                roleArn: `arn:aws:iam::${config.account}:role/YourDeploymentRole`,
            },
        });

        // Deploy resources in the tenant's account using this provider
        const bucket = new aws.s3.Bucket(`tenant-${config.account}-bucket`, {}, { provider });
    });
});
