
import * as aws from "@pulumi/aws";
import esbuild from "esbuild";

export interface NodeJSFunctionArgs extends aws.lambda.FunctionArgs {
  /**
   * The file path for the lambda
   */
  entry: string;
  /**
   * A custom esbuild configuration
   */
  esbuild: esbuild.BuildOptions;
  /**
   * Zip the bundled function into a zip archive called lambda.zip
   * @default true
   */
  zip?: boolean;
}