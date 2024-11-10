import path from 'path';

export const repoRootDirectoryPath = path.resolve('../');
export const pulumiFolderPath = path.join(repoRootDirectoryPath, 'pulumi');
export const esbuildOutputFolderPath = path.join(pulumiFolderPath, 'esbuild-output');
export const layerAndLambdaZipOutputFolderPath = path.join(pulumiFolderPath, 'output');
