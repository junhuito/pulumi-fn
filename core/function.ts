import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import fflate from "fflate";
import { rimraf } from "rimraf";
import { esbuildDecorators } from 'esbuild-plugin-typescript-decorators'

interface NodeJSFunctionArgs extends aws.lambda.FunctionArgs {
  /**
   * The file path for the lambda
   */
  entry: string;
  /**
   * A custom esbuild configuration
   */
  esbuild?: esbuild.BuildOptions;
  /**
   * Zip the bundled function into a zip archive called lambda.zip
   * @default true
   */
  zip?: boolean;
}

const esbuildDefaultOpts: esbuild.BuildOptions = {
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: "node",
    target: "node18",
    outdir: "build",
    plugins: [
        esbuildDecorators(),
    ]
};  

export class NodeJSFunction extends aws.lambda.Function {
  constructor(name: string, args: NodeJSFunctionArgs) {
    const { bundle, minify, sourcemap, platform, target, outdir } =
      args.esbuild ?? esbuildDefaultOpts;

    if (!outdir) {
        throw new Error(
            "You must specify an outdir in esbuild options default to : build"
        );
    }

    const zipOutputFolder = path.resolve(process.cwd(), 'output');

    if (!fs.existsSync(zipOutputFolder)) {
      fs.mkdirSync(zipOutputFolder);
    }

    const zipOutputFilePath = path.join(zipOutputFolder, `${name}.zip`);

    // clean the outdir before running another build
    rimraf.rimrafSync(outdir);
    // delete the old zip file if exist
    rimraf.rimrafSync(zipOutputFilePath);

    esbuild.buildSync({
      entryPoints: [args.entry],
      bundle,
      minify,
      sourcemap,
      platform,
      target,
      outdir,
    });

    // by default we only have one file containing the bundled javascript code for our lambda
    const [outputFile] = fs.readdirSync(outdir);

    // we zip the code in write the lambda.zip file
    const zipContent = fflate.zipSync({
      "index.js": fs.readFileSync(
        path.resolve(process.cwd(), outdir, outputFile)
      ),
    });

    fs.writeFileSync(zipOutputFilePath, zipContent);

    const code = new pulumi.asset.FileArchive(zipOutputFilePath);

    super(name, {
      ...args,
      code: code,
      packageType: "Zip",
      runtime: aws.lambda.Runtime.NodeJS18dX,
    });
  }
}
