import { flags } from '@oclif/command';

export const signer = flags.string({ default: 'test1' });

export const noRebuild = flags.boolean({
  description: 'deploy the wasm bytecode as is.',
  default: false,
});

export const instanceId = flags.string({ default: 'default', description: 'enable management of multiple instances of the same contract' });

export const network = flags.string({ default: 'localterra', description: 'network to deploy to from config.terrain.json' });

export const prefix = flags.string({ default: 'terra', description: 'address prefix of target chain' });

export const configPath = flags.string({ default: './config.terrain.json' });

export const refsPath = flags.string({ default: './refs.terrain.json' });

export const keysPath = flags.string({ default: './keys.terrain.js' });

export const frontendRefsPath = flags.string({
  default: './frontend/src/',
});

// These three are commonly used together.
export const terrainPaths = {
  'config-path': configPath,
  'refs-path': refsPath,
  'keys-path': keysPath,
};
