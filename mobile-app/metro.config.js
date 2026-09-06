const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Monitora os arquivos compartilhados no universal telemetry-core
config.watchFolders = [
  path.resolve(workspaceRoot, 'packages/telemetry-core')
];

// 2. Garante a resolução de dependências no node_modules e alias do core
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

config.resolver.extraNodeModules = {
  '@f1-dash/telemetry-core': path.resolve(workspaceRoot, 'packages/telemetry-core/src')
};

module.exports = config;
