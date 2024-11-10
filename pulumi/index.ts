import { provisionIam } from "./iam";
// import { provisionLambdaFunctions } from "./lambda";
import { getConfigs } from "./utils/get-config";
// import { provisionSecurityGroup } from "./security-group";
// import { provisionLayers } from "./layer";
// import { provisionS3Events } from "./s3";
// import { provisionStepFunctions } from "./step-function";

const { commonConfigs, environmentConfigs } = getConfigs();

/* IAM */
const iamRole = provisionIam(commonConfigs, environmentConfigs);

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
