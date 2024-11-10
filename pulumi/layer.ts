import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";
import { CommonConfig, EnvironmentConfig } from "./interfaces";
import { pulumiFolderPath, repoRootDirectoryPath } from "./constants";

export const provisionLayers = (commonConfig: CommonConfig, environmentConfigs: EnvironmentConfig) => {
    const layerConfigs = environmentConfigs.aws.layers;
    const layers: aws.lambda.LayerVersion[] = [];

    for (const layerConfig of layerConfigs) {
        const layerName = `${layerConfig.name}-${commonConfig.aws.aws_region_abbr}`;

        const layerPath = path.join(repoRootDirectoryPath, layerConfig.entry);
        const bundleLayer = new pulumi.asset.FileArchive(layerPath);
        
        const layer = new aws.lambda.LayerVersion(layerConfig.id, {
            code: bundleLayer,
            layerName: layerName,
            compatibleRuntimes: layerConfig.compatible_runtimes,
        });

        layers.push(layer);
    }

    return layers;
}
