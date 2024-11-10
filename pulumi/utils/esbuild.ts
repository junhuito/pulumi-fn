import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import fflate from "fflate";
import { rimraf } from "rimraf";
import { esbuildOutputFolderPath, layerAndLambdaZipOutputFolderPath, repoRootDirectoryPath } from "../constants";
import { NodeJSFunctionArgs } from "../interfaces";

/**
 * reference: https://blog.stackademic.com/deploying-typescript-aws-lambda-functions-with-pulumi-and-esbuild-1df0a5460e8d
 */
export class NodeJSFunction extends aws.lambda.Function {
  constructor(
    id: string,
    args: NodeJSFunctionArgs,
    opts?: pulumi.CustomResourceOptions
  ) {
    const { bundle, minify, sourcemap, platform, target, outdir } =
      args.esbuild;

    if (!outdir) {
      throw new Error(
        "You must specify an outdir in esbuild options default to : build"
      );
    }

    if (!fs.existsSync(layerAndLambdaZipOutputFolderPath)) {
      fs.mkdirSync(layerAndLambdaZipOutputFolderPath);
    }

    const zipOutputFilePath = path.join(
      layerAndLambdaZipOutputFolderPath,
      `${id}.zip`
    );

    // clean the outdir before running another build
    rimraf.rimrafSync(outdir);
    // delete the old zip file if exist
    rimraf.rimrafSync(zipOutputFilePath);

    const assetLocation = path.join(repoRootDirectoryPath, args.entry);

    esbuild.buildSync({
      entryPoints: [assetLocation],
      bundle,
      minify,
      sourcemap,
      platform,
      target,
      outdir,
    });

    // by default we only have one file containing the bundled javascript code for our lambda
    const [outputFile] = fs.readdirSync(esbuildOutputFolderPath);
    // we zip the code in write the lambda.zip file
    const zipContent = fflate.zipSync({
      "index.js": fs.readFileSync(
        path.join(esbuildOutputFolderPath, outputFile)
      ),
    });

    fs.writeFileSync(zipOutputFilePath, zipContent);

    const code = new pulumi.asset.FileArchive(zipOutputFilePath);

    super(
      id,
      {
        ...args,
        code: code,
        packageType: "Zip",
      },
      opts
    );
  }
}
