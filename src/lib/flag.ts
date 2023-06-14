import { flags } from '@oclif/command';
import { loadGlobalConfig } from '../config';

export const signer = flags.string({ default: 'test1' });

const globalConfig = loadGlobalConfig();

export const noRebuild = flags.boolean({
  description: 'deploy the wasm bytecode as is.',
  default: false,
});

export const instanceId = flags.string({ default: 'default', description: 'enable management of multiple instances of the same contract' });

export const network = flags.string({ default: globalConfig.network || 'localterra', description: 'network to deploy to from config.terrain.json', options: ['mainnet', 'testnet', 'localterra'] });

export const prefix = flags.string({ default: globalConfig.prefix || 'terra', description: 'address prefix of target chain, all chains supported by Station are supported by terrain' });

export const memo = flags.string({ default: 'terrain' });

export const codeId = flags.integer({ description: 'specific codeId to instantiate', default: 0 });

export const configPath = flags.string({ default: './config.terrain.json' });

export const refsPath = flags.string({ default: './refs.terrain.json' });

export const keysPath = flags.string({ default: './keys.terrain.js' });

export const frontendRefsPath = flags.string({
  default: './frontend/src/',
});

// These three are commonly used together.
export const terrainPaths = {
  'refs-path': refsPath,
  'keys-path': keysPath,
};

export const tx = {
  signer,
  network,
  prefix,
};
